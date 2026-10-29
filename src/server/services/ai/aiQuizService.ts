/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { quizService, Quiz } from '../quizService.js';
import { notesService } from '../notesService.js';

export interface GeneratedQuizQuestion {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

class AIQuizService {
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
   * Generates a quiz from note title and content using Gemini 3.6 Flash AI
   */
  async generateQuizForNote(
    userId: number,
    payload: {
      noteId?: number;
      title?: string;
      content?: string;
      category?: string;
    }
  ): Promise<{ success: boolean; message?: string; quiz?: Quiz }> {
    let title = payload.title || '';
    let content = payload.content || '';
    let category = payload.category || 'General';
    let noteId = payload.noteId;

    if (noteId) {
      const note = notesService.getNoteById(noteId, userId);
      if (note) {
        title = note.title;
        content = note.content;
        category = note.category;
      }
    }

    if (!content && !title) {
      return { success: false, message: 'Note title or content is required to generate a quiz.' };
    }

    const ai = this.getClient();
    let rawQuestions: GeneratedQuizQuestion[] = [];

    if (ai) {
      try {
        const prompt = `You are TextTutor AI, an expert exam question creator.
Analyze the following study note content and generate between 3 and 5 high-quality multiple-choice questions (MCQs) for an interactive practice quiz.

NOTE TITLE: "${title}"
CATEGORY: "${category}"
NOTE CONTENT:
${content}

REQUIREMENTS:
1. Formulate 3 to 5 realistic, challenging, and clear questions testing active recall.
2. For each question, provide 4 options: option_a, option_b, option_c, option_d.
3. Indicate the single correct option using "A", "B", "C", or "D".
4. Provide a clear, educational 1-2 sentence explanation explaining why the correct answer is right.
5. Output strict, valid JSON matching this exact structure (no markdown outside the JSON block):
[
  {
    "question": "What is ...?",
    "option_a": "Option 1",
    "option_b": "Option 2",
    "option_c": "Option 3",
    "option_d": "Option 4",
    "correct_answer": "A",
    "explanation": "Option A is correct because..."
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
              rawQuestions = parsed.map((item: any) => ({
                question: String(item.question || 'Concept Recall Question'),
                option_a: String(item.option_a || 'Option A'),
                option_b: String(item.option_b || 'Option B'),
                option_c: String(item.option_c || 'Option C'),
                option_d: String(item.option_d || 'Option D'),
                correct_answer: ['A', 'B', 'C', 'D'].includes(String(item.correct_answer).toUpperCase())
                  ? (String(item.correct_answer).toUpperCase() as 'A' | 'B' | 'C' | 'D')
                  : 'A',
                explanation: String(item.explanation || 'Verified core principle from study note.'),
              }));
            }
          }
        }
      } catch (err) {
        console.error('Gemini quiz generation error:', err);
      }
    }

    // Fallback questions if AI fails or client missing
    if (rawQuestions.length === 0) {
      rawQuestions = [
        {
          question: `Which fundamental concept is central to "${title || 'this study topic'}"?`,
          option_a: 'Core Principles & Foundational Axioms',
          option_b: 'Random Uncorrelated Variables',
          option_c: 'Deprecated Legacy Methods',
          option_d: 'None of the above',
          correct_answer: 'A',
          explanation: `The note "${title}" emphasizes foundational principles and key structural concepts in ${category}.`,
        },
        {
          question: `What is a key takeaway from the notes on ${category}?`,
          option_a: 'Disregard primary definitions',
          option_b: 'Active recall and conceptual synthesis improve long-term retention',
          option_c: 'Formulas and terminology are irrelevant',
          option_d: 'Linear processing without verification',
          correct_answer: 'B',
          explanation: 'Synthesizing key definitions and practicing active retrieval strengthens neural retention.',
        },
        {
          question: `How should you apply the information in "${title || 'this topic'}"?`,
          option_a: 'Rote memorization without understanding',
          option_b: 'Integrate facts into practice questions and flashcard drills',
          option_c: 'Ignore practical exercises',
          option_d: 'Only review prior to final assessment',
          correct_answer: 'B',
          explanation: 'Applying study notes to interactive practice quizzes reinforces critical problem-solving skills.',
        },
      ];
    }

    // Save generated quiz to database
    const newQuiz = quizService.createQuiz(userId, {
      noteId,
      title: title ? `${title} Quiz` : `${category} Practice Quiz`,
      category,
      questions: rawQuestions,
    });

    return {
      success: true,
      quiz: newQuiz,
    };
  }
}

export const aiQuizService = new AIQuizService();
