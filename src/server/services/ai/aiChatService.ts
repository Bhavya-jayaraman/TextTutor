/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { notesService, FullNote } from '../notesService.js';
import { conversationService, DBMessage } from '../conversationService.js';

export interface ChatAnswerResult {
  conversationId: number;
  userMessage: DBMessage;
  assistantMessage: DBMessage;
  sources: Array<{ id: number; title: string; category: string }>;
}

class AIChatService {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Retrieves user notes relevant to the query based on keyword overlap & title match.
   */
  retrieveRelevantNotes(userId: number, query: string): FullNote[] {
    const userNotes = notesService.getNotesByUserId(userId);
    if (userNotes.length === 0) return [];

    const queryTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTerms.length === 0) return userNotes.slice(0, 3);

    // Score notes
    const scored = userNotes.map((note) => {
      let score = 0;
      const titleLower = note.title.toLowerCase();
      const contentLower = note.content.toLowerCase();
      const categoryLower = note.category.toLowerCase();
      const tagsLower = note.tags ? note.tags.join(' ').toLowerCase() : '';

      queryTerms.forEach((term) => {
        if (titleLower.includes(term)) score += 5;
        if (categoryLower.includes(term)) score += 3;
        if (tagsLower.includes(term)) score += 3;
        const occurrences = (contentLower.match(new RegExp(term, 'g')) || []).length;
        score += Math.min(occurrences, 10);
      });

      return { note, score };
    });

    const relevant = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.note);

    // Fall back to most recent 3 notes if no explicit term match found
    return relevant.length > 0 ? relevant.slice(0, 5) : userNotes.slice(0, 3);
  }

  /**
   * Builds context-aware prompt using matched notes and recent chat history.
   */
  buildPrompt(query: string, relevantNotes: FullNote[], chatHistory: DBMessage[]): string {
    let contextBlock = '';

    if (relevantNotes.length > 0) {
      contextBlock = relevantNotes
        .map(
          (n, idx) =>
            `--- NOTE #${idx + 1} ---
Title: ${n.title}
Category: ${n.category}
Tags: ${n.tags ? n.tags.join(', ') : 'None'}
Content:
${n.content}
`
        )
        .join('\n');
    } else {
      contextBlock = 'No specific notes found in user repository.';
    }

    let historyBlock = '';
    if (chatHistory.length > 0) {
      historyBlock = chatHistory
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');
    }

    return `You are TextTutor AI, an intelligent study assistant. Your primary job is to answer questions using the user's saved study notes as context whenever possible.

USER NOTES CONTEXT:
${contextBlock}

${historyBlock ? `RECENT CHAT HISTORY:\n${historyBlock}\n` : ''}

USER QUESTION: "${query}"

INSTRUCTIONS:
1. Prioritize details found in the USER NOTES CONTEXT above.
2. If the user's query relates to concepts present in their notes, answer accurately based on those notes and cite the note title.
3. If the answer is NOT present or found in their notes, explicitly state: "Note: This topic was not directly found in your saved notes, but here is a general explanation: ..." and then provide a clear, student-friendly explanation.
4. Format your answer nicely using markdown (headers, bold text, bullet points, and code blocks if relevant).
5. Maintain an encouraging, academic tone suited for study and exam prep.`;
  }

  /**
   * Primary entrypoint: Answer a user question within a conversation
   */
  async answerQuestion(
    userId: number,
    conversationId: number,
    userQuery: string
  ): Promise<ChatAnswerResult> {
    // 1. Get or verify conversation
    let conv = conversationService.getConversationById(conversationId, userId);
    if (!conv) {
      conv = conversationService.createConversation(userId);
      conversationId = conv.id;
    }

    // 2. Save user message
    const userMsg = conversationService.addMessage(conversationId, 'user', userQuery);

    // 3. Fetch chat history
    const existingHistory = conversationService.getMessagesByConversation(conversationId, userId);

    // 4. Retrieve relevant user notes
    const relevantNotes = this.retrieveRelevantNotes(userId, userQuery);

    // 5. Construct AI Prompt
    const prompt = this.buildPrompt(userQuery, relevantNotes, existingHistory.slice(0, -1));

    let assistantText = '';
    const ai = this.getClient();

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        if (response.text) {
          assistantText = response.text.trim();
        }
      } catch (err) {
        console.error('Gemini chat generation error:', err);
      }
    }

    // Fallback response if AI client unavailable or error
    if (!assistantText) {
      if (relevantNotes.length > 0) {
        const matchedTitles = relevantNotes.map((n) => `"${n.title}"`).join(', ');
        assistantText = `I analyzed your saved notes including ${matchedTitles}.\n\nBased on your notes:\n• **Key Topic**: ${relevantNotes[0].title}\n• **Summary**: ${relevantNotes[0].content.slice(0, 200)}...\n\nKeep reviewing your notes regularly for optimal retention!`;
      } else {
        assistantText = `Note: This topic was not directly found in your saved notes.\n\nHere is a general breakdown of "${userQuery}":\n\n1. **Core Concept**: Focus on the fundamental definitions and principles.\n2. **Study Tip**: Consider adding a note on this topic to TextTutor so I can reference it in future study chats!`;
      }
    }

    // 6. Save assistant message
    const assistantMsg = conversationService.addMessage(conversationId, 'assistant', assistantText);

    const sources = relevantNotes.map((n) => ({
      id: n.id,
      title: n.title,
      category: n.category,
    }));

    return {
      conversationId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      sources,
    };
  }
}

export const aiChatService = new AIChatService();
