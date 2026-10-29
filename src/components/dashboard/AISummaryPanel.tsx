/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  CheckCircle2,
  Tag,
  ListChecks,
  FileText,
  AlertCircle,
  History,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AISummary } from '../../types/ai.js';
import { ThemeMode } from '../../types/dashboard.js';
import { clientAiService } from '../../services/clientAiService.js';
import { KeywordModal } from './KeywordModal.js';

interface AISummaryPanelProps {
  noteId?: number;
  title: string;
  content: string;
  category?: string;
  theme: ThemeMode;
  onSummaryGenerated?: (summary: AISummary) => void;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({
  noteId,
  title,
  content,
  category = 'General',
  theme,
  onSummaryGenerated,
}) => {
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [activeSummaryIndex, setActiveSummaryIndex] = useState<number>(0);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [showDetailed, setShowDetailed] = useState(true);

  const activeSummary = summaries[activeSummaryIndex] || null;

  // Fetch past summaries if noteId exists
  const fetchPastSummaries = async () => {
    if (!noteId) return;
    try {
      const res = await clientAiService.getSummariesForNote(noteId);
      if (res.success && res.summaries && res.summaries.length > 0) {
        setSummaries(res.summaries);
        setActiveSummaryIndex(0);
      }
    } catch (err) {
      console.error('Error fetching past summaries:', err);
    }
  };

  useEffect(() => {
    fetchPastSummaries();
  }, [noteId]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientAiService.summarizeNote({
        noteId,
        noteContent: content,
        title,
        category,
      });

      if (res.success && res.summary) {
        const newSummary = res.summary;
        setSummaries((prev) => [newSummary, ...prev]);
        setActiveSummaryIndex(0);
        if (onSummaryGenerated) {
          onSummaryGenerated(newSummary);
        }
      } else {
        setError(res.message || 'Failed to generate summary.');
      }
    } catch (err: any) {
      console.error('Summary generation error:', err);
      setError(
        err.response?.data?.message || 'Failed to connect to AI server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!activeSummary) return;
    const textToCopy = `Title: ${title}
Short Summary:
${activeSummary.shortSummary}

Key Takeaways:
${activeSummary.bulletPoints.map((b) => `• ${b}`).join('\n')}

Keywords:
${activeSummary.keywords.join(', ')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Control Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark
            ? 'bg-surface border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
            : 'bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white border-indigo-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>TextTutor AI Summary & Keywords</span>
              {summaries.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {summaries.length} Version{summaries.length > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-xs text-[var(--text-dim)]">
              Automated concept synthesis, key points extraction, and study tags.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summaries.length > 0 && (
            <button
              onClick={handleCopySummary}
              className="text-xs text-indigo-400 hover:bg-indigo-500/15 px-3 py-2 rounded-xl border border-indigo-500/30 flex items-center gap-1.5 font-medium transition-colors"
            >
              {copiedSummary ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            onClick={handleGenerateSummary}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating AI Summary...</span>
              </>
            ) : summaries.length > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Summary</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ Generate AI Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleGenerateSummary}
            className="underline font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          className={`p-8 rounded-2xl border text-center space-y-4 ${
            isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#818cf8]/30 animate-ping" />
            <Sparkles className="w-6 h-6 text-[#818cf8] animate-spin" />
          </div>
          <div className="space-y-1">
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Analyzing Note & Extracting Concepts...
            </p>
            <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
              TextTutor AI is reading your note text, extracting key takeaways, and identifying critical study keywords.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-[#818cf8] rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* When summary exists */}
      {!loading && activeSummary && (
        <div className="space-y-4">
          {/* Version Switcher if multiple */}
          {summaries.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <History className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span className="text-[#94a3b8]">Select Summary Version:</span>
              <div className="flex flex-wrap gap-1.5">
                {summaries.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    onClick={() => setActiveSummaryIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                      activeSummaryIndex === idx
                        ? 'bg-[#818cf8] text-white font-bold shadow'
                        : isDark
                        ? 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                        : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    V{summaries.length - idx} ({new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Short Summary Card */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Short Summary</span>
              </h4>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {activeSummary.shortSummary}
            </p>
          </div>

          {/* Detailed Summary Expandable */}
          {activeSummary.detailedSummary && (
            <div
              className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <button
                onClick={() => setShowDetailed(!showDetailed)}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#818cf8]"
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Detailed Analysis</span>
                </div>
                {showDetailed ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showDetailed && (
                <div
                  className={`pt-2 text-xs leading-relaxed whitespace-pre-wrap border-t border-white/5 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {activeSummary.detailedSummary}
                </div>
              )}
            </div>
          )}

          {/* Key Takeaways */}
          {activeSummary.bulletPoints && activeSummary.bulletPoints.length > 0 && (
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" />
                <span>Key Points ({activeSummary.bulletPoints.length})</span>
              </h4>

              <div className="space-y-2 text-xs">
                {activeSummary.bulletPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                      isDark ? 'bg-[#050505] border-white/5 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="text-[#818cf8] font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Keywords */}
          {activeSummary.keywords && activeSummary.keywords.length > 0 && (
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Important Keywords</span>
                </h4>
                <span className="text-[10px] text-[#94a3b8]">Click keyword for AI explanation</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeSummary.keywords.map((kw, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedKeyword(kw)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 group cursor-pointer hover:scale-105 ${
                      isDark
                        ? 'bg-[#818cf8]/10 border-[#818cf8]/30 text-[#818cf8] hover:bg-[#818cf8] hover:text-white'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-[#818cf8] hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#818cf8] group-hover:text-white" />
                    <span>{kw}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State when no summary generated yet */}
      {!loading && !activeSummary && (
        <div
          className={`p-8 rounded-2xl border text-center space-y-3 ${
            isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#818cf8]/15 border border-[#818cf8]/30 flex items-center justify-center text-[#818cf8] mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No AI Summary Generated Yet
          </h4>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
            Click the button above to analyze this note with TextTutor AI, generate crisp summaries, key points, and clickable keywords.
          </p>
        </div>
      )}

      {/* Keyword Explanation Modal */}
      <KeywordModal
        keyword={selectedKeyword}
        contextTitle={title}
        onClose={() => setSelectedKeyword(null)}
        theme={theme}
      />
    </div>
  );
};
