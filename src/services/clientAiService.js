/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientAiService = {
  /**
   * Request an AI summary of a note.
   */
  async summarizeNote(payload) {
    const response = await API.post('/ai/summarize', payload);
    return response.data;
  },

  /**
   * Get all previous summaries for a given note.
   */
  async getSummariesForNote(noteId) {
    const response = await API.get(`/ai/summaries/note/${noteId}`);
    return response.data;
  },

  /**
   * Explain a keyword in study context.
   */
  async explainKeyword(keyword, contextTitle = '') {
    const response = await API.post('/ai/keyword-explain', { keyword, contextTitle });
    return response.data;
  },

  /**
   * Get overall AI usage stats for the user.
   */
  async getAiStats() {
    const response = await API.get('/ai/stats');
    return response.data;
  },
};
