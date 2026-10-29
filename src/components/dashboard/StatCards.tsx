/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  MessageSquare,
  Sparkles,
  Layers,
  HelpCircle,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { DashboardStats, ThemeMode } from '../../types/dashboard.js';

interface StatCardsProps {
  stats: DashboardStats;
  theme: ThemeMode;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, theme }) => {
  const isDark = theme === 'dark';

  const cards = [
    {
      title: 'Notes',
      value: stats.totalNotes,
      subtitle: '+12% this week',
      icon: FileText,
      gradient: 'from-[#6366f1] to-[#8b5cf6]',
      accentBg: 'bg-indigo-500/15 text-indigo-400',
    },
    {
      title: 'AI Chat',
      value: stats.aiChatsCount || 24,
      subtitle: 'Smart responses',
      icon: MessageSquare,
      gradient: 'from-[#06b6d4] to-[#3b82f6]',
      accentBg: 'bg-cyan-500/15 text-cyan-400',
    },
    {
      title: 'AI Summary',
      value: stats.aiSummariesGenerated,
      subtitle: 'Saved ~4.2 hrs',
      icon: Sparkles,
      gradient: 'from-[#10b981] to-[#34d399]',
      accentBg: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      title: 'Flashcards',
      value: stats.flashcardsCreated,
      subtitle: '88% accuracy',
      icon: Layers,
      gradient: 'from-[#f59e0b] to-[#fbbf24]',
      accentBg: 'bg-amber-500/15 text-amber-400',
    },
    {
      title: 'Quiz',
      value: stats.quizzesTaken,
      subtitle: 'Avg score: 92%',
      icon: HelpCircle,
      gradient: 'from-[#ec4899] to-[#f472b6]',
      accentBg: 'bg-pink-500/15 text-pink-400',
    },
    {
      title: 'Study Streak',
      value: `${stats.studyStreakDays} Days`,
      subtitle: 'Personal record!',
      icon: Flame,
      gradient: 'from-[#8b5cf6] to-[#6366f1]',
      accentBg: 'bg-purple-500/15 text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-6 rounded-[22px] min-h-[160px] border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden group flex flex-col justify-between ${
              isDark
                ? 'bg-surface border-theme hover:border-indigo-500/50'
                : 'bg-white border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-indigo-500/10'
            }`}
          >
            {/* Soft Ambient Background Glow on Hover */}
            <div className={`absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-gradient-to-tr ${card.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity pointer-events-none`} />

            {/* Gradient Top Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.gradient}`} />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${card.gradient} text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10">
              <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {card.value}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-dim)] font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>{card.subtitle}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
