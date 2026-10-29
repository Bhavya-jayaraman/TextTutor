/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DashboardView =
  | 'dashboard'
  | 'my-notes'
  | 'ai-assistant'
  | 'flashcards'
  | 'quiz'
  | 'analytics'
  | 'study-planner'
  | 'activity'
  | 'profile'
  | 'settings';

export type ThemeMode = 'dark' | 'light';

export interface NoteItem {
  id: string;
  title: string;
  category: string;
  date: string;
  updatedAt: string;
  content: string;
  insights: string[];
  retentionMetric?: string;
  tags?: string[];
}

export interface ActivityItem {
  id: string;
  type:
    | 'note_created'
    | 'note_updated'
    | 'summary_generated'
    | 'flashcards_generated'
    | 'flashcards_created'
    | 'quiz_completed'
    | 'ai_chat_used';
  title: string;
  description: string;
  timestamp: string;
  iconType: 'note' | 'sparkles' | 'cards' | 'trophy' | 'summary' | 'quiz';
}

export interface DashboardStats {
  totalNotes: number;
  aiSummariesGenerated: number;
  flashcardsCreated: number;
  quizzesTaken: number;
  studyStreakDays: number;
  aiChatsCount?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}
