/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { flashcardService } from '../services/flashcardService.js';
import { aiFlashcardService } from '../services/ai/aiFlashcardService.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/flashcards
 * List user flashcards with optional filter parameters
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { noteId, category, difficulty, mastered, search } = req.query;

    const cards = flashcardService.getUserFlashcards(userId, {
      noteId: noteId ? parseInt(noteId as string, 10) : undefined,
      category: category as string,
      difficulty: difficulty as string,
      mastered: mastered !== undefined ? mastered === 'true' : undefined,
      search: search as string,
    });

    res.status(200).json({
      success: true,
      flashcards: cards,
    });
  } catch (error: any) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch flashcards.' });
  }
});

/**
 * GET /api/flashcards/stats
 * Stats for dashboard
 */
router.get('/stats', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const stats = flashcardService.getFlashcardStats(userId);
    res.status(200).json({
      success: true,
      ...stats,
    });
  } catch (error: any) {
    console.error('Error fetching flashcard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch flashcard stats.' });
  }
});

/**
 * GET /api/flashcards/:id
 * Get single flashcard
 */
router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const cardId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(cardId)) {
      res.status(400).json({ success: false, message: 'Invalid flashcard ID.' });
      return;
    }

    const card = flashcardService.getFlashcardById(cardId, userId);
    if (!card) {
      res.status(404).json({ success: false, message: 'Flashcard not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      flashcard: card,
    });
  } catch (error: any) {
    console.error('Error fetching flashcard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch flashcard.' });
  }
});

/**
 * POST /api/ai/flashcards (or POST /api/flashcards/generate)
 * Generate flashcards using AI from a note
 */
router.post('/generate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
 * PUT /api/flashcards/:id
 * Update flashcard (mastered status, difficulty, text)
 */
router.put('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const cardId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(cardId)) {
      res.status(400).json({ success: false, message: 'Invalid flashcard ID.' });
      return;
    }

    const { mastered, difficulty, question, answer } = req.body;

    const updated = flashcardService.updateFlashcard(cardId, userId, {
      mastered: typeof mastered === 'boolean' ? mastered : undefined,
      difficulty,
      question,
      answer,
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Flashcard not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      flashcard: updated,
    });
  } catch (error: any) {
    console.error('Error updating flashcard:', error);
    res.status(500).json({ success: false, message: 'Failed to update flashcard.' });
  }
});

/**
 * DELETE /api/flashcards/:id
 * Delete flashcard
 */
router.delete('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const cardId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(cardId)) {
      res.status(400).json({ success: false, message: 'Invalid flashcard ID.' });
      return;
    }

    const success = flashcardService.deleteFlashcard(cardId, userId);
    if (!success) {
      res.status(404).json({ success: false, message: 'Flashcard not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Flashcard deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting flashcard:', error);
    res.status(500).json({ success: false, message: 'Failed to delete flashcard.' });
  }
});

export default router;
