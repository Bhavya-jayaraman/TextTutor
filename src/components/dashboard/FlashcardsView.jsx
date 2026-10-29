/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  HelpCircle,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Search,
  Filter,
  Trash2,
  BookOpen,
  Check,
  XCircle,
  Grid,
  Play,
  AlertCircle,
  Award,
  RefreshCw,
  X,
} from 'lucide-react';
import { clientFlashcardService } from '../../services/clientFlashcardService.js';
import { clientNotesService } from '../../services/clientNotesService.js';

export const FlashcardsView = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';

  // State
  const [viewMode, setViewMode] = useState('study'); // 'study' | 'library'
  const [flashcards, setFlashcards] = useState([]);
  const [stats, setStats] = useState({ total: 0, mastered: 0, learning: 0, masteryPercentage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesList, setNotesList] = useState([]);

  // Study Deck State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedSessionIds, setReviewedSessionIds] = useState(new Set());

  // Filters state for library
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedMastered, setSelectedMastered] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [generateTitle, setGenerateTitle] = useState('');
  const [generateContent, setGenerateContent] = useState('');
  const [generateCategory, setGenerateCategory] = useState('General');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Card Form
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch flashcards and stats
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardsRes, statsRes, notesRes] = await Promise.all([
        clientFlashcardService.getUserFlashcards(),
        clientFlashcardService.getFlashcardStats().catch(() => null),
        clientNotesService.getAllNotes().catch(() => ({ notes: [] })),
      ]);

      if (cardsRes.success && cardsRes.flashcards) {
        setFlashcards(cardsRes.flashcards);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      } else if (cardsRes.flashcards) {
        const total = cardsRes.flashcards.length;
        const mastered = cardsRes.flashcards.filter((c) => c.mastered).length;
        setStats({
          total,
          mastered,
          learning: total - mastered,
          masteryPercentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
        });
      }
      if (notesRes && notesRes.notes) {
        setNotesList(notesRes.notes);
      }
    } catch (err) {
      console.error('Error loading flashcard data:', err);
      setError('Unable to load flashcards. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered cards for study/library
  const filteredCards = useMemo(() => {
    return flashcards.filter((card) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (card.question && card.question.toLowerCase().includes(query)) ||
        (card.answer && card.answer.toLowerCase().includes(query)) ||
        (card.category && card.category.toLowerCase().includes(query));

      const matchesCat =
        selectedCategory === 'All' || card.category === selectedCategory;
      const matchesDiff =
        selectedDifficulty === 'All' || card.difficulty === selectedDifficulty;
      const matchesMast =
        selectedMastered === 'All' ||
        (selectedMastered === 'Mastered' && card.mastered) ||
        (selectedMastered === 'Learning' && !card.mastered);

      return matchesSearch && matchesCat && matchesDiff && matchesMast;
    });
  }, [flashcards, searchQuery, selectedCategory, selectedDifficulty, selectedMastered]);

  const categories = useMemo(() => {
    const set = new Set(flashcards.map((c) => c.category || 'General'));
    return ['All', ...Array.from(set)];
  }, [flashcards]);

  const currentCard = filteredCards[currentIndex] || null;

  // Deck Controls
  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
  };

  const handleRestart = () => {
    setIsFlipped(false);
    setCurrentIndex(0);
    setReviewedSessionIds(new Set());
  };

  // Toggle Mastery
  const handleToggleMastery = async (card, explicitVal = null) => {
    const newVal = explicitVal !== null ? explicitVal : !card.mastered;
    try {
      const res = await clientFlashcardService.toggleMastered(card.id, newVal);
      if (res.success && res.flashcard) {
        setFlashcards((prev) =>
          prev.map((c) => (c.id === card.id ? res.flashcard : c))
        );
        setReviewedSessionIds((prev) => new Set(prev).add(card.id));
        setStats((prev) => {
          const newMastered = newVal ? prev.mastered + 1 : Math.max(0, prev.mastered - 1);
          return {
            ...prev,
            mastered: newMastered,
            learning: Math.max(0, prev.total - newMastered),
            masteryPercentage: prev.total > 0 ? Math.round((newMastered / prev.total) * 100) : 0,
          };
        });
      }
    } catch (err) {
      console.error('Error updating card mastery:', err);
    }
  };

  // Manual Card Creation
  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await clientFlashcardService.createFlashcard({
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        category: formCategory.trim() || 'General',
        difficulty: formDifficulty,
        mastered: false,
      });

      if (res.success && res.flashcard) {
        setFlashcards((prev) => [res.flashcard, ...prev]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          learning: prev.learning + 1,
        }));
        setFormQuestion('');
        setFormAnswer('');
        setIsCreateOpen(false);
      }
    } catch (err) {
      console.error('Create flashcard error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Flashcard Generation
  const handleGenerateCards = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const payload = {
        noteId: selectedNoteId ? parseInt(selectedNoteId, 10) : undefined,
        title: generateTitle.trim() || undefined,
        content: generateContent.trim() || undefined,
        category: generateCategory.trim() || 'General',
        count: 5,
      };

      const res = await clientFlashcardService.generateFlashcards(payload);
      if (res.success && res.flashcards) {
        setFlashcards((prev) => [...res.flashcards, ...prev]);
        loadData();
        setIsGenerateOpen(false);
        setGenerateTitle('');
        setGenerateContent('');
        setSelectedNoteId('');
      }
    } catch (err) {
      console.error('Error generating AI flashcards:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete Card
  const handleDeleteCard = async (id) => {
    try {
      const res = await clientFlashcardService.deleteFlashcard(id);
      if (res.success) {
        setFlashcards((prev) => prev.filter((c) => c.id !== id));
        if (currentIndex >= filteredCards.length - 1) {
          setCurrentIndex(Math.max(0, filteredCards.length - 2));
        }
        loadData();
      }
    } catch (err) {
      console.error('Error deleting flashcard:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Active Recall Flashcards
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Test retention with spaced repetition and AI-generated question cards
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate from Notes</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Card</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Total Deck</span>
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Mastered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.mastered}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Need Review</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.learning}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Mastery Rate</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.masteryPercentage}%</p>
            <span className="text-xs text-slate-400">retention</span>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('study')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              viewMode === 'study'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Interactive Study Deck</span>
          </button>
          <button
            onClick={() => setViewMode('library')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              viewMode === 'library'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Manage All Cards ({filteredCards.length})</span>
          </button>
        </div>

        {viewMode === 'study' && filteredCards.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="p-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Shuffle Cards"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={handleRestart}
              className="p-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Restart Deck"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main View Content */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading your flashcard deck...</p>
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
      ) : filteredCards.length === 0 ? (
        <div className="p-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No flashcards yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Create cards manually or generate an instant recall set from your lecture notes.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate from Notes</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Card</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'study' ? (
        /* Interactive Study Deck */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>
              Card {currentIndex + 1} of {filteredCards.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                {currentCard.category || 'General'}
              </span>
              <span className={`px-2 py-0.5 rounded font-medium ${
                currentCard.difficulty === 'Easy'
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : currentCard.difficulty === 'Hard'
                  ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
              }`}>
                {currentCard.difficulty}
              </span>
            </div>
          </div>

          {/* Flashcard (Click to Flip) */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`min-h-[300px] p-8 rounded-3xl border shadow-sm transition-all duration-300 cursor-pointer flex flex-col justify-between select-none relative ${
              isFlipped
                ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>{isFlipped ? 'Answer / Explanation' : 'Question / Concept'}</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click to flip</span>
              </span>
            </div>

            <div className="my-auto py-6 text-center space-y-3">
              <p className={`text-xl sm:text-2xl font-semibold leading-relaxed ${
                isFlipped ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'
              }`}>
                {isFlipped ? currentCard.answer : currentCard.question}
              </p>
              {isFlipped && (currentCard.source_reference || currentCard.sourceReference) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Source: {currentCard.source_reference || currentCard.sourceReference}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              <span className="text-slate-400">
                {currentCard.mastered ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Mastered
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" /> Need Review
                  </span>
                )}
              </span>

              <span className="text-slate-400">
                Tip: Press Space or Click to reveal
              </span>
            </div>
          </div>

          {/* Review Evaluation Actions */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                handleToggleMastery(currentCard, false);
                handleNext();
              }}
              className="flex-1 py-3 px-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 font-semibold text-sm hover:bg-amber-100 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <XCircle className="w-4 h-4 text-amber-600" />
              <span>Still Learning</span>
            </button>

            <button
              onClick={() => {
                handleToggleMastery(currentCard, true);
                handleNext();
              }}
              className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Mastered & Known</span>
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                currentIndex === 0
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400">
              Reviewed in session: {reviewedSessionIds.size} cards
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex >= filteredCards.length - 1}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                currentIndex >= filteredCards.length - 1
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Manage All Cards (Library View) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {card.category || 'General'}
                    </span>
                    <button
                      onClick={() => handleToggleMastery(card)}
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition ${
                        card.mastered
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {card.mastered ? 'Mastered' : 'Need Review'}
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">
                    {card.question}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-2">
                    {card.answer}
                  </p>
                  {(card.source_reference || card.sourceReference) && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      <BookOpen className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{card.source_reference || card.sourceReference}</span>
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{card.difficulty}</span>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1.5 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    title="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Card Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Flashcard</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Question / Prompt</label>
                <textarea
                  required
                  rows={3}
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g., What are the four conditions for deadlock in operating systems?"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Answer / Explanation</label>
                <textarea
                  required
                  rows={4}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="e.g., Mutual exclusion, Hold and wait, No preemption, and Circular wait."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {isSubmitting ? 'Creating...' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Flashcard Generator</h3>
              </div>
              <button onClick={() => setIsGenerateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerateCards} className="space-y-4">
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
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Topic / Title</label>
                <input
                  type="text"
                  required
                  value={generateTitle}
                  onChange={(e) => setGenerateTitle(e.target.value)}
                  placeholder="e.g., Photosynthesis or CPU Scheduling"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Study Material Content</label>
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
                      <span>Generating Recall Cards...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Recall Deck</span>
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

export default FlashcardsView;
