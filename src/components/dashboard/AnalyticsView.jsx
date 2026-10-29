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
  CheckCircle2,
  AlertCircle,
  RefreshCw,
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
import { clientAnalyticsService } from '../../services/clientAnalyticsService.js';

export const AnalyticsView = ({ theme }) => {
  const isDark = theme === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // '7d' | '30d' | 'all'

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientAnalyticsService.getAnalytics();
      if (res.success && res.analytics) {
        setData(res.analytics);
      } else {
        setError('Failed to calculate analytics metrics.');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Could not connect to analytics service. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-xs text-[var(--text-dim)]">Calculating retention trends and study metrics from database...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Analytics Unavailable
        </h3>
        <p className="text-xs text-[var(--text-dim)]">{error || 'No analytics data available.'}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const hasActivity =
    data.totalNotes > 0 ||
    data.flashcardsCreated > 0 ||
    data.quizzesCompleted > 0 ||
    data.quizAttempts > 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Learning Analytics & Progress</span>
          </h1>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Real-time study insights derived from your saved notes, flashcards, quizzes, and activity logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            {['7d', '30d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-dim)] hover:text-white'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{data.studyStreakDays} Day Streak</span>
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {[
          { label: 'Total Notes', value: data.totalNotes, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'AI Summaries', value: data.aiSummariesGenerated, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Flashcards', value: data.flashcardsCreated, icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Mastered Cards', value: data.masteredCards, icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10' },
          { label: 'Quizzes Done', value: data.quizzesCompleted, icon: HelpCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Quiz Attempts', value: data.quizAttempts, icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Avg Score', value: `${data.averageScore}%`, icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Study Hours', value: `${data.estimatedStudyHours}h`, icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2.5 transition ${
                isDark ? 'bg-[#0f172a]/60 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <div className={`p-1.5 rounded-lg ${kpi.bg} shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                </div>
              </div>
              <div className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Charts (Retention Trend Line Chart & Daily Activity Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Retention Line Chart */}
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#0f172a]/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Weekly Retention & Study Hours</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              {data.retentionRate}% Active Retention
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyProgress || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#e2e8f0'} />
                <XAxis dataKey="week" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
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
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#818cf8' }}
                />
                <Line
                  type="monotone"
                  dataKey="retention"
                  name="Retention %"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Activity Bar Chart */}
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#0f172a]/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Notes & Quizzes per Day (Current Week)</span>
            </h2>
            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
              Weekly Distribution
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.notesPerWeek || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#e2e8f0'} />
                <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#ffffff20' : '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="notes" name="Notes Added" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quizzes" name="Quizzes Taken" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Subject Distribution & Goals Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject / Topic Distribution */}
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#0f172a]/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Subject & Topic Focus</span>
          </h2>

          {data.topicsDistribution && data.topicsDistribution.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.topicsDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {data.topicsDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#ffffff20' : '#cbd5e1',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 w-full space-y-2">
                {data.topicsDistribution.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-dim)]">
                      <span>{t.count} notes</span>
                      <span className="font-semibold text-indigo-400">{t.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--text-dim)]">
              Add study notes with categories to view your subject distribution.
            </div>
          )}
        </div>

        {/* Study Goals & Milestones */}
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#0f172a]/60 border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Study Milestones & Mastery Goals</span>
          </h2>

          <div className="space-y-4 pt-2">
            {data.studyGoals && data.studyGoals.map((goal) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {goal.title}
                  </span>
                  <span className="text-[var(--text-dim)] font-semibold">
                    {goal.current} / {goal.target} {goal.unit} ({goal.percentage}%)
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.percentage >= 100
                        ? 'bg-emerald-500'
                        : goal.percentage >= 50
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, goal.percentage)}%` }}
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

export default AnalyticsView;
