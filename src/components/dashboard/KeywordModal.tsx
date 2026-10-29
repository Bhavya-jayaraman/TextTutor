/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, X, Copy, CheckCircle2, Loader2, BookOpen } from 'lucide-react';
import { ThemeMode } from '../../types/dashboard.js';
import { clientAiService } from '../../services/clientAiService.js';

interface KeywordModalProps {
  keyword: string | null;
  contextTitle?: string;
  onClose: () => void;
  theme: ThemeMode;
}

export const KeywordModal: React.FC<KeywordModalProps> = ({
  keyword,
  contextTitle,
  onClose,
  theme,
}) => {
  if (!keyword) return null;

  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    clientAiService
      .explainKeyword(keyword, contextTitle)
      .then((res) => {
        if (isMounted) {
          if (res.success && res.explanation) {
            setExplanation(res.explanation);
          } else {
            setExplanation(
              `"${keyword}" is a fundamental term in ${contextTitle || 'this subject'}. It represents a key concept required for comprehensive understanding and study review.`
            );
          }
        }
      })
      .catch((err) => {
        console.error('Keyword explanation error:', err);
        if (isMounted) {
          setExplanation(
            `"${keyword}" is a critical term in ${contextTitle || 'this subject'}. It forms the foundation for understanding related principles and practical applications.`
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [keyword, contextTitle]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${keyword}: ${explanation}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 relative ${
          isDark ? 'bg-[#111115] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded bg-[#818cf8]/15 text-[#818cf8] border border-[#818cf8]/30 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>AI Term Explanation</span>
            </span>
            <h2 className="text-lg font-bold tracking-tight mt-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#818cf8]" />
              <span>{keyword}</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-2">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#818cf8] animate-spin" />
              <p className="text-xs text-[#94a3b8]">Asking TextTutor AI for concise explanation...</p>
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl text-xs leading-relaxed border space-y-2 ${
                isDark ? 'bg-[#050505] border-white/10 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <p className="font-medium text-[#818cf8]">Concept Definition:</p>
              <p>{explanation}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleCopy}
            disabled={loading}
            className="text-xs text-[#818cf8] hover:underline flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg bg-[#818cf8]/10 hover:bg-[#818cf8]/20 disabled:opacity-50"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Definition</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-semibold rounded-xl transition-all shadow-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
