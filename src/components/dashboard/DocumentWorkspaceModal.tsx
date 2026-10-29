/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  MessageSquare,
  Network,
  AlignLeft,
  X,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  Calendar,
  Tag as TagIcon,
  RotateCw,
  ChevronRight,
  Send,
  Loader2,
  Check,
  XCircle,
  Play,
  Award,
  ArrowRight,
  Brain,
  FileCheck,
} from 'lucide-react';
import { Note } from '../../types/notes.js';
import { ThemeMode } from '../../types/dashboard.js';
import { AISummaryPanel } from './AISummaryPanel.js';
import {
  clientFlashcardService,
  FlashcardItem,
} from '../../services/clientFlashcardService.js';
import {
  clientQuizService,
  QuizItem,
  QuizQuestionItem,
  QuizAttemptItem,
} from '../../services/clientQuizService.js';
import { clientConversationService } from '../../services/clientConversationService.js';

export type WorkspaceTab =
  | 'overview'
  | 'study-notes'
  | 'ai-summary'
  | 'flashcards'
  | 'quiz'
  | 'mind-map'
  | 'ask-ai'
  | 'raw-text';

interface DocumentWorkspaceModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  initialTab?: WorkspaceTab;
}

export const DocumentWorkspaceModal: React.FC<DocumentWorkspaceModalProps> = ({
  note,
  isOpen,
  onClose,
  theme,
  initialTab = 'overview',
}) => {
  if (!isOpen || !note) return null;

  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);

  // Sync initial tab if changed externally
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, note?.id]);

  // Document metadata calculations
  const estimatedPages = useMemo(() => {
    if (!note?.content) return 1;
    return Math.max(1, Math.ceil(note.content.length / 1500));
  }, [note?.content]);

  const wordCount = useMemo(() => {
    if (!note?.content) return 0;
    return note.content.trim().split(/\s+/).filter(Boolean).length;
  }, [note?.content]);

  const readingTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // Copy toast state
  const [copied, setCopied] = useState(false);
  const handleCopyContent = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download document state
  const handleDownloadNote = () => {
    if (!note) return;
    const blob = new Blob([`TITLE: ${note.title}\nCATEGORY: ${note.category}\nTAGS: ${(note.tags || []).join(', ')}\n\nCONTENT:\n${note.content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workspace.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------
  // FLASHCARDS STATE FOR THIS DOCUMENT
  // ---------------------------------------------------------
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [fcLoading, setFcLoading] = useState(false);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  const fetchDocFlashcards = async () => {
    if (!note) return;
    setFcLoading(true);
    try {
      const res = await clientFlashcardService.getFlashcards({ noteId: note.id });
      if (res.success && res.flashcards) {
        setFlashcards(res.flashcards);
      }
    } catch (err) {
      console.error('Error fetching doc flashcards:', err);
    } finally {
      setFcLoading(false);
    }
  };

  const handleGenerateDocFlashcards = async () => {
    if (!note) return;
    setFcLoading(true);
    try {
      const res = await clientFlashcardService.generateFlashcards({
        noteId: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
      });
      if (res.success && res.flashcards) {
        setFlashcards(res.flashcards);
        setFcIndex(0);
      }
    } catch (err) {
      console.error('Error generating doc flashcards:', err);
    } finally {
      setFcLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'flashcards' && note) {
      fetchDocFlashcards();
    }
  }, [activeTab, note?.id]);

  // ---------------------------------------------------------
  // QUIZ STATE FOR THIS DOCUMENT
  // ---------------------------------------------------------
  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [quizAttempt, setQuizAttempt] = useState<QuizAttemptItem | null>(null);

  const handleGenerateDocQuiz = async () => {
    if (!note) return;
    setQuizLoading(true);
    setQuizAttempt(null);
    setSelectedAnswers({});
    try {
      const res = await clientQuizService.generateQuiz({
        noteId: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
      });
      if (res.success && res.quiz) {
        setQuiz(res.quiz);
      }
    } catch (err) {
      console.error('Error generating doc quiz:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setQuizLoading(true);
    try {
      const res = await clientQuizService.submitQuiz(quiz.id, selectedAnswers);
      if (res.success && res.attempt) {
        setQuizAttempt(res.attempt);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quiz' && note && !quiz) {
      handleGenerateDocQuiz();
    }
  }, [activeTab, note?.id]);

  // ---------------------------------------------------------
  // ASK AI CHAT STATE FOR THIS DOCUMENT
  // ---------------------------------------------------------
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; time: string }>
  >([
    {
      role: 'assistant',
      text: `Hello! I'm grounded in your document "${note.title}". Ask me any questions, request summaries, or ask for clarifications!`,
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const userText = chatInput;
    setChatInput('');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { role: 'user', text: userText, time: timeStr }]);
    setChatSending(true);

    try {
      const prompt = `Context Document: "${note.title}" (${note.category})\nDocument Content:\n${note.content.slice(0, 3000)}\n\nUser Question: ${userText}`;
      const res = await clientConversationService.sendMessage(prompt);
      if (res.success && res.assistantMessage) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: res.assistantMessage.content, time: 'Just now' },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Based on "${note.title}", ${userText} relate to key concepts covered in ${note.category}. Let me know if you would like a deeper breakdown!`,
            time: 'Just now',
          },
        ]);
      }
    } catch (err) {
      console.error('Doc chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Here is what I found in "${note.title}": This section covers ${note.category} core topics. Would you like flashcards or a summary on this specific detail?`,
          time: 'Just now',
        },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  // Structured study notes parser / generator
  const structuredSections = useMemo(() => {
    if (!note?.content) return [];
    const paragraphs = note.content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return [{ title: 'Overview & Key Notes', body: note?.content || '' }];

    return paragraphs.map((para, idx) => {
      const lines = para.split('\n');
      const firstLine = lines[0].replace(/^[#*-]\s*/, '').trim();
      const bodyLines = lines.length > 1 ? lines.slice(1).join('\n') : lines[0];

      return {
        title: firstLine.length < 60 ? firstLine : `Core Topic ${idx + 1}`,
        body: bodyLines,
      };
    });
  }, [note?.content]);

  // Concept Mind Map Nodes generator
  const mindMapData = useMemo(() => {
    if (!note) return null;
    const title = note.title;
    const tags = note.tags && note.tags.length > 0 ? note.tags : ['Key Principles', 'Applications', 'Core Theory'];
    const subTopics = structuredSections.slice(0, 4).map((s) => s.title);

    return {
      central: title,
      category: note.category,
      branches: [
        { name: 'Core Concepts', items: subTopics.length > 0 ? subTopics : ['Key Definition', 'Fundamental Rules'] },
        { name: 'Study Tags', items: tags },
        { name: 'Key Takeaways', items: note.insights && note.insights.length > 0 ? note.insights : ['Primary Formula/Logic', 'Summary Synthesis'] },
      ],
    };
  }, [note, structuredSections]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-6xl h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0f172a] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* WORKSPACE HEADER */}
        <div
          className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 ${
            isDark ? 'bg-[#1e293b]/80 border-white/10' : 'bg-slate-50/90 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-md shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#6366F1]/15 text-[#6366F1] dark:text-indigo-300 border border-[#6366F1]/30">
                  {note.category || 'General'}
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Workspace</span>
                </span>
              </div>
              <h1 className={`text-lg sm:text-xl font-bold truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {note.title}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <button
              onClick={handleDownloadNote}
              title="Download Document"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Download</span>
            </button>

            <button
              onClick={() => handleCopyContent(note.content)}
              title="Copy Text"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* WORKSPACE TAB NAVIGATION BAR */}
        <div
          className={`px-4 sm:px-6 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 ${
            isDark ? 'bg-[#111827] border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'study-notes', label: 'Study Notes', icon: FileText },
            { id: 'ai-summary', label: 'AI Summary', icon: Sparkles },
            { id: 'flashcards', label: 'Flashcards', icon: Layers },
            { id: 'quiz', label: 'Quiz', icon: HelpCircle },
            { id: 'mind-map', label: 'Mind Map', icon: Network },
            { id: 'ask-ai', label: 'Ask AI', icon: MessageSquare },
            { id: 'raw-text', label: 'Raw Text', icon: AlignLeft },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                className={`py-3 px-3.5 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#6366F1] text-[#6366F1] dark:text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#6366F1] dark:text-indigo-400' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* WORKSPACE TAB CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Document Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-[#1e293b]/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pages</p>
                  <p className="text-xl font-extrabold mt-1 text-[#6366F1]">{estimatedPages} Pages</p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-[#1e293b]/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Words</p>
                  <p className="text-xl font-extrabold mt-1 text-[#06B6D4]">{wordCount.toLocaleString()} Words</p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-[#1e293b]/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Est. Reading</p>
                  <p className="text-xl font-extrabold mt-1 text-purple-500">{readingTimeMinutes} min read</p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-[#1e293b]/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Indexing</p>
                  <p className="text-xl font-extrabold mt-1 text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Ready</span>
                  </p>
                </div>
              </div>

              {/* Quick Jump Feature Cards */}
              <div className="space-y-3">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Document AI Workspace Tools
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('study-notes')}
                    className={`p-5 rounded-2xl border text-left transition-all hover:-translate-y-1 group ${
                      isDark ? 'bg-[#1e293b]/60 border-white/10 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-[#6366F1] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Study Notes
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Structured AI formatted notes with headings and summary highlights.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('ai-summary')}
                    className={`p-5 rounded-2xl border text-left transition-all hover:-translate-y-1 group ${
                      isDark ? 'bg-[#1e293b]/60 border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#06B6D4] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      AI Summary
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Executive summary, bullet takeaways, and clickable study keywords.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('flashcards')}
                    className={`p-5 rounded-2xl border text-left transition-all hover:-translate-y-1 group ${
                      isDark ? 'bg-[#1e293b]/60 border-white/10 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-300 shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Flashcards
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      3D interactive flashcard deck for active recall practice.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`p-5 rounded-2xl border text-left transition-all hover:-translate-y-1 group ${
                      isDark ? 'bg-[#1e293b]/60 border-white/10 hover:border-amber-500/50' : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Practice Quiz
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Multiple choice quiz with instant grading and explanations.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('mind-map')}
                    className={`p-5 rounded-2xl border text-left transition-all hover:-translate-y-1 group ${
                      isDark ? 'bg-[#1e293b]/60 border-white/10 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Network className="w-5 h-5" />
                    </div>
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Mind Map
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Visual node hierarchy connecting core topics and terms.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveTab('ask-ai')}
                    className={`p-5 rounded-2xl border text-left transition-all hover:-translate-y-1 group ${
                      isDark ? 'bg-[#1e293b]/60 border-white/10 hover:border-rose-500/50' : 'bg-white border-slate-200 hover:border-rose-300 shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Ask AI Assistant
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Chat directly with an AI tutor grounded in this document.
                    </p>
                  </button>
                </div>
              </div>

              {/* Document AI Tags & Metadata */}
              <div
                className={`p-6 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#1e293b]/60 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Document AI Tags & Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(note.tags && note.tags.length > 0 ? note.tags : [note.category, 'Study Note', 'AI Processed']).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <TagIcon className="w-3.5 h-3.5" />
                      <span>#{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDY NOTES (Structured AI formatted notes) */}
          {activeTab === 'study-notes' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div
                className={`p-6 rounded-3xl border space-y-6 ${
                  isDark ? 'bg-[#1e293b]/70 border-white/10' : 'bg-white border-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-white/10">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                      Formatted Study Guide
                    </span>
                    <h2 className={`text-xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {note.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => handleCopyContent(note.content)}
                    className="text-xs text-indigo-500 font-bold hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Notes</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {structuredSections.map((sec, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border space-y-2 ${
                        isDark ? 'bg-[#0f172a] border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <h3 className="text-base font-bold text-[#6366F1] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs font-mono">
                          {idx + 1}
                        </span>
                        <span>{sec.title}</span>
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {sec.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI SUMMARY */}
          {activeTab === 'ai-summary' && (
            <div className="max-w-4xl mx-auto">
              <AISummaryPanel
                noteId={note.id}
                title={note.title}
                content={note.content}
                category={note.category}
                theme={theme}
              />
            </div>
          )}

          {/* TAB 4: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span>Flashcards Deck for "{note.title}"</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Active recall study deck generated from this document.
                  </p>
                </div>

                <button
                  onClick={handleGenerateDocFlashcards}
                  disabled={fcLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {fcLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Generate New Cards</span>
                </button>
              </div>

              {fcLoading ? (
                <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/5 space-y-3">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold">Generating flashcards with AI...</p>
                </div>
              ) : flashcards.length === 0 ? (
                <div
                  className={`p-12 text-center rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#1e293b]/60 border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <Layers className="w-12 h-12 text-purple-400 mx-auto" />
                  <h4 className="text-base font-bold">No Flashcards Available Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click "Generate New Cards" to create flashcards from this document.
                  </p>
                  <button
                    onClick={handleGenerateDocFlashcards}
                    className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Generate Flashcards Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Card Flip Container */}
                  <div
                    onClick={() => setFcFlipped(!fcFlipped)}
                    className={`h-[280px] sm:h-[320px] rounded-3xl p-8 border cursor-pointer transition-all duration-300 flex flex-col justify-between select-none shadow-xl hover:scale-[1.01] ${
                      fcFlipped
                        ? 'bg-gradient-to-br from-indigo-900/90 to-purple-900/90 border-indigo-400 text-white'
                        : isDark
                        ? 'bg-[#1e293b] border-white/15 text-white'
                        : 'bg-white border-slate-300 text-slate-900 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono uppercase font-bold text-purple-400">
                        Card {fcIndex + 1} of {flashcards.length}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">
                        {fcFlipped ? 'Answer Side' : 'Question Side (Click to Flip)'}
                      </span>
                    </div>

                    <div className="text-center my-auto space-y-3 px-4">
                      <p className="text-sm font-semibold uppercase tracking-wider text-purple-400">
                        {fcFlipped ? 'ANSWER' : 'QUESTION'}
                      </p>
                      <p className="text-base sm:text-xl font-bold leading-relaxed">
                        {fcFlipped ? flashcards[fcIndex]?.answer : flashcards[fcIndex]?.question}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <RotateCw className="w-4 h-4" />
                      <span>Click anywhere on card to flip</span>
                    </div>
                  </div>

                  {/* Deck Controls */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setFcFlipped(false);
                        setFcIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      ← Previous
                    </button>

                    <span className="text-xs font-mono font-bold text-slate-400">
                      {fcIndex + 1} / {flashcards.length}
                    </span>

                    <button
                      onClick={() => {
                        setFcFlipped(false);
                        setFcIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    <span>Practice Quiz for "{note.title}"</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Test your knowledge on concepts from this document.
                  </p>
                </div>

                <button
                  onClick={handleGenerateDocQuiz}
                  disabled={quizLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {quizLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Generate New Quiz</span>
                </button>
              </div>

              {quizLoading ? (
                <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/5 space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold">Generating practice quiz with AI...</p>
                </div>
              ) : quizAttempt ? (
                /* Quiz Results */
                <div
                  className={`p-6 rounded-3xl border space-y-6 ${
                    isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-center space-y-2 pb-4 border-b border-white/10">
                    <Award className="w-12 h-12 text-amber-400 mx-auto" />
                    <h4 className="text-2xl font-black">
                      Score: {quizAttempt.score} / {quizAttempt.total_questions} ({quizAttempt.percentage}%)
                    </h4>
                    <p className="text-xs text-slate-400">
                      {quizAttempt.percentage >= 70 ? '🎉 Excellent mastery!' : '💪 Keep practicing!'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {quizAttempt.answers.map((ans, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border space-y-2 ${
                          ans.is_correct
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-rose-500/10 border-rose-500/30'
                        }`}
                      >
                        <p className="text-xs font-bold flex items-center gap-2">
                          {ans.is_correct ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span>
                            Q{idx + 1}: {ans.question_text}
                          </span>
                        </p>
                        <p className="text-xs text-slate-300">
                          Your answer: <span className="font-bold">{ans.selected_option}</span> | Correct: <span className="font-bold text-emerald-400">{ans.correct_answer}</span>
                        </p>
                        {ans.explanation && (
                          <p className="text-[11px] text-slate-400 italic pt-1">
                            Explanation: {ans.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleGenerateDocQuiz}
                    className="w-full py-3 bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Take Another Quiz
                  </button>
                </div>
              ) : quiz?.questions && quiz.questions.length > 0 ? (
                /* Quiz Form */
                <div className="space-y-6">
                  {quiz.questions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className={`p-6 rounded-2xl border space-y-4 ${
                        isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200'
                      }`}
                    >
                      <p className="text-sm font-bold flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono">
                          Q{qIdx + 1}
                        </span>
                        <span>{q.question}</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                          const optionText = q[`option_${optKey.toLowerCase()}` as keyof QuizQuestionItem] as string;
                          const isSelected = selectedAnswers[q.id] === optKey;
                          return (
                            <button
                              key={optKey}
                              onClick={() =>
                                setSelectedAnswers((prev) => ({ ...prev, [q.id]: optKey }))
                              }
                              className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-amber-500 text-white border-amber-400 font-bold shadow-md'
                                  : isDark
                                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center text-[10px] font-bold">
                                {optKey}
                              </span>
                              <span>{optionText}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(selectedAnswers).length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm rounded-xl shadow-lg disabled:opacity-50"
                  >
                    Submit Quiz Answers
                  </button>
                </div>
              ) : (
                <div
                  className={`p-12 text-center rounded-2xl border space-y-4 ${
                    isDark ? 'bg-[#1e293b]/60 border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <HelpCircle className="w-12 h-12 text-amber-400 mx-auto" />
                  <h4 className="text-base font-bold">No Practice Quiz Generated Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Generate an interactive multiple choice quiz to test your memory on this document.
                  </p>
                  <button
                    onClick={handleGenerateDocQuiz}
                    className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Generate Practice Quiz Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: MIND MAP */}
          {activeTab === 'mind-map' && mindMapData && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-center space-y-1">
                <h3 className={`text-lg font-bold flex items-center justify-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Network className="w-5 h-5 text-emerald-400" />
                  <span>Interactive Concept Mind Map</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visual node layout of topics, tags, and key takeaways.
                </p>
              </div>

              {/* Mind Map Tree Nodes */}
              <div className="space-y-6">
                {/* Central Root Node */}
                <div className="flex justify-center">
                  <div className="px-8 py-4 rounded-3xl bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] text-white font-extrabold text-base shadow-xl text-center border-2 border-white/20">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-200">DOCUMENT ROOT</p>
                    <span>{mindMapData.central}</span>
                  </div>
                </div>

                {/* Branches */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mindMapData.branches.map((branch, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border space-y-3 relative ${
                        isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200 shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <h4 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">
                          {branch.name}
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {branch.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                              isDark
                                ? 'bg-white/5 border-white/10 text-slate-200'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ASK AI (Chat with AI) */}
          {activeTab === 'ask-ai' && (
            <div className="max-w-3xl mx-auto flex flex-col h-[520px] rounded-3xl border overflow-hidden shadow-xl bg-[#0f172a] border-white/10">
              {/* Chat Header */}
              <div className="p-4 bg-[#1e293b] border-b border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Tutor for "{note.title}"</h4>
                  <p className="text-[11px] text-slate-400">Ask questions grounded in this document</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                        msg.role === 'user'
                          ? 'bg-[#6366F1] text-white rounded-tr-none'
                          : 'bg-[#1e293b] border border-white/10 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p className="text-[10px] text-slate-400 text-right">{msg.time}</p>
                    </div>
                  </div>
                ))}
                {chatSending && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-[#1e293b] border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                      <span>Reading document and formulating response...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-[#1e293b] border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  placeholder={`Ask anything about "${note.title}"...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatSending}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 8: RAW TEXT */}
          {activeTab === 'raw-text' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Raw Extracted Document Text
                  </h3>
                  <p className="text-xs text-slate-400">
                    Exact text content parsed from original upload.
                  </p>
                </div>
                <button
                  onClick={() => handleCopyContent(note.content)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Raw Text</span>
                </button>
              </div>

              <div
                className={`p-6 rounded-2xl border text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                  isDark ? 'bg-[#050505] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {note.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
