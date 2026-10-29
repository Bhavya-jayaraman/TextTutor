/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  BookOpen,
  Sparkles,
  Brain,
  HelpCircle,
  MessageSquare,
  Clock,
  Loader2,
  Filter,
} from 'lucide-react';
import { ThemeMode } from '../../types/dashboard.js';
import { clientActivityService, ActivityLogItem } from '../../services/clientActivityService.js';

interface ActivityTimelineViewProps {
  theme: ThemeMode;
}

export const ActivityTimelineView: React.FC<ActivityTimelineViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('all');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await clientActivityService.getActivity();
      if (res.success && res.activity) {
        setActivities(res.activity);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = activities.filter((a) => {
    if (filterAction === 'all') return true;
    return a.action === filterAction;
  });

  const getActionBadge = (action: ActivityLogItem['action']) => {
    switch (action) {
      case 'note_created':
      case 'note_updated':
        return { label: 'Note', icon: BookOpen, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'summary_generated':
        return { label: 'AI Summary', icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'flashcards_generated':
        return { label: 'Flashcards', icon: Brain, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'quiz_completed':
        return { label: 'Quiz', icon: HelpCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'ai_chat_used':
        return { label: 'AI Chat', icon: MessageSquare, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      default:
        return { label: 'Action', icon: History, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <History className="w-6 h-6 text-[#818cf8]" />
            <span>Activity Log Timeline</span>
          </h1>
          <p className="text-xs text-[#94a3b8]">
            Detailed timeline log of all your note creations, AI summaries, flashcards, quiz submissions, and assistant interactions.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs focus:outline-none ${
              isDark ? 'bg-[#111115] border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900'
            }`}
          >
            <option value="all">All Actions</option>
            <option value="note_created">Note Creations</option>
            <option value="summary_generated">AI Summaries</option>
            <option value="flashcards_generated">Flashcards</option>
            <option value="quiz_completed">Quiz Attempts</option>
            <option value="ai_chat_used">AI Assistant Chat</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#818cf8] animate-spin mx-auto" />
          <p className="text-xs text-[#94a3b8]">Loading activity log timeline...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-12">No activity recorded for this filter.</p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
          {filteredActivities.map((item) => {
            const badge = getActionBadge(item.action);
            const Icon = badge.icon;
            return (
              <div key={item.id} className="relative group">
                {/* Bullet node on timeline */}
                <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-[#818cf8] border-2 border-[#050505] group-hover:scale-125 transition-transform" />

                <div
                  className={`p-4 rounded-2xl border space-y-2 transition-all ${
                    isDark ? 'bg-[#111115] border-white/10 hover:border-[#818cf8]/40' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#818cf8]" />
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </span>
                  </div>

                  <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
