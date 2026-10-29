/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export interface QuizQuestionItem {
  id: number;
  quiz_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export interface QuizItem {
  id: number;
  user_id: number;
  note_id?: number;
  title: string;
  category: string;
  questions_count?: number;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestionItem[];
}

export interface QuizAttemptAnswerItem {
  question_id: number;
  selected_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  question_text: string;
  explanation: string;
}

export interface QuizAttemptItem {
  id: number;
  quiz_id: number;
  quiz_title?: string;
  category?: string;
  user_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  answers: QuizAttemptAnswerItem[];
  completed_at: string;
}

export interface QuizStatsResponse {
  success: boolean;
  totalQuizzesGenerated: number;
  totalAttempts: number;
  averageScore: number;
  recentAttempts: QuizAttemptItem[];
}

export const clientQuizService = {
  async generateQuiz(payload: {
    noteId?: number;
    title?: string;
    content?: string;
    category?: string;
  }): Promise<{ success: boolean; message?: string; quiz?: QuizItem }> {
    const response = await API.post<{ success: boolean; message?: string; quiz?: QuizItem }>('/quizzes/generate', payload);
    return response.data;
  },

  async getQuizzes(category?: string): Promise<{ success: boolean; quizzes: QuizItem[] }> {
    const params = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    const response = await API.get<{ success: boolean; quizzes: QuizItem[] }>(`/quizzes${params}`);
    return response.data;
  },

  async getQuizById(id: number): Promise<{ success: boolean; quiz?: QuizItem; message?: string }> {
    const response = await API.get<{ success: boolean; quiz?: QuizItem; message?: string }>(`/quizzes/${id}`);
    return response.data;
  },

  async submitQuiz(
    id: number,
    answers: Record<number, 'A' | 'B' | 'C' | 'D'>
  ): Promise<{ success: boolean; attempt?: QuizAttemptItem; message?: string }> {
    const response = await API.post<{ success: boolean; attempt?: QuizAttemptItem; message?: string }>(`/quizzes/${id}/submit`, { answers });
    return response.data;
  },

  async getQuizHistory(): Promise<{ success: boolean; history: QuizAttemptItem[] }> {
    const response = await API.get<{ success: boolean; history: QuizAttemptItem[] }>('/quizzes/history');
    return response.data;
  },

  async getStats(): Promise<QuizStatsResponse> {
    const response = await API.get<QuizStatsResponse>('/quizzes/stats');
    return response.data;
  },

  async deleteQuiz(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await API.delete<{ success: boolean; message?: string }>(`/quizzes/${id}`);
    return response.data;
  },
};
