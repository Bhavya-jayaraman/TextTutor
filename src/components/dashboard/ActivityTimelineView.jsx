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
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { clientActivityService } from '../../services/clientActivityService.js';

export const ActivityTimelineView = ({ theme }) => {
  const isDark = theme === 'dark';
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await clientActivityService.getActivity();
      if (res.success && Array.isArray(res.activity)) {
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

  const getActionBadge = (action) => {
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
      case 'study_plan':
        return { label: 'Study Plan', icon: Calendar, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      default:
        return { label: 'Activity', icon: CheckCircle2, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <History className="w-6 h-6 text-indigo-400" />
            <span>Activity Timeline</span>
          </h1>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Real chronological record of your study actions, note edits, AI interactions, and quiz attempts.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium outline-none border transition ${
              isDark
                ? 'bg-slate-900 border-white/10 text-slate-200'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">All Events ({activities.length})</option>
            <option value="note_created">Notes Created</option>
            <option value="summary_generated">AI Summaries</option>
            <option value="flashcards_generated">Flashcards</option>
            <option value="quiz_completed">Quiz Attempts</option>
            <option value="ai_chat_used">AI Chats</option>
            <option value="study_plan">Study Plans</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-dim)]">Loading activity history from database...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center space-y-3 ${isDark ? 'border-white/10 bg-[#0f172a]/40' : 'border-slate-200 bg-white'}`}>
          <History className="w-8 h-8 text-[var(--text-dim)] mx-auto opacity-50" />
          <p className="text-xs text-[var(--text-dim)]">No activity logged yet.</p>
          <p className="text-[11px] text-[var(--text-dim)]">Create notes, take quizzes, or generate flashcards to start building your study history!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((act) => {
            const badge = getActionBadge(act.action);
            const Icon = badge.icon;

            return (
              <div
                key={act.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${
                  isDark
                    ? 'bg-[#0f172a]/60 border-white/10 hover:border-white/20'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${badge.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {act.description}
                    </p>
                    <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-medium">
                      {badge.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-dim)] shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(act.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityTimelineView;
