/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Brain,
  Clock,
  Target,
  Award,
  Zap,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Loader2,
  Calendar,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ThemeMode } from '../../types/dashboard.js';
import { clientAnalyticsService, AnalyticsOverview } from '../../services/clientAnalyticsService.js';

interface AnalyticsViewProps {
  theme: ThemeMode;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await clientAnalyticsService.getAnalytics();
      if (res.success && res.analytics) {
        setData(res.analytics);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#818cf8] animate-spin mx-auto" />
        <p className="text-xs text-[#94a3b8]">Analyzing retention trends & study velocity...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Learning Analytics & Progress</span>
          </h1>
          <p className="text-xs text-[var(--text-dim)]">
            Comprehensive insights on retention rate, study habits, active recall velocity, and subject mastery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{data.studyStreakDays} Day Streak Active</span>
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Total Notes', value: data.totalNotes, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'AI Summaries', value: data.aiSummariesGenerated, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Flashcards', value: data.flashcardsCreated, icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Quizzes Done', value: data.quizzesCompleted, icon: HelpCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'AI Chats', value: data.aiChatSessions, icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Study Hours', value: `${data.estimatedStudyHours}h`, icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 transition-all ${
                isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                </div>
              </div>
              <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Charts (Line Chart & Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Line Chart */}
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="w-4 h-4 text-[#818cf8]" />
              <span>Weekly Retention & Study Hours</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              +14% Growth
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#e2e8f0'} />
                <XAxis dataKey="week" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111115' : '#ffffff',
                    borderColor: isDark ? '#ffffff20' : '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  name="Hours Studied"
                  stroke="#818cf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#818cf8' }}
                />
                <Line
                  type="monotone"
                  dataKey="retention"
                  name="Retention %"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Activity Bar Chart */}
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Notes & Quizzes per Day</span>
            </h2>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Weekly View
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.notesPerWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#e2e8f0'} />
                <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111115' : '#ffffff',
                    borderColor: isDark ? '#ffffff20' : '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="notes" name="Notes Created" fill="#818cf8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="quizzes" name="Quizzes Taken" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Pie Chart (Topics) & Progress Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topics Distribution Donut Chart */}
        <div
          className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Brain className="w-4 h-4 text-emerald-400" />
            <span>Topics Studied Breakdown</span>
          </h2>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.topicsDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {data.topicsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111115' : '#ffffff',
                    borderColor: isDark ? '#ffffff20' : '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-1 border-t border-white/10 text-xs">
            {data.topicsDistribution.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.name}</span>
                </div>
                <div className="font-mono text-[#94a3b8] flex items-center gap-2">
                  <span>{t.count} items</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-white/10">{t.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Study Goals Progress Cards */}
        <div
          className={`lg:col-span-7 p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Target className="w-4 h-4 text-[#818cf8]" />
              <span>Study Goals & Progress Targets</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">Active Goals</span>
          </div>

          <div className="space-y-4">
            {data.studyGoals.map((goal) => (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#050505] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{goal.title}</span>
                  <span className="font-mono text-[#818cf8] font-bold">
                    {goal.current} / {goal.target} {goal.unit} ({goal.percentage}%)
                  </span>
                </div>

                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${goal.percentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.percentage >= 100
                        ? 'bg-emerald-400'
                        : goal.percentage >= 60
                        ? 'bg-amber-400'
                        : 'bg-[#818cf8]'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
