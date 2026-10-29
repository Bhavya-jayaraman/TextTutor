/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientFlashcardService = {
  async getUserFlashcards(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.noteId) queryParams.append('noteId', String(params.noteId));
    if (params.category && params.category !== 'all') queryParams.append('category', params.category);
    if (params.difficulty && params.difficulty !== 'all') queryParams.append('difficulty', params.difficulty);
    if (params.mastered !== undefined) queryParams.append('mastered', String(params.mastered));
    if (params.search) queryParams.append('search', params.search);

    const qs = queryParams.toString();
    const url = qs ? `/flashcards?${qs}` : '/flashcards';
    const response = await API.get(url);
    return response.data;
  },

  async getFlashcardStats() {
    const response = await API.get('/flashcards/stats');
    return response.data;
  },

  async getFlashcardById(id) {
    const response = await API.get(`/flashcards/${id}`);
    return response.data;
  },

  async createFlashcard(payload) {
    const response = await API.post('/flashcards', payload);
    return response.data;
  },

  async generateFlashcards(payload) {
    const response = await API.post('/flashcards/generate', payload);
    return response.data;
  },

  async updateFlashcard(id, payload) {
    const response = await API.put(`/flashcards/${id}`, payload);
    return response.data;
  },

  async toggleMastered(id, mastered) {
    const response = await API.patch(`/flashcards/${id}/master`, { mastered });
    return response.data;
  },

  async deleteFlashcard(id) {
    const response = await API.delete(`/flashcards/${id}`);
    return response.data;
  },
};

export default clientFlashcardService;
