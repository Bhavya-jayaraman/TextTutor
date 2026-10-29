/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  Edit3,
  Target,
  Bell,
  Grid,
  Check,
  AlertCircle,
  Loader2,
  CalendarDays,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award,
} from 'lucide-react';
import { ThemeMode } from '../../types/dashboard.js';
import { clientPlannerService, StudyPlanItem, StudyTask } from '../../services/clientPlannerService.js';
import { clientNotificationService, NotificationItem } from '../../services/clientNotificationService.js';

interface StudyPlannerViewProps {
  theme: ThemeMode;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  // Navigation tabs: 'planner' | 'calendar' | 'goals' | 'notifications'
  const [tab, setTab] = useState<'planner' | 'calendar' | 'goals' | 'notifications'>('planner');

  // Study Plans State
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State (Add / Edit Plan)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [planCategory, setPlanCategory] = useState('Computer Science');
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [planEndDate, setPlanEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [planGoal, setPlanGoal] = useState('2 hours daily study');
  const [planDuration, setPlanDuration] = useState<number>(120);
  const [planPriority, setPlanPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [saving, setSaving] = useState(false);

  // Calendar State
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Fetch Study Plans
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await clientPlannerService.getPlans();
      if (res.success && res.plans) {
        setPlans(res.plans);
      }
    } catch (err) {
      console.error('Error fetching study plans:', err);
      setError('Failed to load study plans.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await clientNotificationService.getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchNotifications();
  }, []);

  // Reset Modal Form
  const handleOpenAddModal = () => {
    setEditingPlanId(null);
    setPlanTitle('');
    setPlanCategory('Computer Science');
    setPlanStartDate(new Date().toISOString().split('T')[0]);
    setPlanEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPlanGoal('2 hours daily study');
    setPlanDuration(120);
    setPlanPriority('High');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (plan: StudyPlanItem) => {
    setEditingPlanId(plan.id);
    setPlanTitle(plan.title);
    setPlanCategory(plan.category);
    setPlanStartDate(plan.start_date);
    setPlanEndDate(plan.end_date);
    setPlanGoal(plan.daily_goal);
    setPlanDuration(plan.daily_duration_minutes);
    setPlanPriority(plan.priority);
    setIsModalOpen(true);
  };

  // Save Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;
    setSaving(true);
    setError(null);

    try {
      if (editingPlanId) {
        const res = await clientPlannerService.updatePlan(editingPlanId, {
          title: planTitle,
          category: planCategory,
          start_date: planStartDate,
          end_date: planEndDate,
          daily_goal: planGoal,
          daily_duration_minutes: Number(planDuration),
          priority: planPriority,
        });

        if (res.success && res.plan) {
          setPlans((prev) => prev.map((p) => (p.id === editingPlanId ? res.plan! : p)));
          setIsModalOpen(false);
        }
      } else {
        const res = await clientPlannerService.createPlan({
          title: planTitle,
          category: planCategory,
          start_date: planStartDate,
          end_date: planEndDate,
          daily_goal: planGoal,
          daily_duration_minutes: Number(planDuration),
          priority: planPriority,
          tasks: [
            { id: Date.now().toString(), title: `Initial session for ${planTitle}`, time: '09:00 AM', completed: false, priority: planPriority },
          ],
        });

        if (res.success && res.plan) {
          setPlans((prev) => [res.plan!, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error saving study plan:', err);
      setError('Failed to save study plan.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this study plan?')) return;
    try {
      const res = await clientPlannerService.deletePlan(id);
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  // Toggle Task Completion inside Plan
  const handleToggleTask = async (plan: StudyPlanItem, taskId: string) => {
    const updatedTasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    const allCompleted = updatedTasks.every((t) => t.completed);

    try {
      const res = await clientPlannerService.updatePlan(plan.id, {
        tasks: updatedTasks,
        completed: allCompleted,
      });

      if (res.success && res.plan) {
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? res.plan! : p)));
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Add Task to existing Plan
  const handleAddTaskToPlan = async (plan: StudyPlanItem, taskTitle: string, taskTime: string) => {
    if (!taskTitle.trim()) return;
    const newTask: StudyTask = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      time: taskTime || '10:00 AM',
      completed: false,
      priority: plan.priority,
    };

    const updatedTasks = [...plan.tasks, newTask];
    try {
      const res = await clientPlannerService.updatePlan(plan.id, {
        tasks: updatedTasks,
        completed: false,
      });

      if (res.success && res.plan) {
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? res.plan! : p)));
      }
    } catch (err) {
      console.error('Error adding task to plan:', err);
    }
  };

  // Calendar Helpers
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarMonthName = currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Main Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <CalendarIcon className="w-6 h-6 text-[#818cf8]" />
            <span>AI Study Planner & Schedule</span>
          </h1>
          <p className="text-xs text-[#94a3b8]">
            Plan study goals, organize daily review agendas, track upcoming deadlines, and set reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${isDark ? 'bg-[#050505] border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setTab('planner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                tab === 'planner'
                  ? 'bg-[#818cf8] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Plans ({plans.length})</span>
            </button>

            <button
              onClick={() => setTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                tab === 'calendar'
                  ? 'bg-[#818cf8] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setTab('goals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                tab === 'goals'
                  ? 'bg-[#818cf8] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Goals</span>
            </button>

            <button
              onClick={() => setTab('notifications')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                tab === 'notifications'
                  ? 'bg-[#818cf8] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Reminders ({notifications.filter((n) => !n.is_read).length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-[#818cf8] hover:bg-[#6366f1] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(129,140,248,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Study Plan</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline font-semibold hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 1. PLANNER & SESSIONS TAB */}
      {/* ---------------------------------------------------------------------- */}
      {tab === 'planner' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#818cf8] animate-spin mx-auto" />
              <p className="text-xs text-[#94a3b8]">Loading study plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className={`p-12 rounded-3xl border text-center space-y-4 ${isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="w-12 h-12 rounded-2xl bg-[#818cf8]/20 border border-[#818cf8]/40 flex items-center justify-center text-[#818cf8] mx-auto">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No Study Plans Yet</h3>
                <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
                  Create your first structured study plan with target durations, priorities, and daily task agendas.
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                + Create Study Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const completedTasksCount = plan.tasks.filter((t) => t.completed).length;
                const totalTasksCount = plan.tasks.length;
                const percentDone = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

                return (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-2xl border space-y-5 flex flex-col justify-between transition-all ${
                      isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#818cf8] px-2.5 py-0.5 rounded bg-[#818cf8]/10 border border-[#818cf8]/20">
                          {plan.category}
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              plan.priority === 'High'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                : plan.priority === 'Medium'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {plan.priority}
                          </span>

                          <button
                            onClick={() => handleOpenEditModal(plan)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Edit Plan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.title}</h3>
                        <p className="text-xs text-[#94a3b8] mt-1 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#818cf8]" />
                          <span>{plan.daily_goal} ({plan.daily_duration_minutes} mins/day)</span>
                        </p>
                      </div>

                      {/* Date Range & Progress */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>Start: {plan.start_date}</span>
                          <span>End: {plan.end_date}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                            Progress ({completedTasksCount}/{totalTasksCount} tasks)
                          </span>
                          <span className="text-[#818cf8] font-mono">{percentDone}%</span>
                        </div>

                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentDone}%` }}
                            className="h-full bg-[#818cf8] rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-xs font-bold text-slate-300 block">Daily Agenda Tasks:</span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {plan.tasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => handleToggleTask(plan, task.id)}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                task.completed
                                  ? 'bg-white/5 border-white/5 opacity-50 line-through'
                                  : isDark
                                  ? 'bg-[#050505] border-white/10 text-slate-200'
                                  : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                    task.completed ? 'bg-[#818cf8] border-[#818cf8] text-white' : 'border-white/20'
                                  }`}
                                >
                                  {task.completed && <Check className="w-3 h-3" />}
                                </div>
                                <span>{task.title}</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#94a3b8]">{task.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Add Task Input */}
                    <div className="pt-3 border-t border-white/10">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const input = form.elements.namedItem('taskTitle') as HTMLInputElement;
                          const timeInput = form.elements.namedItem('taskTime') as HTMLInputElement;
                          if (input.value) {
                            handleAddTaskToPlan(plan, input.value, timeInput.value);
                            input.value = '';
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          name="taskTitle"
                          placeholder="Add session task..."
                          className={`flex-1 px-3 py-1.5 rounded-xl text-xs focus:outline-none ${
                            isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'
                          }`}
                        />
                        <input
                          type="text"
                          name="taskTime"
                          defaultValue="10:00 AM"
                          className={`w-20 px-2 py-1.5 rounded-xl text-[11px] font-mono focus:outline-none ${
                            isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'
                          }`}
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[#818cf8] text-white text-xs font-bold rounded-xl hover:bg-[#6366f1]"
                        >
                          + Add
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. CALENDAR VIEW TAB */}
      {/* ---------------------------------------------------------------------- */}
      {tab === 'calendar' && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
            isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Calendar Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setCurrentCalendarDate(
                    new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1)
                  )
                }
                className="p-1.5 rounded-xl border border-white/10 hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4 text-slate-300" />
              </button>
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {calendarMonthName}
              </h2>
              <button
                onClick={() =>
                  setCurrentCalendarDate(
                    new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1)
                  )
                }
                className="p-1.5 rounded-xl border border-white/10 hover:bg-white/5"
              >
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Calendar Mode:</span>
              <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
                {['month', 'week', 'day'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCalendarViewMode(m as any)}
                    className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                      calendarViewMode === m ? 'bg-[#818cf8] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Calendar Grid */}
          {calendarViewMode === 'month' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#818cf8] py-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {/* Empty leading days */}
                {Array.from({ length: firstDayOfMonth(currentCalendarDate) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 rounded-2xl bg-white/5 opacity-20 border border-transparent" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth(currentCalendarDate) }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday =
                    dayNum === new Date().getDate() &&
                    currentCalendarDate.getMonth() === new Date().getMonth() &&
                    currentCalendarDate.getFullYear() === new Date().getFullYear();

                  // Find plans scheduled for or overlapping this day
                  const activeOnDay = plans.filter((p) => {
                    const start = new Date(p.start_date).getDate();
                    const end = new Date(p.end_date).getDate();
                    return dayNum >= start && dayNum <= end;
                  });

                  return (
                    <div
                      key={dayNum}
                      className={`h-24 p-2 rounded-2xl border flex flex-col justify-between transition-all ${
                        isToday
                          ? 'border-[#818cf8] bg-[#818cf8]/10 shadow-[0_0_15px_rgba(129,140,248,0.2)]'
                          : isDark
                          ? 'bg-[#050505] border-white/5'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                            isToday ? 'bg-[#818cf8] text-white' : 'text-slate-400'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {activeOnDay.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-[#818cf8] animate-pulse" />
                        )}
                      </div>

                      <div className="space-y-1 overflow-hidden">
                        {activeOnDay.slice(0, 2).map((p) => (
                          <div
                            key={p.id}
                            className="text-[9px] font-bold truncate px-1.5 py-0.5 rounded bg-[#818cf8]/20 text-[#818cf8] border border-[#818cf8]/30"
                          >
                            {p.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Agenda View */}
          {calendarViewMode !== 'month' && (
            <div className="space-y-4">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Clock className="w-4 h-4 text-[#818cf8]" />
                <span>Daily Study Sessions Agenda</span>
              </h3>

              <div className="space-y-3">
                {plans.flatMap((p) => p.tasks).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No study sessions scheduled for today.</p>
                ) : (
                  plans.flatMap((p) => p.tasks).map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex items-center justify-between ${
                        isDark ? 'bg-[#050505] border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-bold ${t.completed ? 'line-through text-slate-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                          {t.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#818cf8]" />
                          <span>{t.time}</span>
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          t.priority === 'High'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            : 'bg-[#818cf8]/15 text-[#818cf8] border border-[#818cf8]/20'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. GOALS TAB */}
      {/* ---------------------------------------------------------------------- */}
      {tab === 'goals' && (
        <div className="space-y-6">
          <div
            className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
              isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Target className="w-5 h-5 text-[#818cf8]" />
                <span>Learning & Retention Goals</span>
              </h2>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                4 Active Goals
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Study 2 Hours Daily', current: 1.8, target: 2.0, unit: 'hrs', desc: 'Maintain consistent daily focus time.', color: 'bg-[#818cf8]' },
                { title: 'Complete 5 Notes This Week', current: 4, target: 5, unit: 'notes', desc: 'Synthesize lecture & reading material.', color: 'bg-emerald-400' },
                { title: 'Review 20 Flashcards', current: 18, target: 20, unit: 'cards', desc: 'Practice spaced repetition memory retrieval.', color: 'bg-amber-400' },
                { title: 'Finish 3 Quizzes', current: 3, target: 3, unit: 'quizzes', desc: 'Test active recall mastery on key concepts.', color: 'bg-purple-400' },
              ].map((g, idx) => {
                const percent = Math.min(Math.round((g.current / g.target) * 100), 100);
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-[#050505] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{g.title}</h3>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">{g.desc}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#818cf8] bg-[#818cf8]/10 px-2.5 py-1 rounded-lg">
                        {percent}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Progress</span>
                        <span>{g.current} / {g.target} {g.unit}</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div style={{ width: `${percent}%` }} className={`h-full ${g.color} rounded-full`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. NOTIFICATIONS TAB */}
      {/* ---------------------------------------------------------------------- */}
      {tab === 'notifications' && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
            isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Bell className="w-5 h-5 text-amber-400" />
              <span>Study Reminders & Notifications</span>
            </h2>
            <button
              onClick={async () => {
                await clientNotificationService.markAllAsRead();
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
              }}
              className="text-xs text-[#818cf8] font-bold hover:underline"
            >
              Mark All as Read
            </button>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No notifications currently.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                    notif.is_read
                      ? 'opacity-60 bg-white/5 border-white/5'
                      : isDark
                      ? 'bg-[#050505] border-[#818cf8]/30 shadow-sm'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{notif.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{notif.message}</p>
                  </div>

                  {!notif.is_read && (
                    <button
                      onClick={async () => {
                        await clientNotificationService.markAsRead(notif.id);
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                        );
                      }}
                      className="text-[10px] font-bold text-[#818cf8] hover:underline shrink-0"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* ADD / EDIT PLAN MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 relative ${
              isDark ? 'bg-[#111115] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#818cf8]" />
                <span>{editingPlanId ? 'Edit Study Plan' : 'Create New Study Plan'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Plan Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems & Raft Consensus"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none ${
                    isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category:</label>
                  <input
                    type="text"
                    value={planCategory}
                    onChange={(e) => setPlanCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none ${
                      isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority:</label>
                  <select
                    value={planPriority}
                    onChange={(e) => setPlanPriority(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none ${
                      isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date:</label>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none ${
                      isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date:</label>
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none ${
                      isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daily Goal Label:</label>
                  <input
                    type="text"
                    value={planGoal}
                    onChange={(e) => setPlanGoal(e.target.value)}
                    placeholder="e.g. 2 hours daily study"
                    className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none ${
                      isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Mins):</label>
                  <input
                    type="number"
                    value={planDuration}
                    onChange={(e) => setPlanDuration(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none ${
                      isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingPlanId ? 'Update Plan' : 'Create Plan'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
