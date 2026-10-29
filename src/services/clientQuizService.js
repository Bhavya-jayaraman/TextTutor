/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientQuizService = {
  async getUserQuizzes(category) {
    const url = category && category !== 'all' ? `/quizzes?category=${encodeURIComponent(category)}` : '/quizzes';
    const response = await API.get(url);
    return response.data;
  },

  async getQuizById(id) {
    const response = await API.get(`/quizzes/${id}`);
    return response.data;
  },

  async getQuizStats() {
    const response = await API.get('/quizzes/stats');
    return response.data;
  },

  async getQuizHistory() {
    const response = await API.get('/quizzes/history');
    return response.data;
  },

  async generateQuiz(payload) {
    const response = await API.post('/quizzes/generate', payload);
    return response.data;
  },

  async submitQuiz(id, answers) {
    const response = await API.post(`/quizzes/${id}/submit`, { answers });
    return response.data;
  },

  async deleteQuiz(id) {
    const response = await API.delete(`/quizzes/${id}`);
    return response.data;
  },
};

export default clientQuizService;
