/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart3, TrendingUp, Award, ArrowRight, BookOpen, Target, PieChart, Activity } from 'lucide-react';
import { DashboardView, ThemeMode } from '../../types/dashboard.js';

interface LearningProgressProps {
  theme: ThemeMode;
  onNavigateView?: (view: DashboardView) => void;
}

export const LearningProgress: React.FC<LearningProgressProps> = ({ theme, onNavigateView }) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Analytics & Analytics Overview
            </h2>
            <p className="text-xs text-[var(--text-dim)]">Real-time study metrics and progress charts</p>
          </div>
        </div>

        {onNavigateView && (
          <button
            onClick={() => onNavigateView('analytics')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
          >
            <span>Full Analytics Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Chart 1: Weekly Progress (Line Chart) */}
        <div
          className={`p-6 rounded-[24px] border flex flex-col justify-between transition-all ${
            isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Weekly Progress</span>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Study Velocity</h3>
            </div>
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="py-2">
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>16.5 hrs</span>
              <span className="text-xs font-bold text-emerald-400">+18% vs last week</span>
            </div>

            {/* SVG Line Chart */}
            <div className="h-28 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 80">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 60 Q 30 20, 60 45 T 120 25 T 180 15 T 200 30 L 200 80 L 0 80 Z"
                  fill="url(#lineGrad)"
                />
                <path
                  d="M 0 60 Q 30 20, 60 45 T 120 25 T 180 15 T 200 30"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="180" cy="15" r="5" fill="#818cf8" className="animate-ping" />
                <circle cx="180" cy="15" r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-[var(--text-dim)] font-medium pt-2 border-t border-white/5">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Chart 2: Monthly Notes (Bar Chart) */}
        <div
          className={`p-6 rounded-[24px] border flex flex-col justify-between transition-all ${
            isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Monthly Notes</span>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Created Volume</h3>
            </div>
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="py-2">
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>38 Notes</span>
              <span className="text-xs font-bold text-cyan-400">Oct 2023</span>
            </div>

            {/* Bar Chart */}
            <div className="h-28 flex items-end justify-between gap-1.5 pt-4">
              {[
                { label: 'May', val: 40 },
                { label: 'Jun', val: 65 },
                { label: 'Jul', val: 50 },
                { label: 'Aug', val: 80 },
                { label: 'Sep', val: 70 },
                { label: 'Oct', val: 95 },
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full bg-slate-500/10 rounded-t-lg relative flex items-end overflow-hidden h-20">
                    <div
                      style={{ height: `${item.val}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        i === 5
                          ? 'bg-gradient-to-t from-cyan-500 to-indigo-500'
                          : 'bg-slate-500/30 hover:bg-slate-500/50'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-dim)] font-semibold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-dim)] pt-2 border-t border-white/5 font-medium flex justify-between">
            <span>Highest: Oct (+12)</span>
            <span className="text-indigo-400 font-bold">Avg: 28/mo</span>
          </div>
        </div>

        {/* Chart 3: Study Categories (Donut Chart) */}
        <div
          className={`p-6 rounded-[24px] border flex flex-col justify-between transition-all ${
            isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Study Categories</span>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Topic Distribution</h3>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <PieChart className="w-4 h-4" />
            </div>
          </div>

          <div className="py-1 flex items-center justify-between gap-4">
            {/* SVG Donut */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="3.8" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3.8"
                  strokeDasharray="35 65"
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3.8"
                  strokeDasharray="25 75"
                  strokeDashoffset="-35"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray="20 80"
                  strokeDashoffset="-60"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.8"
                  strokeDasharray="20 80"
                  strokeDashoffset="-80"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>4</span>
                <span className="text-[9px] text-[var(--text-dim)] uppercase">Topics</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-1.5 text-[11px] font-medium flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[var(--text-dim)]">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  CS & AI
                </span>
                <span className="font-bold">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[var(--text-dim)]">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  Physics
                </span>
                <span className="font-bold">25%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[var(--text-dim)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Biology
                </span>
                <span className="font-bold">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[var(--text-dim)]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Psych
                </span>
                <span className="font-bold">20%</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-dim)] pt-2 border-t border-white/5 font-medium">
            Most active subject: <span className="text-indigo-400 font-bold">Computer Science</span>
          </div>
        </div>

        {/* Chart 4: Study Goal (Circular Progress Ring) */}
        <div
          className={`p-6 rounded-[24px] border flex flex-col justify-between transition-all ${
            isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Study Goal</span>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Monthly Target</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="py-1 flex items-center justify-between gap-4">
            {/* Circular SVG Ring */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="3.8"
                  strokeDasharray="85 15"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black text-emerald-400">85%</span>
                <span className="text-[9px] text-[var(--text-dim)] uppercase">Done</span>
              </div>
            </div>

            <div className="space-y-2 text-xs flex-1">
              <div>
                <span className="text-[var(--text-dim)] font-medium">Target:</span>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>20 Hours / Wk</div>
              </div>
              <div>
                <span className="text-[var(--text-dim)] font-medium">Achieved:</span>
                <div className="font-bold text-emerald-400">17 Hours / Wk</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold flex items-center justify-between">
            <span>Status: Excellent</span>
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
