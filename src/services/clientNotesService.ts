/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';
import {
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  NotesApiResponse,
} from '../types/notes.js';

export const clientNotesService = {
  async getAllNotes(): Promise<NotesApiResponse> {
    const response = await API.get<NotesApiResponse>('/notes');
    return response.data;
  },

  async getNoteById(id: number): Promise<NotesApiResponse> {
    const response = await API.get<NotesApiResponse>(`/notes/${id}`);
    return response.data;
  },

  async createNote(payload: CreateNotePayload): Promise<NotesApiResponse> {
    const response = await API.post<NotesApiResponse>('/notes', payload);
    return response.data;
  },

  async updateNote(id: number, payload: UpdateNotePayload): Promise<NotesApiResponse> {
    const response = await API.put<NotesApiResponse>(`/notes/${id}`, payload);
    return response.data;
  },

  async deleteNote(id: number): Promise<NotesApiResponse> {
    const response = await API.delete<NotesApiResponse>(`/notes/${id}`);
    return response.data;
  },

  async togglePin(id: number, currentIsPinned: boolean): Promise<NotesApiResponse> {
    const response = await API.put<NotesApiResponse>(`/notes/${id}`, {
      is_pinned: !currentIsPinned,
    });
    return response.data;
  },
};
