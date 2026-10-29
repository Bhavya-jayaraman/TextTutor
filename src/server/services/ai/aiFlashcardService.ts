/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { flashcardService, DBFlashcard } from '../flashcardService.js';
import { notesService } from '../notesService.js';

export interface GeneratedCard {
  question: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

class AIFlashcardService {
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
   * Uses Gemini AI to analyze note title and content, generating 4-8 flashcards.
   */
  async generateFlashcardsForNote(
    userId: number,
    payload: {
      noteId?: number;
      title?: string;
      content?: string;
      category?: string;
    }
  ): Promise<{ success: boolean; message?: string; flashcards: DBFlashcard[] }> {
    let title = payload.title || '';
    let content = payload.content || '';
    let category = payload.category || 'General';
    let noteId = payload.noteId;

    // If noteId provided, fetch note details from database
    if (noteId) {
      const note = notesService.getNoteById(noteId, userId);
      if (note) {
        title = note.title;
        content = note.content;
        category = note.category;
      }
    }

    if (!content && !title) {
      return { success: false, message: 'Note title or content is required to generate flashcards.', flashcards: [] };
    }

    const ai = this.getClient();
    let rawCards: GeneratedCard[] = [];

    if (ai) {
      try {
        const prompt = `You are TextTutor AI, an expert study flashcard generator.
Analyze the following study note content and generate between 4 and 8 high-quality study flashcards for revision.

NOTE TITLE: "${title}"
CATEGORY: "${category}"
NOTE CONTENT:
${content}

REQUIREMENTS:
1. Extract core concepts, definitions, formulas, and key facts.
2. Format each flashcard with a clear question and a concise answer.
3. Assign a difficulty level to each card: "Easy", "Medium", or "Hard".
4. Output strict, valid JSON matching this structure (no extra markdown outside the code fence):
[
  {
    "question": "What is ...?",
    "answer": "...",
    "difficulty": "Easy"
  }
]`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        if (response.text) {
          const text = response.text.trim();
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
              rawCards = parsed.map((item: any) => ({
                question: String(item.question || 'Key Concept Question'),
                answer: String(item.answer || 'Key Concept Answer'),
                difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty)
                  ? item.difficulty
                  : 'Medium',
              }));
            }
          }
        }
      } catch (err) {
        console.error('Gemini flashcards generation error:', err);
      }
    }

    // Fallback if AI fails or client missing
    if (rawCards.length === 0) {
      rawCards = [
        {
          question: `What is the core principle of "${title || 'this topic'}"?`,
          answer: content ? content.slice(0, 180) + '...' : 'Review the note body for detailed facts.',
          difficulty: 'Easy',
        },
        {
          question: `How does "${title || 'this note'}" relate to ${category}?`,
          answer: `It establishes foundational terminology and practical axioms in ${category}.`,
          difficulty: 'Medium',
        },
        {
          question: `What is a key exam takeaway from "${title || 'this note'}"?`,
          answer: 'Focus on mastering core terminology, formulas, and interconnected concepts.',
          difficulty: 'Hard',
        },
      ];
    }

    // Save generated flashcards to database
    const savedCards = flashcardService.bulkCreate(userId, noteId, category, rawCards);

    return {
      success: true,
      flashcards: savedCards,
    };
  }
}

export const aiFlashcardService = new AIFlashcardService();
