/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Loader2,
  Grid,
  Play,
  AlertCircle,
  Award,
  RefreshCw,
} from 'lucide-react';
import { ThemeMode } from '../../types/dashboard.js';
import {
  clientFlashcardService,
  FlashcardItem,
} from '../../services/clientFlashcardService.js';
import { clientNotesService } from '../../services/clientNotesService.js';
import { Note } from '../../types/notes.js';

interface FlashcardsViewProps {
  theme: ThemeMode;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  // State
  const [viewMode, setViewMode] = useState<'study' | 'library'>('study');
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Study Deck State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Filters state for library
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedMastered, setSelectedMastered] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Fetch Flashcards
  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      const res = await clientFlashcardService.getFlashcards({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
        mastered:
          selectedMastered === 'Mastered'
            ? true
            : selectedMastered === 'Revision'
            ? false
            : undefined,
        search: searchQuery || undefined,
      });

      if (res.success && res.flashcards) {
        setFlashcards(res.flashcards);
        if (res.flashcards.length > 0 && currentIndex >= res.flashcards.length) {
          setCurrentIndex(0);
        }
      }
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError('Failed to load flashcards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [selectedCategory, selectedDifficulty, selectedMastered, searchQuery]);

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

  const handleGenerateFromModal = async () => {
    if (!selectedNoteId) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await clientFlashcardService.generateFlashcards({
        noteId: parseInt(selectedNoteId, 10),
      });

      if (res.success && res.flashcards) {
        setIsGenerateModalOpen(false);
        fetchFlashcards();
        setViewMode('study');
        setCurrentIndex(0);
        setIsFlipped(false);
      } else {
        setError(res.message || 'Failed to generate flashcards.');
      }
    } catch (err: any) {
      console.error('Flashcards generation error:', err);
      setError('Failed to connect to AI server. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Deck Controls
  const currentCard = flashcards[currentIndex] || null;

  const handleNext = () => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleShuffle = () => {
    if (flashcards.length === 0) return;
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleToggleMastered = async (card: FlashcardItem) => {
    const newStatus = !card.mastered;
    try {
      const res = await clientFlashcardService.updateFlashcard(card.id, {
        mastered: newStatus,
      });

      if (res.success) {
        setFlashcards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, mastered: newStatus } : c))
        );
      }
    } catch (err) {
      console.error('Error toggling mastered status:', err);
    }
  };

  const handleRateDifficulty = async (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    if (!currentCard) return;
    setReviewedCount((prev) => prev + 1);

    try {
      await clientFlashcardService.updateFlashcard(currentCard.id, {
        difficulty,
      });
      setFlashcards((prev) =>
        prev.map((c) => (c.id === currentCard.id ? { ...c, difficulty } : c))
      );
    } catch (err) {
      console.error('Error updating difficulty:', err);
    }

    handleNext();
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    try {
      const res = await clientFlashcardService.deleteFlashcard(id);
      if (res.success) {
        setFlashcards((prev) => prev.filter((c) => c.id !== id));
        if (currentIndex >= flashcards.length - 1) {
          setCurrentIndex(Math.max(0, flashcards.length - 2));
        }
      }
    } catch (err) {
      console.error('Error deleting flashcard:', err);
    }
  };

  // Stats calculation
  const totalCards = flashcards.length;
  const masteredCount = flashcards.filter((c) => c.mastered).length;
  const remainingCount = totalCards - masteredCount;
  const progressPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  // Categories list
  const categories = Array.from(new Set(flashcards.map((c) => c.category))).filter(Boolean);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Layers className="w-6 h-6 text-[#818cf8]" />
            <span>AI Flashcards Studio</span>
          </h1>
          <p className="text-xs text-[#94a3b8]">
            Interactive study cards generated from your notes with spaced repetition mastery tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${isDark ? 'bg-[#050505] border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setViewMode('study')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'study'
                  ? 'bg-[#818cf8] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Study Deck</span>
            </button>
            <button
              onClick={() => setViewMode('library')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'library'
                  ? 'bg-[#818cf8] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Library ({totalCards})</span>
            </button>
          </div>

          <button
            onClick={handleOpenGenerateModal}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Cards</span>
          </button>
        </div>
      </div>

      {/* Progress Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border space-y-1 ${isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200 shadow-xs'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">Total Cards</p>
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCards}</p>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1 ${isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200 shadow-xs'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Mastered</p>
          <p className="text-2xl font-black text-emerald-400">{masteredCount}</p>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1 ${isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200 shadow-xs'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Remaining</p>
          <p className="text-2xl font-black text-amber-400">{remainingCount}</p>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1 ${isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200 shadow-xs'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Deck Mastery</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-indigo-400">{progressPercent}%</span>
            <div className="flex-1 h-2 bg-slate-700/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
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

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#818cf8] animate-spin mx-auto" />
          <p className="text-xs text-[#94a3b8]">Loading your study flashcards...</p>
        </div>
      ) : flashcards.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center space-y-4 ${isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="w-12 h-12 rounded-2xl bg-[#818cf8]/20 border border-[#818cf8]/40 flex items-center justify-center text-[#818cf8] mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Flashcards Found
            </h3>
            <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
              Select one of your saved notes to automatically generate interactive AI flashcards.
            </p>
          </div>
          <button
            onClick={handleOpenGenerateModal}
            className="px-5 py-2.5 bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
          >
            ✨ Generate Flashcards Now
          </button>
        </div>
      ) : viewMode === 'study' ? (
        /* STUDY DECK MODE */
        <div className="space-y-6">
          {/* Deck Action Bar */}
          <div className="flex items-center justify-between text-xs text-[#94a3b8] font-mono">
            <span>
              Card {currentIndex + 1} of {totalCards} ({Math.round(((currentIndex + 1) / totalCards) * 100)}% deck progress)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShuffle}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 flex items-center gap-1.5 text-slate-300 transition-colors"
                title="Shuffle Deck"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
              <button
                onClick={handleRestart}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 flex items-center gap-1.5 text-slate-300 transition-colors"
                title="Restart Session"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            </div>
          </div>

          {/* Interactive Flashcard Stage with 3D Flip */}
          {currentCard && (
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`cursor-pointer min-h-[300px] p-8 rounded-3xl border shadow-2xl flex flex-col justify-between transition-all transform hover:scale-[1.01] relative overflow-hidden group ${
                isDark
                  ? 'bg-[#111115] border-white/10 hover:border-[#818cf8]/50'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              {/* Top Card Info Bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#818cf8] px-2.5 py-0.5 rounded bg-[#818cf8]/15 border border-[#818cf8]/30">
                    {currentCard.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      currentCard.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : currentCard.difficulty === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {currentCard.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentCard.mastered && (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>Mastered</span>
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-[#818cf8] animate-spin-slow" />
                    <span>{isFlipped ? 'BACK (ANSWER)' : 'FRONT (QUESTION)'}</span>
                  </span>
                </div>
              </div>

              {/* Card Center Content */}
              <div className="py-10 text-center max-w-2xl mx-auto space-y-3">
                <h2 className={`text-xl sm:text-2xl font-bold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isFlipped ? currentCard.answer : currentCard.question}
                </h2>
              </div>

              {/* Bottom Card Helper */}
              <div className="flex justify-between items-center text-xs text-[#94a3b8] pt-2 border-t border-white/5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMastered(currentCard);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                    currentCard.mastered
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{currentCard.mastered ? 'Mastered' : 'Mark as Mastered'}</span>
                </button>

                <span className="text-[#818cf8] font-semibold text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Click card to flip</span>
                </span>
              </div>
            </div>
          )}

          {/* Controls Bar: Prev/Next & Self-Assessment Ratings */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isDark ? 'bg-[#111115] border-white/10 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={handleNext}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isDark ? 'bg-[#111115] border-white/10 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Assessment buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleRateDifficulty('Hard')}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 rounded-xl text-xs font-bold transition-all"
              >
                Hard 😓
              </button>
              <button
                onClick={() => handleRateDifficulty('Medium')}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 rounded-xl text-xs font-bold transition-all"
              >
                Good 🤔
              </button>
              <button
                onClick={() => handleRateDifficulty('Easy')}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-xl text-xs font-bold transition-all"
              >
                Easy 🚀
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* FLASHCARD LIBRARY GRID MODE */
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#111115] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-bold text-[#818cf8]">
              <Filter className="w-3.5 h-3.5" />
              <span>Library Search & Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#818cf8] ${
                    isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs focus:outline-none ${
                  isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}
              >
                <option value="All">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs focus:outline-none ${
                  isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              {/* Mastered Status */}
              <select
                value={selectedMastered}
                onChange={(e) => setSelectedMastered(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs focus:outline-none ${
                  isDark ? 'bg-[#050505] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}
              >
                <option value="All">All Statuses</option>
                <option value="Mastered">Mastered Only</option>
                <option value="Revision">Needs Revision</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashcards.map((card) => (
              <div
                key={card.id}
                className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
                  isDark ? 'bg-[#111115] border-white/10 hover:border-white/20' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#818cf8] px-2 py-0.5 rounded bg-[#818cf8]/15 border border-[#818cf8]/30">
                      {card.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        card.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : card.difficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {card.difficulty}
                    </span>
                  </div>

                  <p className={`text-xs font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Q: {card.question}
                  </p>
                  <p className={`text-xs leading-relaxed border-t border-white/5 pt-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    A: {card.answer}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleMastered(card)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                      card.mastered
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{card.mastered ? 'Mastered' : 'Mark Mastered'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Flashcards Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 relative ${
              isDark ? 'bg-[#111115] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#818cf8]" />
                <span>Generate AI Flashcards</span>
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
                Select one of your saved notes. TextTutor AI will analyze the text, extract key facts, and generate a deck of flashcards.
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
                onClick={handleGenerateFromModal}
                disabled={generating || !selectedNoteId}
                className="px-4 py-2 bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Cards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Cards</span>
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
