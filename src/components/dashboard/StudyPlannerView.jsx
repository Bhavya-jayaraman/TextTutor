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
  Check,
  AlertCircle,
  Loader2,
  ListOrdered,
  X,
  BookOpen,
  Award,
} from 'lucide-react';
import { clientPlannerService } from '../../services/clientPlannerService.js';

export const StudyPlannerView = ({ theme }) => {
  const isDark = theme === 'dark';

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'completed'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planTitle, setPlanTitle] = useState('');
  const [planCategory, setPlanCategory] = useState('Computer Science');
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [planEndDate, setPlanEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [planGoal, setPlanGoal] = useState('2 hours daily review');
  const [planDuration, setPlanDuration] = useState(90);
  const [planPriority, setPlanPriority] = useState('High');
  const [taskList, setTaskList] = useState([
    { id: '1', title: 'Review lecture slides & definitions', time: '10:00 AM', completed: false, priority: 'High' },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientPlannerService.getPlans();
      if (res.success && Array.isArray(res.plans)) {
        setPlans(res.plans);
      } else {
        setError('Failed to load study plans.');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Could not connect to planner service. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenAddModal = () => {
    setEditingPlanId(null);
    setPlanTitle('');
    setPlanCategory('Computer Science');
    setPlanStartDate(new Date().toISOString().split('T')[0]);
    setPlanEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPlanGoal('2 hours daily review');
    setPlanDuration(90);
    setPlanPriority('High');
    setTaskList([
      { id: Date.now().toString(), title: 'Initial concept review & flashcard drill', time: '10:00 AM', completed: false, priority: 'High' },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlanId(plan.id);
    setPlanTitle(plan.title || '');
    setPlanCategory(plan.category || 'General');
    setPlanStartDate(plan.start_date || new Date().toISOString().split('T')[0]);
    setPlanEndDate(plan.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPlanGoal(plan.daily_goal || '');
    setPlanDuration(plan.daily_duration_minutes || 60);
    setPlanPriority(plan.priority || 'Medium');
    setTaskList(Array.isArray(plan.tasks) && plan.tasks.length > 0 ? plan.tasks : []);
    setIsModalOpen(true);
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    setTaskList((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newTaskInput.trim(), time: '02:00 PM', completed: false, priority: 'Medium' },
    ]);
    setNewTaskInput('');
  };

  const handleRemoveTask = (taskId) => {
    setTaskList((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: planTitle.trim(),
        category: planCategory.trim(),
        start_date: planStartDate,
        end_date: planEndDate,
        daily_goal: planGoal.trim(),
        daily_duration_minutes: Number(planDuration) || 60,
        priority: planPriority,
        tasks: taskList,
      };

      if (editingPlanId) {
        const res = await clientPlannerService.updatePlan(editingPlanId, payload);
        if (res.success && res.plan) {
          setPlans((prev) => prev.map((p) => (p.id === editingPlanId ? res.plan : p)));
          setIsModalOpen(false);
        }
      } else {
        const res = await clientPlannerService.createPlan(payload);
        if (res.success && res.plan) {
          setPlans((prev) => [res.plan, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error saving study plan:', err);
      setError('Failed to save study plan. Please verify form details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study plan?')) return;
    try {
      const res = await clientPlannerService.deletePlan(id);
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete study plan:', err);
      setError('Failed to delete study plan.');
    }
  };

  const handleToggleComplete = async (plan) => {
    const newCompleted = !plan.completed;
    try {
      const res = await clientPlannerService.toggleComplete(plan.id, newCompleted);
      if (res.success && res.plan) {
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? res.plan : p)));
      }
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleToggleTaskItem = async (plan, taskId) => {
    const updatedTasks = (plan.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const allCompleted = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);

    try {
      const res = await clientPlannerService.updatePlan(plan.id, {
        tasks: updatedTasks,
        completed: allCompleted,
      });
      if (res.success && res.plan) {
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? res.plan : p)));
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (filterTab === 'active') return !p.completed;
    if (filterTab === 'completed') return p.completed;
    return true;
  });

  const completedCount = plans.filter((p) => p.completed).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            <span>Study Planner & Schedules</span>
          </h1>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Organize study sessions, set duration targets, track daily milestones, and monitor completion.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Study Plan</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
          {[
            { key: 'all', label: `All Plans (${plans.length})` },
            { key: 'active', label: `Active (${plans.length - completedCount})` },
            { key: 'completed', label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filterTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-dim)] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--text-dim)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{completedCount} of {plans.length} finished</span>
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-dim)]">Loading study plans from database...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center space-y-4 ${isDark ? 'border-white/10 bg-[#0f172a]/40' : 'border-slate-200 bg-white'}`}>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No {filterTab !== 'all' ? filterTab : ''} study plans found
            </h3>
            <p className="text-xs text-[var(--text-dim)] mt-1 max-w-sm mx-auto">
              Create a targeted study plan to pace your learning, schedule review sessions, and track milestones.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const tasks = plan.tasks || [];
            const doneTasks = tasks.filter((t) => t.completed).length;
            const progressPct =
              tasks.length > 0
                ? Math.round((doneTasks / tasks.length) * 100)
                : plan.completed
                ? 100
                : 0;

            const priorityColor =
              plan.priority === 'High'
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                : plan.priority === 'Low'
                ? 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                  plan.completed
                    ? isDark
                      ? 'bg-[#0f172a]/30 border-white/5 opacity-80'
                      : 'bg-slate-50/70 border-slate-200 opacity-85'
                    : isDark
                    ? 'bg-[#0f172a]/70 border-white/10 hover:border-white/20'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${priorityColor}`}
                    >
                      {plan.priority || 'Medium'} Priority
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(plan)}
                        title="Edit plan"
                        className="p-1 hover:text-indigo-400 text-[var(--text-dim)] transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        title="Delete plan"
                        className="p-1 hover:text-rose-400 text-[var(--text-dim)] transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3
                      className={`text-base font-bold line-clamp-1 ${
                        plan.completed
                          ? 'line-through text-[var(--text-dim)]'
                          : isDark
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}
                    >
                      {plan.title}
                    </h3>
                    <p className="text-[11px] text-indigo-400 font-medium mt-0.5">{plan.category}</p>
                  </div>

                  {plan.daily_goal && (
                    <p className="text-xs text-[var(--text-dim)] line-clamp-2 leading-relaxed">
                      {plan.daily_goal}
                    </p>
                  )}
                </div>

                {/* Progress Bar & Subtasks */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-dim)]">Progress</span>
                      <span className="font-semibold text-indigo-400">{progressPct}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks Checklist */}
                  {tasks.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTaskItem(plan, task.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition ${
                            task.completed
                              ? 'line-through text-[var(--text-dim)] bg-white/[0.02]'
                              : isDark
                              ? 'hover:bg-white/5 text-slate-200'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                              task.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-white/30'
                            }`}
                          >
                            {task.completed && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="truncate flex-1">{task.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Plan Footer Metadata & Toggle Complete */}
                  <div className="pt-3 border-t border-theme flex items-center justify-between gap-2 text-[11px] text-[var(--text-dim)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>{plan.daily_duration_minutes || 60}m/day</span>
                    </span>

                    <button
                      onClick={() => handleToggleComplete(plan)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        plan.completed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{plan.completed ? 'Completed' : 'Mark Done'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Study Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl ${
              isDark ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <span>{editingPlanId ? 'Edit Study Plan' : 'Create New Study Plan'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-dim)] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1">
                  Plan Title *
                </label>
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g., Operating Systems Exam Prep"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none border transition ${
                    isDark
                      ? 'bg-slate-900 border-white/10 text-white focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1">Category</label>
                  <input
                    type="text"
                    value={planCategory}
                    onChange={(e) => setPlanCategory(e.target.value)}
                    placeholder="e.g., Computer Science"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                      isDark
                        ? 'bg-slate-900 border-white/10 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1">Priority</label>
                  <select
                    value={planPriority}
                    onChange={(e) => setPlanPriority(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                      isDark
                        ? 'bg-slate-900 border-white/10 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                      isDark
                        ? 'bg-slate-900 border-white/10 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                      isDark
                        ? 'bg-slate-900 border-white/10 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1">Daily Target Goal</label>
                  <input
                    type="text"
                    value={planGoal}
                    onChange={(e) => setPlanGoal(e.target.value)}
                    placeholder="e.g., 2 hours daily study"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                      isDark
                        ? 'bg-slate-900 border-white/10 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={planDuration}
                    onChange={(e) => setPlanDuration(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                      isDark
                        ? 'bg-slate-900 border-white/10 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Tasks Sub-list */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-[var(--text-dim)]">Action Tasks</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                    placeholder="Add specific session task..."
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs outline-none border transition ${
                      isDark
                        ? 'bg-slate-900 border-white/10 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {taskList.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs"
                    >
                      <span>{task.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(task.id)}
                        className="text-rose-400 hover:text-rose-300 p-0.5 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-dim)] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !planTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPlanId ? 'Update Plan' : 'Save Study Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlannerView;
