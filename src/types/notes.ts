/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  insights: string[];
}

export interface CreateNotePayload {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface NotesApiResponse {
  success: boolean;
  message?: string;
  notes?: Note[];
  note?: Note;
}
