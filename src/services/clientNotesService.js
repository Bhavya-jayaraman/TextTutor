/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientNotesService = {
  async getAllNotes(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category && params.category !== 'all') queryParams.append('category', params.category);
    if (params.tag) queryParams.append('tag', params.tag);
    if (params.isPinned !== undefined) queryParams.append('isPinned', String(params.isPinned));
    if (params.sort) queryParams.append('sort', params.sort);

    const qs = queryParams.toString();
    const url = qs ? `/notes?${qs}` : '/notes';
    const response = await API.get(url);
    return response.data;
  },

  async getNoteById(id) {
    const response = await API.get(`/notes/${id}`);
    return response.data;
  },

  async createNote(payload) {
    const response = await API.post('/notes', payload);
    return response.data;
  },

  async updateNote(id, payload) {
    const response = await API.put(`/notes/${id}`, payload);
    return response.data;
  },

  async deleteNote(id) {
    const response = await API.delete(`/notes/${id}`);
    return response.data;
  },

  async togglePin(id) {
    const response = await API.patch(`/notes/${id}/pin`);
    return response.data;
  },

  async uploadDocument(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (options.title) formData.append('title', options.title);
    if (options.category) formData.append('category', options.category);
    if (options.saveNote !== undefined) formData.append('saveNote', String(options.saveNote));

    const response = await API.post('/notes/upload', formData);
    return response.data;
  },
};

export default clientNotesService;
