/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  conversationId: number;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  sources?: Array<{ id: number; title: string; category: string }>;
}

export interface ConversationsListResponse {
  success: boolean;
  message?: string;
  conversations: Conversation[];
}

export interface ConversationDetailResponse {
  success: boolean;
  message?: string;
  conversation: Conversation;
  messages: ChatMessage[];
}

export const clientConversationService = {
  async sendMessage(message: string, conversationId?: number): Promise<ChatResponse> {
    const response = await API.post<ChatResponse>('/ai/chat', {
      message,
      conversationId,
    });
    return response.data;
  },

  async getAllConversations(): Promise<ConversationsListResponse> {
    const response = await API.get<ConversationsListResponse>('/conversations');
    return response.data;
  },

  async getConversation(id: number): Promise<ConversationDetailResponse> {
    const response = await API.get<ConversationDetailResponse>(`/conversations/${id}`);
    return response.data;
  },

  async createConversation(title?: string): Promise<{ success: boolean; conversation: Conversation }> {
    const response = await API.post('/conversations', { title });
    return response.data;
  },

  async deleteConversation(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await API.delete(`/conversations/${id}`);
    return response.data;
  },
};
