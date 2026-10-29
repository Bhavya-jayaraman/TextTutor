/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AISummary {
  id: number;
  note_id: number;
  shortSummary: string;
  detailedSummary: string;
  bulletPoints: string[];
  keywords: string[];
  created_at: string;
}

export interface SummarizeResponse {
  success: boolean;
  message?: string;
  summary?: AISummary;
}

export interface SummariesListResponse {
  success: boolean;
  message?: string;
  summaries?: AISummary[];
}

export interface AIStatsResponse {
  success: boolean;
  totalSummaries: number;
  recentlySummarizedNotes: Array<{
    id: number;
    title: string;
    category: string;
    updated_at: string;
  }>;
}

export interface KeywordExplainResponse {
  success: boolean;
  message?: string;
  keyword: string;
  explanation: string;
}
