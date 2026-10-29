/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export interface AnalyticsOverview {
  totalNotes: number;
  aiSummariesGenerated: number;
  flashcardsCreated: number;
  quizzesCompleted: number;
  aiChatSessions: number;
  estimatedStudyHours: number;
  studyStreakDays: number;
  retentionRate: number;
  weeklyProgress: Array<{
    week: string;
    hours: number;
    retention: number;
    notesCount: number;
  }>;
  notesPerWeek: Array<{
    day: string;
    notes: number;
    quizzes: number;
  }>;
  topicsDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  studyGoals: Array<{
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    percentage: number;
  }>;
}

export const clientAnalyticsService = {
  async getAnalytics(): Promise<{ success: boolean; analytics?: AnalyticsOverview }> {
    const response = await API.get<{ success: boolean; analytics?: AnalyticsOverview }>('/analytics');
    return response.data;
  },
};
