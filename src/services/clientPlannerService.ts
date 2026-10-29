/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export interface StudyTask {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export interface StudyPlanItem {
  id: number;
  user_id: number;
  title: string;
  category: string;
  start_date: string;
  end_date: string;
  daily_goal: string;
  daily_duration_minutes: number;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  tasks: StudyTask[];
  created_at: string;
}

export const clientPlannerService = {
  async getPlans(): Promise<{ success: boolean; plans: StudyPlanItem[] }> {
    const response = await API.get<{ success: boolean; plans: StudyPlanItem[] }>('/study-plans');
    return response.data;
  },

  async createPlan(payload: {
    title: string;
    category?: string;
    start_date?: string;
    end_date?: string;
    daily_goal?: string;
    daily_duration_minutes?: number;
    priority?: 'High' | 'Medium' | 'Low';
    tasks?: StudyTask[];
  }): Promise<{ success: boolean; plan?: StudyPlanItem; message?: string }> {
    const response = await API.post<{ success: boolean; plan?: StudyPlanItem; message?: string }>('/study-plans', payload);
    return response.data;
  },

  async updatePlan(
    id: number,
    payload: {
      title?: string;
      category?: string;
      start_date?: string;
      end_date?: string;
      daily_goal?: string;
      daily_duration_minutes?: number;
      priority?: 'High' | 'Medium' | 'Low';
      completed?: boolean;
      tasks?: StudyTask[];
    }
  ): Promise<{ success: boolean; plan?: StudyPlanItem; message?: string }> {
    const response = await API.put<{ success: boolean; plan?: StudyPlanItem; message?: string }>(`/study-plans/${id}`, payload);
    return response.data;
  },

  async deletePlan(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await API.delete<{ success: boolean; message?: string }>(`/study-plans/${id}`);
    return response.data;
  },
};
