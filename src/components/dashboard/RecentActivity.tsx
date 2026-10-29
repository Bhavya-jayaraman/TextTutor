/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Activity,
  FileText,
  Sparkles,
  Layers,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { DashboardView, ActivityItem, ThemeMode } from '../../types/dashboard.js';

interface RecentActivityProps {
  activities: ActivityItem[];
  theme: ThemeMode;
  onNavigateView?: (view: DashboardView) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  theme,
  onNavigateView,
}) => {
  const isDark = theme === 'dark';

  const getActivityIcon = (type: ActivityItem['iconType']) => {
    switch (type) {
      case 'note':
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'sparkles':
      case 'summary':
        return <Sparkles className="w-3.5 h-3.5 text-[#818cf8]" />;
      case 'cards':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'trophy':
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'note_created':
        return 'Note Created';
      case 'note_updated':
        return 'Note Updated';
      case 'summary_generated':
        return 'AI Summary';
      case 'flashcards_created':
      case 'flashcards_generated':
        return 'Flashcards';
      case 'quiz_completed':
        return 'Quiz Finished';
      case 'ai_chat_used':
        return 'AI Tutor';
      default:
        return 'Activity';
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all h-full flex flex-col justify-between ${
        isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent Activity
              </h2>
              <p className="text-xs text-[#94a3b8]">Live learning stream</p>
            </div>
          </div>

          {onNavigateView && (
            <button
              onClick={() => onNavigateView('activity')}
              className="text-xs text-[#818cf8] font-bold hover:underline"
            >
              View Full Log →
            </button>
          )}
        </div>

        <div className="relative pl-3 space-y-4 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
          {activities.map((item) => (
            <div key={item.id} className="relative flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 z-10 ${
                  isDark ? 'bg-[#111115] border-white/20' : 'bg-white border-slate-300'
                }`}
              >
                {getActivityIcon(item.iconType)}
              </div>

              <div
                className={`p-3 rounded-xl border flex-1 space-y-0.5 ${
                  isDark ? 'bg-[#050505] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#818cf8]">
                    {getActivityBadge(item.type)}
                  </span>
                  <span className="text-[10px] text-[#94a3b8] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </span>
                </div>

                <h4 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {item.title}
                </h4>

                <p className="text-[11px] text-[#94a3b8]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
