/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const conversationsFilePath = path.join(dataDir, 'conversations.json');
const messagesFilePath = path.join(dataDir, 'messages.json');

export interface DBConversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DBMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

function loadConversations(): DBConversation[] {
  try {
    if (fs.existsSync(conversationsFilePath)) {
      const raw = fs.readFileSync(conversationsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading conversations.json:', err);
  }
  return [];
}

function saveConversations(conversations: DBConversation[]): void {
  try {
    fs.writeFileSync(conversationsFilePath, JSON.stringify(conversations, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing conversations.json:', err);
  }
}

function loadMessages(): DBMessage[] {
  try {
    if (fs.existsSync(messagesFilePath)) {
      const raw = fs.readFileSync(messagesFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading messages.json:', err);
  }
  return [];
}

function saveMessages(messages: DBMessage[]): void {
  try {
    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing messages.json:', err);
  }
}

export const conversationService = {
  getUserConversations(userId: number): DBConversation[] {
    const conversations = loadConversations();
    return conversations
      .filter((c) => c.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  getConversationById(conversationId: number, userId: number): DBConversation | null {
    const conversations = loadConversations();
    const found = conversations.find((c) => c.id === conversationId && c.user_id === userId);
    return found || null;
  },

  createConversation(userId: number, initialTitle?: string): DBConversation {
    const conversations = loadConversations();
    const maxId = conversations.length > 0 ? Math.max(...conversations.map((c) => c.id)) : 0;
    const now = new Date().toISOString();

    const newConversation: DBConversation = {
      id: maxId + 1,
      user_id: userId,
      title: initialTitle || 'New Conversation',
      created_at: now,
      updated_at: now,
    };

    conversations.push(newConversation);
    saveConversations(conversations);
    return newConversation;
  },

  updateConversationTitle(conversationId: number, userId: number, newTitle: string): DBConversation | null {
    const conversations = loadConversations();
    const idx = conversations.findIndex((c) => c.id === conversationId && c.user_id === userId);
    if (idx === -1) return null;

    conversations[idx].title = newTitle;
    conversations[idx].updated_at = new Date().toISOString();
    saveConversations(conversations);
    return conversations[idx];
  },

  deleteConversation(conversationId: number, userId: number): boolean {
    let conversations = loadConversations();
    const existing = conversations.find((c) => c.id === conversationId && c.user_id === userId);
    if (!existing) return false;

    conversations = conversations.filter((c) => c.id !== conversationId);
    saveConversations(conversations);

    // Also delete associated messages
    let messages = loadMessages();
    messages = messages.filter((m) => m.conversation_id !== conversationId);
    saveMessages(messages);

    return true;
  },

  getMessagesByConversation(conversationId: number, userId: number): DBMessage[] {
    const conversation = this.getConversationById(conversationId, userId);
    if (!conversation) return [];

    const messages = loadMessages();
    return messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addMessage(conversationId: number, role: 'user' | 'assistant', content: string): DBMessage {
    const messages = loadMessages();
    const maxId = messages.length > 0 ? Math.max(...messages.map((m) => m.id)) : 0;
    const now = new Date().toISOString();

    const newMessage: DBMessage = {
      id: maxId + 1,
      conversation_id: conversationId,
      role,
      content,
      created_at: now,
    };

    messages.push(newMessage);
    saveMessages(messages);

    // Touch conversation updated_at
    const conversations = loadConversations();
    const cIdx = conversations.findIndex((c) => c.id === conversationId);
    if (cIdx !== -1) {
      conversations[cIdx].updated_at = now;
      if (role === 'user' && conversations[cIdx].title === 'New Conversation') {
        const snippet = content.trim().slice(0, 30);
        conversations[cIdx].title = snippet ? `${snippet}...` : 'Study Chat';
      }
      saveConversations(conversations);
    }

    return newMessage;
  },

  getStats(userId: number): { totalChats: number; recentConversations: DBConversation[] } {
    const conversations = this.getUserConversations(userId);
    return {
      totalChats: conversations.length,
      recentConversations: conversations.slice(0, 5),
    };
  },
};
