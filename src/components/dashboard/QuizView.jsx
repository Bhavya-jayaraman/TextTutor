/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Check,
  Award,
  BookOpen,
  Calendar,
  BarChart3,
  X,
} from 'lucide-react';
import { clientQuizService } from '../../services/clientQuizService.js';
import { clientNotesService } from '../../services/clientNotesService.js';

export const QuizView = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';

  // Sub-views: 'library' | 'player' | 'results' | 'history'
  const [subView, setSubView] = useState('library');

  // State
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalQuizzes: 0, totalAttempts: 0, averageScore: 0, bestScore: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesList, setNotesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Player State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState(null);

  // Generate Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [generateTitle, setGenerateTitle] = useState('');
  const [generateContent, setGenerateContent] = useState('');
  const [generateCategory, setGenerateCategory] = useState('General');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load quizzes, stats, and history
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizzesRes, statsRes, historyRes, notesRes] = await Promise.all([
        clientQuizService.getUserQuizzes(),
        clientQuizService.getQuizStats().catch(() => null),
        clientQuizService.getQuizHistory().catch(() => ({ history: [] })),
        clientNotesService.getAllNotes().catch(() => ({ notes: [] })),
      ]);

      if (quizzesRes.success && quizzesRes.quizzes) {
        setQuizzes(quizzesRes.quizzes);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      }
      if (historyRes && historyRes.history) {
        setHistory(historyRes.history);
      }
      if (notesRes && notesRes.notes) {
        setNotesList(notesRes.notes);
      }
    } catch (err) {
      console.error('Error loading quiz data:', err);
      setError('Unable to load quizzes. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    if (selectedCategory === 'All') return quizzes;
    return quizzes.filter((q) => q.category === selectedCategory);
  }, [quizzes, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(quizzes.map((q) => q.category || 'General'));
    return ['All', ...Array.from(set)];
  }, [quizzes]);

  // Start Quiz
  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setLatestAttempt(null);
    setSubView('player');
  };

  // Select Option
  const handleSelectOption = (questionId, optionKey) => {
    setUserAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionKey,
    }));
  };

  // Submit Quiz Attempt
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const res = await clientQuizService.submitQuiz(activeQuiz.id, userAnswers);
      if (res.success && res.attempt) {
        setLatestAttempt(res.attempt);
        setSubView('results');
        loadData();
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Quiz
  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const payload = {
        noteId: selectedNoteId ? parseInt(selectedNoteId, 10) : undefined,
        title: generateTitle.trim() || undefined,
        content: generateContent.trim() || undefined,
        category: generateCategory.trim() || 'General',
        count: 3,
      };

      const res = await clientQuizService.generateQuiz(payload);
      if (res.success && res.quiz) {
        setQuizzes((prev) => [res.quiz, ...prev]);
        setIsGenerateOpen(false);
        setGenerateTitle('');
        setGenerateContent('');
        setSelectedNoteId('');
        handleStartQuiz(res.quiz);
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await clientQuizService.deleteQuiz(id);
      if (res.success) {
        setQuizzes((prev) => prev.filter((q) => q.id !== id));
        loadData();
      }
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  const currentQuestion = activeQuiz?.questions?.[currentQuestionIndex] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Interactive Practice Quizzes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Test your knowledge with multiple-choice questions generated from your study notes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate New Quiz</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveQuiz(null);
              setSubView('library');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              subView === 'library'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Quiz Library ({quizzes.length})</span>
          </button>

          <button
            onClick={() => setSubView('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              subView === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Attempt History ({history.length})</span>
          </button>
        </div>

        {subView === 'player' && activeQuiz && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            Playing: {activeQuiz.title}
          </span>
        )}
      </div>

      {/* Stats Bar */}
      {subView === 'library' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Total Quizzes</span>
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalQuizzes}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalAttempts}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Avg. Score</span>
              <BarChart3 className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.averageScore}%</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Best Score</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.bestScore}%</p>
          </div>
        </div>
      )}

      {/* Main View Switcher */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading your quizzes...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition"
          >
            Retry Connection
          </button>
        </div>
      ) : subView === 'player' && activeQuiz && currentQuestion ? (
        /* QUIZ PLAYER */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Question Progress Header */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>
              Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400">
              {Object.keys(userAnswers).length} answered
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{
                width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Card */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.question}
            </h3>

            {/* Multiple Choice Options */}
            <div className="space-y-3">
              {[
                { key: 'A', text: currentQuestion.optionA },
                { key: 'B', text: currentQuestion.optionB },
                { key: 'C', text: currentQuestion.optionC },
                { key: 'D', text: currentQuestion.optionD },
              ].map((opt) => {
                const isSelected = userAnswers[String(currentQuestion.id)] === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, opt.key)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                currentQuestionIndex === 0
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Grading Quiz...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit & View Results</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : subView === 'results' && latestAttempt ? (
        /* RESULTS VIEW */
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center ${
              latestAttempt.percentage >= 80
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : latestAttempt.percentage >= 60
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
            }`}>
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {latestAttempt.percentage}%
              </p>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
                Scored {latestAttempt.score} out of {latestAttempt.total_questions} questions correct
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-2 max-w-md mx-auto">
                {latestAttempt.feedback}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  if (activeQuiz) handleStartQuiz(activeQuiz);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
              >
                <RotateCw className="w-4 h-4" />
                <span>Take Quiz Again</span>
              </button>

              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setSubView('library');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <span>Back to Library</span>
              </button>
            </div>
          </div>

          {/* Question Breakdown */}
          {latestAttempt.details && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
                Detailed Answer Breakdown
              </h3>
              {latestAttempt.details.map((detail, idx) => (
                <div
                  key={detail.questionId || idx}
                  className={`p-5 rounded-2xl border transition ${
                    detail.isCorrect
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {detail.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1.5 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {idx + 1}. {detail.question}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className={detail.isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-rose-700 dark:text-rose-300 font-medium'}>
                          Your Answer: {detail.selectedAnswer || 'Unanswered'}
                        </span>
                        {!detail.isCorrect && (
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                            Correct: {detail.correctAnswer}
                          </span>
                        )}
                      </div>
                      {detail.explanation && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/40 dark:border-slate-800/60">
                          {detail.explanation}
                        </p>
                      )}
                      {(activeQuiz?.questions?.[idx]?.source_reference || activeQuiz?.questions?.[idx]?.sourceReference) && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5">
                          <BookOpen className="w-3 h-3" />
                          <span>Source: {activeQuiz.questions[idx].source_reference || activeQuiz.questions[idx].sourceReference}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : subView === 'history' ? (
        /* ATTEMPT HISTORY */
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="p-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <History className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">No attempts recorded</h3>
              <p className="text-xs text-slate-500">Take a quiz from the library to track your scores here.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
              {history.map((att) => (
                <div key={att.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      att.percentage >= 80
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : att.percentage >= 60
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {att.percentage}%
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {att.quiz_title || 'Practice Quiz'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Score: {att.score}/{att.total_questions} questions correct
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(att.completed_at || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* QUIZ LIBRARY */
        <div className="space-y-4">
          {filteredQuizzes.length === 0 ? (
            <div className="p-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No practice quizzes yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  Generate multiple-choice quizzes automatically from your lecture notes or study topics.
                </p>
              </div>
              <button
                onClick={() => setIsGenerateOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Your First Quiz</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() => handleStartQuiz(quiz)}
                  className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {quiz.category || 'General'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {quiz.questions?.length || 0} Questions
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {quiz.title}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <Play className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400" />
                      <span>Start Quiz</span>
                    </span>

                    <button
                      onClick={(e) => handleDeleteQuiz(e, quiz.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate Quiz Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Quiz Generator</h3>
              </div>
              <button onClick={() => setIsGenerateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              {notesList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select from Your Notes</label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedNoteId(id);
                      const found = notesList.find((n) => String(n.id) === id);
                      if (found) {
                        setGenerateTitle(found.title);
                        setGenerateContent(found.content);
                        setGenerateCategory(found.category || 'General');
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose a study note (or enter manually below) --</option>
                    {notesList.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({n.category || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Quiz Topic / Title</label>
                <input
                  type="text"
                  required
                  value={generateTitle}
                  onChange={(e) => setGenerateTitle(e.target.value)}
                  placeholder="e.g., Cellular Respiration Quiz"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Material Content to Test</label>
                <textarea
                  rows={5}
                  value={generateContent}
                  onChange={(e) => setGenerateContent(e.target.value)}
                  placeholder="Paste lecture notes or chapter summary here..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !generateTitle.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Generating MCQs...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Practice Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;
