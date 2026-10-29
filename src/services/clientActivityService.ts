/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export interface ActivityLogItem {
  id: number;
  user_id: number;
  action: 'note_created' | 'note_updated' | 'summary_generated' | 'flashcards_generated' | 'quiz_completed' | 'ai_chat_used';
  description: string;
  created_at: string;
}

export const clientActivityService = {
  async getActivity(): Promise<{ success: boolean; activity: ActivityLogItem[] }> {
    const response = await API.get<{ success: boolean; activity: ActivityLogItem[] }>('/activity');
    return response.data;
  },
};
