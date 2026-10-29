/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Clock, ArrowRight, Tag } from 'lucide-react';
import { DashboardView, ThemeMode } from '../../types/dashboard.js';

interface Task {
  id: string;
  title: string;
  subject: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Review Quantum Superposition Flashcards',
    subject: 'Physics',
    time: '2:00 PM Today',
    priority: 'High',
    completed: false,
  },
  {
    id: 't2',
    title: 'Generate AI Summary for Distributed Systems Notes',
    subject: 'Computer Science',
    time: '4:30 PM Today',
    priority: 'High',
    completed: true,
  },
  {
    id: 't3',
    title: 'Complete Neuroscience Knowledge Quiz',
    subject: 'Biology',
    time: 'Tomorrow, 10:00 AM',
    priority: 'Medium',
    completed: false,
  },
  {
    id: 't4',
    title: 'Re-read Spaced Repetition Memory Notes',
    subject: 'Psychology',
    time: 'Tomorrow, 2:00 PM',
    priority: 'Low',
    completed: false,
  },
];

interface UpcomingStudyTasksProps {
  theme: ThemeMode;
  onNavigateView: (view: DashboardView) => void;
}

export const UpcomingStudyTasks: React.FC<UpcomingStudyTasksProps> = ({
  theme,
  onNavigateView,
}) => {
  const isDark = theme === 'dark';
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Low':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div
      className={`p-6 rounded-[24px] border transition-all h-full flex flex-col justify-between ${
        isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200/80 shadow-xs'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Upcoming Study Tasks
              </h2>
              <p className="text-xs text-[var(--text-dim)]">Personalized planner agenda</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateView('study-planner')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <span>Full Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                task.completed
                  ? 'opacity-60 bg-slate-500/5 border-transparent'
                  : isDark
                  ? 'bg-slate-900/50 border-white/5 hover:border-indigo-500/40 hover:bg-white/5'
                  : 'bg-slate-50 border-slate-200/80 hover:border-indigo-300 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button className="shrink-0 text-indigo-400 focus:outline-none">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                  )}
                </button>

                <div className="min-w-0">
                  <h4
                    className={`text-xs font-bold truncate transition-colors ${
                      task.completed
                        ? 'line-through text-[var(--text-dim)]'
                        : isDark
                        ? 'text-white'
                        : 'text-slate-900'
                    }`}
                  >
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-dim)] flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {task.time}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                      <Tag className="w-2.5 h-2.5" />
                      {task.subject}
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${getPriorityStyle(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
