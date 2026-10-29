/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  CheckCircle2,
  Calendar,
  Tag,
  BookOpen,
} from 'lucide-react';
import { NoteItem, ThemeMode } from '../../types/dashboard.js';

interface QuickViewModalProps {
  note: NoteItem | null;
  onClose: () => void;
  theme: ThemeMode;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  note,
  onClose,
  theme,
}) => {
  if (!note) return null;
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  const handleCopyInsights = () => {
    navigator.clipboard.writeText(note.insights.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 z-10 transition-all ${
          isDark ? 'bg-[#111115] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded bg-[#818cf8]/15 text-[#818cf8] border border-[#818cf8]/20">
                {note.category}
              </span>
              <span className="text-xs text-[#94a3b8] flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                <span>Updated: {note.updatedAt || note.date}</span>
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-1">{note.title}</h2>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note Body */}
        <div className="py-5 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#818cf8]" />
              <span>Full Content</span>
            </h3>
            <div
              className={`p-4 rounded-xl text-xs leading-relaxed border font-sans ${
                isDark ? 'bg-[#050505] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {note.content}
            </div>
          </div>

          {/* AI Insights Box */}
          <div className="p-4 bg-[#818cf8]/[0.08] border-l-4 border-[#818cf8] rounded-r-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#818cf8] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>AI Key Insights ({note.insights.length})</span>
              </span>

              <button
                onClick={handleCopyInsights}
                className="text-[11px] text-[#818cf8] hover:underline flex items-center gap-1 font-medium bg-white/10 px-2.5 py-1 rounded-lg"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Insights'}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs leading-relaxed">
              {note.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#818cf8] font-bold">•</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Tag className="w-3.5 h-3.5 text-[#94a3b8]" />
              <div className="flex flex-wrap gap-1.5">
                {note.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(129,140,248,0.3)]"
          >
            Close Quick View
          </button>
        </div>
      </div>
    </div>
  );
};
