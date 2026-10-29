/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Eye, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { NoteItem, ThemeMode, DashboardView } from '../../types/dashboard.js';
import { QuickViewModal } from './QuickViewModal.js';

interface RecentNotesProps {
  notes: NoteItem[];
  theme: ThemeMode;
  onNavigateView: (view: DashboardView) => void;
}

export const RecentNotes: React.FC<RecentNotesProps> = ({
  notes,
  theme,
  onNavigateView,
}) => {
  const isDark = theme === 'dark';
  const [selectedQuickNote, setSelectedQuickNote] = useState<NoteItem | null>(null);

  return (
    <div
      className={`p-6 rounded-2xl border transition-all h-full flex flex-col justify-between ${
        isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent Notes
              </h2>
              <p className="text-xs text-[var(--text-dim)]">Latest knowledge saved</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateView('my-notes')}
            className="text-xs text-indigo-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All ({notes.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of Recent Notes */}
        <div className="space-y-3">
          {notes.slice(0, 4).map((note) => (
            <div
              key={note.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                isDark
                  ? 'bg-surface/60 border-theme hover:border-indigo-500/40'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                    {note.category}
                  </span>
                  <span className="text-[10px] text-[var(--text-dim)] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{note.updatedAt || note.date}</span>
                  </span>
                </div>

                <h3 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {note.title}
                </h3>

                <p className="text-[11px] text-[var(--text-dim)] truncate">{note.content}</p>
              </div>

              {/* Quick View Button */}
              <button
                onClick={() => setSelectedQuickNote(note)}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick View</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#94a3b8]">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#818cf8]" />
          <span>All notes auto-synced with AI key insights</span>
        </span>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        note={selectedQuickNote}
        onClose={() => setSelectedQuickNote(null)}
        theme={theme}
      />
    </div>
  );
};
