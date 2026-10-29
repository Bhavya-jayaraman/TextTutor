/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'study_session' | 'missed_goal' | 'daily_reminder' | 'quiz_reminder' | 'flashcard_reminder' | 'system';
  is_read: boolean;
  created_at: string;
}

export const clientNotificationService = {
  async getNotifications(): Promise<{ success: boolean; notifications: NotificationItem[] }> {
    const response = await API.get<{ success: boolean; notifications: NotificationItem[] }>('/notifications');
    return response.data;
  },

  async markAsRead(id: number): Promise<{ success: boolean; notification?: NotificationItem }> {
    const response = await API.put<{ success: boolean; notification?: NotificationItem }>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ success: boolean; message?: string }> {
    const response = await API.put<{ success: boolean; message?: string }>('/notifications/read-all');
    return response.data;
  },

  async createNotification(payload: {
    title: string;
    message: string;
    type?: NotificationItem['type'];
  }): Promise<{ success: boolean; notification?: NotificationItem }> {
    const response = await API.post<{ success: boolean; notification?: NotificationItem }>('/notifications', payload);
    return response.data;
  },
};
