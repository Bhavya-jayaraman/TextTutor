/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCw,
  Trophy,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Play,
  History,
  Grid,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  Award,
  BookOpen,
  Calendar,
  BarChart3,
  Clock,
} from 'lucide-react';
import { ThemeMode } from '../../types/dashboard.js';
import {
  clientQuizService,
  QuizItem,
  QuizQuestionItem,
  QuizAttemptItem,
} from '../../services/clientQuizService.js';
import { clientNotesService } from '../../services/clientNotesService.js';
import { Note } from '../../types/notes.js';

interface QuizViewProps {
  theme: ThemeMode;
}

export const QuizView: React.FC<QuizViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  // Navigation sub-views: 'library' | 'player' | 'results' | 'history'
  const [subView, setSubView] = useState<'library' | 'player' | 'results' | 'history'>('library');

  // State for Quizzes & History
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [history, setHistory] = useState<QuizAttemptItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Active Quiz State (Player)
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Active Result State (Results View)
  const [activeAttempt, setActiveAttempt] = useState<QuizAttemptItem | null>(null);

  // Generate Quiz Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);

  // Fetch Quizzes List
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await clientQuizService.getQuizzes(selectedCategory);
      if (res.success && res.quizzes) {
        setQuizzes(res.quizzes);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch History List
  const fetchHistory = async () => {
    try {
      const res = await clientQuizService.getQuizHistory();
      if (res.success && res.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error('Error fetching quiz history:', err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchHistory();
  }, [selectedCategory]);

  // Load user notes for generation modal
  const loadNotesForModal = async () => {
    try {
      const res = await clientNotesService.getAllNotes();
      if (res.success && res.notes) {
        setUserNotes(res.notes);
        if (res.notes.length > 0 && !selectedNoteId) {
          setSelectedNoteId(res.notes[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const handleOpenGenerateModal = () => {
    loadNotesForModal();
    setIsGenerateModalOpen(true);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedNoteId) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await clientQuizService.generateQuiz({
        noteId: parseInt(selectedNoteId, 10),
      });

      if (res.success && res.quiz) {
        setIsGenerateModalOpen(false);
        await fetchQuizzes();
        // Start quiz immediately
        handleStartQuiz(res.quiz.id);
      } else {
        setError(res.message || 'Failed to generate quiz.');
      }
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setError('Failed to connect to AI server. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Start Playing a Quiz
  const handleStartQuiz = async (quizId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientQuizService.getQuizById(quizId);
      if (res.success && res.quiz) {
        setActiveQuiz(res.quiz);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setSubView('player');
      } else {
        setError(res.message || 'Could not load quiz questions.');
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError('Failed to load quiz details.');
    } finally {
      setLoading(false);
    }
  };

  // Select Answer Option in Player
  const handleSelectOption = (questionId: number, option: 'A' | 'B' | 'C' | 'D') => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  // Submit Active Quiz
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await clientQuizService.submitQuiz(activeQuiz.id, userAnswers);
      if (res.success && res.attempt) {
        setActiveAttempt(res.attempt);
        setSubView('results');
        fetchHistory();
      } else {
        setError(res.message || 'Failed to submit quiz.');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to process quiz submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const res = await clientQuizService.deleteQuiz(id);
      if (res.success) {
        setQuizzes((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  // Unique categories
  const categories = Array.from(new Set(quizzes.map((q) => q.category))).filter(Boolean);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <HelpCircle className="w-6 h-6 text-amber-400" />
            <span>AI Quiz Generator</span>
          </h1>
          <p className="text-xs text-[var(--text-dim)]">
            Practice active recall with AI-generated multiple-choice questions from your notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-view switcher */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${isDark ? 'bg-surface/50 border-theme' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setSubView('library')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                subView === 'library'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Quizzes ({quizzes.length})</span>
            </button>
            <button
              onClick={() => setSubView('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                subView === 'history'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Attempts ({history.length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenGenerateModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Quiz</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline font-semibold hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 1. QUIZ LIBRARY SUBVIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subView === 'library' && (
        <div className="space-y-6">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold shrink-0">Filter Category:</span>
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1 rounded-lg border font-semibold transition-all shrink-0 ${
                  selectedCategory === 'All'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg border font-semibold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-[#94a3b8]">Loading your quiz library...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className={`p-12 rounded-3xl border text-center space-y-4 ${isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  No Quizzes Created Yet
                </h3>
                <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
                  Generate your first interactive AI practice quiz directly from any saved study note.
                </p>
              </div>
              <button
                onClick={handleOpenGenerateModal}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                ✨ Generate Practice Quiz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() => handleStartQuiz(quiz.id)}
                  className={`cursor-pointer p-6 rounded-2xl border space-y-4 flex flex-col justify-between transition-all group hover:border-amber-500/50 ${
                    isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {quiz.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>{quiz.questions_count || 0} Questions</span>
                      </span>
                    </div>

                    <h3 className={`text-base font-bold group-hover:text-amber-400 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {quiz.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm">
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Start</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. QUIZ PLAYER SUBVIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subView === 'player' && activeQuiz && activeQuiz.questions && activeQuiz.questions.length > 0 && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSubView('library')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Library</span>
            </button>
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              {activeQuiz.category}
            </span>
          </div>

          <div className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            {/* Title & Progress Header */}
            <div className="space-y-3">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeQuiz.title}
              </h2>

              <div className="flex justify-between items-center text-xs font-mono text-[#94a3b8]">
                <span>
                  Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                </span>
                <span>
                  Answered: {Object.keys(userAnswers).length} / {activeQuiz.questions.length}
                </span>
              </div>

              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Question Box */}
            {(() => {
              const q = activeQuiz.questions[currentQuestionIndex];
              const selectedOpt = userAnswers[q.id];

              const options: Array<{ key: 'A' | 'B' | 'C' | 'D'; label: string }> = [
                { key: 'A', label: q.option_a },
                { key: 'B', label: q.option_b },
                { key: 'C', label: q.option_c },
                { key: 'D', label: q.option_d },
              ];

              return (
                <div className="space-y-5">
                  <p className={`text-base font-bold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {q.question}
                  </p>

                  <div className="space-y-3">
                    {options.map((opt) => {
                      const isSelected = selectedOpt === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectOption(q.id, opt.key)}
                          className={`w-full p-4 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                              : isDark
                              ? 'bg-[#050505] border-white/10 text-slate-300 hover:border-white/30'
                              : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                                isSelected ? 'bg-amber-500 text-black' : 'bg-white/10'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span>{opt.label}</span>
                          </span>

                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Navigation Controls */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 disabled:opacity-30 hover:text-white"
              >
                Previous
              </button>

              {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Quiz</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. RESULTS SUBVIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subView === 'results' && activeAttempt && (
        <div className="space-y-6">
          {/* Score Header Card */}
          <div
            className={`p-8 rounded-3xl border text-center space-y-4 ${
              isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                {activeAttempt.category || 'Practice Quiz'}
              </span>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeAttempt.quiz_title}
              </h2>
            </div>

            <div className="flex justify-center items-center gap-6 py-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#94a3b8]">Score</p>
                <p className="text-2xl font-black text-amber-400">
                  {activeAttempt.score} / {activeAttempt.total_questions}
                </p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-[10px] font-bold uppercase text-[#94a3b8]">Percentage</p>
                <p
                  className={`text-2xl font-black ${
                    activeAttempt.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {activeAttempt.percentage}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setSubView('library')}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back to Library
              </button>
              <button
                onClick={() => setSubView('history')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl"
              >
                View All Attempts
              </button>
            </div>
          </div>

          {/* Question Breakdown with AI Explanations */}
          <div className="space-y-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Detailed Answer Review & AI Explanations</span>
            </h3>

            {activeAttempt.answers.map((ans, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className={`text-xs font-bold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {idx + 1}. {ans.question_text}
                  </h4>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border shrink-0 flex items-center gap-1 ${
                      ans.is_correct
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {ans.is_correct ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{ans.is_correct ? 'Correct' : 'Incorrect'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      ans.is_correct
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span className="font-bold opacity-75">Your Answer: </span>
                    <span>Option {ans.selected_option || 'None Selected'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <span className="font-bold opacity-75">Correct Answer: </span>
                    <span>Option {ans.correct_answer}</span>
                  </div>
                </div>

                {ans.explanation && (
                  <div className="p-3 rounded-xl bg-[#818cf8]/10 border border-[#818cf8]/30 text-xs space-y-1">
                    <span className="font-bold text-[#818cf8] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Explanation:</span>
                    </span>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{ans.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. QUIZ HISTORY SUBVIEW */}
      {/* ---------------------------------------------------------------------- */}
      {subView === 'history' && (
        <div className="space-y-4">
          <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Quiz Attempts History
          </h2>

          {history.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center text-xs text-[#94a3b8] ${isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200'}`}>
              No quiz attempt history yet. Complete a practice quiz to record performance!
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((att) => (
                <div
                  key={att.id}
                  onClick={() => {
                    setActiveAttempt(att);
                    setSubView('results');
                  }}
                  className={`cursor-pointer p-5 rounded-2xl border flex items-center justify-between transition-all hover:border-amber-500/50 ${
                    isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {att.category || 'General'}
                      </span>
                      <span className="text-xs text-[#94a3b8]">
                        {new Date(att.completed_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {att.quiz_title || 'Practice Quiz'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-black text-amber-400">
                        {att.score} / {att.total_questions}
                      </p>
                      <p
                        className={`text-[11px] font-bold ${
                          att.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {att.percentage}%
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* GENERATE QUIZ MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 relative ${
              isDark ? 'bg-[#111115] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Generate AI Practice Quiz</span>
              </h2>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-[#94a3b8]">
                Select a saved study note. TextTutor AI will formulate 3-5 multiple-choice questions with educational explanations.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Select Note:</label>
                {userNotes.length === 0 ? (
                  <p className="text-slate-500 italic">No notes found. Create a note first!</p>
                ) : (
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none ${
                      isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  >
                    {userNotes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({n.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateQuiz}
                disabled={generating || !selectedNoteId}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
