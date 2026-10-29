/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Plus,
  Upload,
  Sparkles,
  MessageSquare,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ThemeMode, DashboardView } from '../../types/dashboard.js';

interface QuickActionsProps {
  theme: ThemeMode;
  onSelectAction: (actionKey: string) => void;
  onNavigateView: (view: DashboardView) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  theme,
  onSelectAction,
  onNavigateView,
}) => {
  const isDark = theme === 'dark';

  const actions = [
    {
      key: 'create_note',
      label: 'Create Note',
      description: 'Draft or paste study text',
      icon: Plus,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-[0_0_20px_rgba(99,102,241,0.3)]',
      onClick: () => onNavigateView('my-notes'),
    },
    {
      key: 'upload_note',
      label: 'Upload Note',
      description: 'PDF, DOCX or TXT file',
      icon: Upload,
      color: isDark ? 'bg-white/5 border border-white/10 hover:border-white/20 text-white' : 'bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200',
      onClick: () => onSelectAction('upload_note'),
    },
    {
      key: 'ai_summary',
      label: 'AI Summary',
      description: 'Condense key concepts',
      icon: Sparkles,
      color: isDark ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20' : 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100',
      onClick: () => onNavigateView('my-notes'),
    },
    {
      key: 'ai_chat',
      label: 'AI Chat',
      description: 'Ask questions on your notes',
      icon: MessageSquare,
      color: isDark ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20' : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100',
      onClick: () => onNavigateView('ai-assistant'),
    },
    {
      key: 'generate_flashcards',
      label: 'Generate Flashcards',
      description: 'Spaced repetition decks',
      icon: Layers,
      color: isDark ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      onClick: () => onNavigateView('flashcards'),
    },
    {
      key: 'take_quiz',
      label: 'Take Quiz',
      description: 'Test your knowledge',
      icon: HelpCircle,
      color: isDark ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20' : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100',
      onClick: () => onNavigateView('quiz'),
    },
  ];

  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Quick Actions
          </h2>
          <p className="text-xs text-[#94a3b8]">Launch instant learning tools</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.key}
              onClick={act.onClick}
              className={`p-3.5 rounded-xl transition-all flex flex-col items-start justify-between text-left group min-h-[100px] ${act.color}`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-black/10 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight line-clamp-1">{act.label}</div>
                <div className="text-[10px] opacity-75 line-clamp-1 mt-0.5">{act.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
