/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientConversationService = {
  /**
   * Send a study message to the AI assistant.
   * If conversationId is null/undefined, a new conversation is started.
   */
  async sendMessage(message, conversationId, options = {}) {
    const payload = {
      message: message.trim(),
      ...(conversationId ? { conversationId } : {}),
      ...(options.noteId ? { noteId: options.noteId } : {}),
      ...(options.documentId ? { documentId: options.documentId } : {}),
      ...(options.selectedNoteIds ? { selectedNoteIds: options.selectedNoteIds } : {}),
    };
    const response = await API.post('/ai/chat', payload);
    return response.data;
  },

  /**
   * Get all conversations for the authenticated user.
   */
  async getAllConversations() {
    const response = await API.get('/conversations');
    return response.data;
  },

  /**
   * Get full details and message history of a specific conversation.
   */
  async getConversation(id) {
    const response = await API.get(`/conversations/${id}`);
    return response.data;
  },

  /**
   * Create a new conversation with an optional custom title.
   */
  async createConversation(title = 'New Study Chat') {
    const response = await API.post('/conversations', { title });
    return response.data;
  },

  /**
   * Rename an existing conversation.
   */
  async updateConversationTitle(id, title) {
    const response = await API.patch(`/conversations/${id}`, { title });
    return response.data;
  },

  /**
   * Delete a conversation and all its messages.
   */
  async deleteConversation(id) {
    const response = await API.delete(`/conversations/${id}`);
    return response.data;
  },
};
