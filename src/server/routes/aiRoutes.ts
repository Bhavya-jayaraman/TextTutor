/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { notesService } from '../services/notesService.js';
import { aiService } from '../services/ai/aiService.js';
import { summaryService } from '../services/summaryService.js';
import { aiChatService } from '../services/ai/aiChatService.js';
import { conversationService } from '../services/conversationService.js';
import { aiFlashcardService } from '../services/ai/aiFlashcardService.js';
import { aiQuizService } from '../services/ai/aiQuizService.js';

const router = Router();

// Protect all AI routes with JWT auth
router.use(authenticateToken);

/**
 * POST /api/ai/chat
 * Answer a user question with RAG on user's notes and store chat messages
 */
router.post('/chat', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message content is required.' });
      return;
    }

    const convId = conversationId ? parseInt(conversationId, 10) : 0;

    const result = await aiChatService.answerQuestion(userId, isNaN(convId) ? 0 : convId, message.trim());

    res.status(200).json({
      success: true,
      conversationId: result.conversationId,
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      sources: result.sources,
    });
  } catch (error: any) {
    console.error('Error in AI Chat API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response. Please try again.',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/flashcards
 * Generate AI study flashcards from note content or note ID
 */
router.post('/flashcards', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { noteId, title, content, category } = req.body;

    const result = await aiFlashcardService.generateFlashcardsForNote(userId, {
      noteId: noteId ? parseInt(noteId, 10) : undefined,
      title,
      content,
      category,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error generating AI flashcards:', error);
    res.status(500).json({ success: false, message: 'Failed to generate flashcards.' });
  }
});

/**
 * POST /api/ai/quiz
 * Generate AI study quiz from note content or note ID
 */
router.post('/quiz', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { noteId, title, content, category } = req.body;

    const result = await aiQuizService.generateQuizForNote(userId, {
      noteId: noteId ? parseInt(noteId, 10) : undefined,
      title,
      content,
      category,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error generating AI quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quiz.' });
  }
});

/**
 * POST /api/ai/summarize
 * Generates an AI summary and keyword extraction for a note or raw content.
 */
router.post('/summarize', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { noteId, noteContent, title, category } = req.body;

    let targetTitle = title || 'Untitled Note';
    let targetContent = noteContent || '';
    let targetCategory = category || 'General';
    let targetNoteId = 0;

    if (noteId) {
      const parsedNoteId = parseInt(noteId, 10);
      if (isNaN(parsedNoteId)) {
        res.status(400).json({ success: false, message: 'Invalid note ID format.' });
        return;
      }

      const existingNote = notesService.getNoteById(parsedNoteId, userId);
      if (!existingNote) {
        res.status(404).json({ success: false, message: 'Note not found or access denied.' });
        return;
      }

      targetNoteId = existingNote.id;
      targetTitle = existingNote.title;
      targetContent = existingNote.content;
      targetCategory = existingNote.category;
    } else if (!noteContent || typeof noteContent !== 'string' || !noteContent.trim()) {
      res.status(400).json({ success: false, message: 'Either noteId or noteContent must be provided.' });
      return;
    }

    // Call modular AI service
    const aiResult = await aiService.summarizeNote(targetTitle, targetContent, targetCategory);

    // Save generated summary to database / storage
    const savedSummary = summaryService.saveSummary(userId, targetNoteId, {
      shortSummary: aiResult.shortSummary,
      detailedSummary: aiResult.detailedSummary,
      bulletPoints: aiResult.bulletPoints,
      keywords: aiResult.keywords,
    });

    res.status(200).json({
      success: true,
      summary: {
        id: savedSummary.id,
        note_id: savedSummary.note_id,
        shortSummary: savedSummary.short_summary,
        detailedSummary: savedSummary.detailed_summary,
        bulletPoints: savedSummary.bullet_points,
        keywords: savedSummary.keywords,
        created_at: savedSummary.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI summary. Please try again.',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/summaries/note/:noteId
 * Retrieves all previously generated summaries for a note owned by the user.
 */
router.get('/summaries/note/:noteId', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const noteId = parseInt(req.params.noteId, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID.' });
      return;
    }

    const note = notesService.getNoteById(noteId, userId);
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found or access denied.' });
      return;
    }

    const summaries = summaryService.getSummariesByNoteId(noteId, userId);
    const mapped = summaries.map((s) => ({
      id: s.id,
      note_id: s.note_id,
      shortSummary: s.short_summary,
      detailedSummary: s.detailed_summary,
      bulletPoints: s.bullet_points,
      keywords: s.keywords,
      created_at: s.created_at,
    }));

    res.status(200).json({ success: true, summaries: mapped });
  } catch (error: any) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve summaries.' });
  }
});

/**
 * GET /api/ai/stats
 * Dashboard metrics for AI summaries
 */
router.get('/stats', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const stats = summaryService.getSummaryStats(userId);
    const allNotes = notesService.getNotesByUserId(userId);

    const recentlySummarizedNotes = stats.recentlySummarizedNoteIds
      .map((id) => allNotes.find((n) => n.id === id))
      .filter((n): n is NonNullable<typeof n> => Boolean(n));

    res.status(200).json({
      success: true,
      totalSummaries: stats.totalSummaries,
      recentlySummarizedNotes,
    });
  } catch (error: any) {
    console.error('Error fetching AI stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch AI stats.' });
  }
});

/**
 * POST /api/ai/keyword-explain
 * Explains a specific keyword in context using AI
 */
router.post('/keyword-explain', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { keyword, contextTitle } = req.body;

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      res.status(400).json({ success: false, message: 'Keyword is required.' });
      return;
    }

    const explanation = await aiService.explainKeyword(keyword.trim(), contextTitle);

    res.status(200).json({
      success: true,
      keyword: keyword.trim(),
      explanation,
    });
  } catch (error: any) {
    console.error('Error explaining keyword:', error);
    res.status(500).json({ success: false, message: 'Failed to generate keyword explanation.' });
  }
});

export default router;
