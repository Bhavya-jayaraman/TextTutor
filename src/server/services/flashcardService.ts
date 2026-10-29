/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const flashcardsFilePath = path.join(dataDir, 'flashcards.json');

export interface DBFlashcard {
  id: number;
  user_id: number;
  note_id?: number;
  question: string;
  answer: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mastered: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlashcardFilterParams {
  noteId?: number;
  category?: string;
  difficulty?: string;
  mastered?: boolean;
  search?: string;
}

function loadFlashcards(): DBFlashcard[] {
  try {
    if (fs.existsSync(flashcardsFilePath)) {
      const raw = fs.readFileSync(flashcardsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading flashcards.json:', err);
  }
  return [];
}

function saveFlashcards(cards: DBFlashcard[]): void {
  try {
    fs.writeFileSync(flashcardsFilePath, JSON.stringify(cards, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing flashcards.json:', err);
  }
}

export const flashcardService = {
  getUserFlashcards(userId: number, filters?: FlashcardFilterParams): DBFlashcard[] {
    let cards = loadFlashcards().filter((c) => c.user_id === userId);

    if (filters) {
      if (filters.noteId) {
        cards = cards.filter((c) => c.note_id === filters.noteId);
      }
      if (filters.category && filters.category !== 'All') {
        cards = cards.filter((c) => c.category.toLowerCase() === filters.category!.toLowerCase());
      }
      if (filters.difficulty && filters.difficulty !== 'All') {
        cards = cards.filter((c) => c.difficulty.toLowerCase() === filters.difficulty!.toLowerCase());
      }
      if (typeof filters.mastered === 'boolean') {
        cards = cards.filter((c) => c.mastered === filters.mastered);
      }
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase();
        cards = cards.filter(
          (c) => c.question.toLowerCase().includes(query) || c.answer.toLowerCase().includes(query)
        );
      }
    }

    return cards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getFlashcardById(id: number, userId: number): DBFlashcard | null {
    const cards = loadFlashcards();
    const found = cards.find((c) => c.id === id && c.user_id === userId);
    return found || null;
  },

  bulkCreate(
    userId: number,
    noteId: number | undefined,
    category: string,
    rawCards: Array<{ question: string; answer: string; difficulty?: 'Easy' | 'Medium' | 'Hard' }>
  ): DBFlashcard[] {
    const allCards = loadFlashcards();
    const maxId = allCards.length > 0 ? Math.max(...allCards.map((c) => c.id)) : 0;
    const now = new Date().toISOString();

    const created: DBFlashcard[] = rawCards.map((item, idx) => ({
      id: maxId + idx + 1,
      user_id: userId,
      note_id: noteId,
      question: item.question,
      answer: item.answer,
      category: category || 'General',
      difficulty: item.difficulty || 'Medium',
      mastered: false,
      created_at: now,
      updated_at: now,
    }));

    allCards.push(...created);
    saveFlashcards(allCards);
    return created;
  },

  updateFlashcard(id: number, userId: number, updates: Partial<DBFlashcard>): DBFlashcard | null {
    const allCards = loadFlashcards();
    const idx = allCards.findIndex((c) => c.id === id && c.user_id === userId);
    if (idx === -1) return null;

    const updated: DBFlashcard = {
      ...allCards[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    allCards[idx] = updated;
    saveFlashcards(allCards);
    return updated;
  },

  deleteFlashcard(id: number, userId: number): boolean {
    let allCards = loadFlashcards();
    const existing = allCards.find((c) => c.id === id && c.user_id === userId);
    if (!existing) return false;

    allCards = allCards.filter((c) => !(c.id === id && c.user_id === userId));
    saveFlashcards(allCards);
    return true;
  },

  getFlashcardStats(userId: number): {
    totalFlashcards: number;
    masteredCount: number;
    remainingCount: number;
    recentlyGenerated: DBFlashcard[];
  } {
    const userCards = this.getUserFlashcards(userId);
    const masteredCount = userCards.filter((c) => c.mastered).length;

    return {
      totalFlashcards: userCards.length,
      masteredCount,
      remainingCount: userCards.length - masteredCount,
      recentlyGenerated: userCards.slice(0, 5),
    };
  },
};
