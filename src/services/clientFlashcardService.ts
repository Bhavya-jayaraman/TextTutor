/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export interface FlashcardItem {
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

export interface FlashcardFilterOptions {
  noteId?: number;
  category?: string;
  difficulty?: string;
  mastered?: boolean;
  search?: string;
}

export interface GenerateFlashcardsResponse {
  success: boolean;
  message?: string;
  flashcards: FlashcardItem[];
}

export interface FlashcardListResponse {
  success: boolean;
  message?: string;
  flashcards: FlashcardItem[];
}

export interface FlashcardStatsResponse {
  success: boolean;
  totalFlashcards: number;
  masteredCount: number;
  remainingCount: number;
  recentlyGenerated: FlashcardItem[];
}

export const clientFlashcardService = {
  async generateFlashcards(payload: {
    noteId?: number;
    title?: string;
    content?: string;
    category?: string;
  }): Promise<GenerateFlashcardsResponse> {
    const response = await API.post<GenerateFlashcardsResponse>('/ai/flashcards', payload);
    return response.data;
  },

  async getFlashcards(filters?: FlashcardFilterOptions): Promise<FlashcardListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.noteId) params.append('noteId', filters.noteId.toString());
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.mastered !== undefined) params.append('mastered', filters.mastered.toString());
      if (filters.search) params.append('search', filters.search);
    }
    const response = await API.get<FlashcardListResponse>(`/flashcards?${params.toString()}`);
    return response.data;
  },

  async getStats(): Promise<FlashcardStatsResponse> {
    const response = await API.get<FlashcardStatsResponse>('/flashcards/stats');
    return response.data;
  },

  async updateFlashcard(
    id: number,
    updates: {
      mastered?: boolean;
      difficulty?: 'Easy' | 'Medium' | 'Hard';
      question?: string;
      answer?: string;
    }
  ): Promise<{ success: boolean; flashcard?: FlashcardItem; message?: string }> {
    const response = await API.put(`/flashcards/${id}`, updates);
    return response.data;
  },

  async deleteFlashcard(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await API.delete(`/flashcards/${id}`);
    return response.data;
  },
};
