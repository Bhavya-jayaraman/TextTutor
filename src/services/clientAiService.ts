/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';
import {
  SummarizeResponse,
  SummariesListResponse,
  AIStatsResponse,
  KeywordExplainResponse,
} from '../types/ai.js';

export const clientAiService = {
  async summarizeNote(payload: {
    noteId?: number;
    noteContent?: string;
    title?: string;
    category?: string;
  }): Promise<SummarizeResponse> {
    const response = await API.post<SummarizeResponse>('/ai/summarize', payload);
    return response.data;
  },

  async getSummariesForNote(noteId: number): Promise<SummariesListResponse> {
    const response = await API.get<SummariesListResponse>(`/ai/summaries/note/${noteId}`);
    return response.data;
  },

  async getAiStats(): Promise<AIStatsResponse> {
    const response = await API.get<AIStatsResponse>('/ai/stats');
    return response.data;
  },

  async explainKeyword(keyword: string, contextTitle?: string): Promise<KeywordExplainResponse> {
    const response = await API.post<KeywordExplainResponse>('/ai/keyword-explain', {
      keyword,
      contextTitle,
    });
    return response.data;
  },
};
