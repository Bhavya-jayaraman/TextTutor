/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { quizService } from '../services/quizService.js';
import { aiQuizService } from '../services/ai/aiQuizService.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/quizzes
 * Get all quizzes created for the user
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { category } = req.query;
    const quizzes = quizService.getUserQuizzes(userId, category as string);

    res.status(200).json({
      success: true,
      quizzes,
    });
  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes.' });
  }
});

/**
 * GET /api/quizzes/history
 * Get quiz attempt history for the user
 */
router.get('/history', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const history = quizService.getQuizHistory(userId);
    res.status(200).json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz history.' });
  }
});

/**
 * GET /api/quizzes/stats
 * Get user quiz performance statistics
 */
router.get('/stats', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const stats = quizService.getQuizStats(userId);
    res.status(200).json({
      success: true,
      ...stats,
    });
  } catch (error: any) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz stats.' });
  }
});

/**
 * GET /api/quizzes/:id
 * Get single quiz with questions
 */
router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const quizId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(quizId)) {
      res.status(400).json({ success: false, message: 'Invalid quiz ID.' });
      return;
    }

    const quiz = quizService.getQuizById(quizId, userId);
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz.' });
  }
});

/**
 * POST /api/quizzes/generate (or POST /api/ai/quiz)
 * Generate a quiz using Gemini AI
 */
router.post('/generate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
 * POST /api/quizzes/:id/submit
 * Submit answers for a quiz attempt
 */
router.post('/:id/submit', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const quizId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(quizId)) {
      res.status(400).json({ success: false, message: 'Invalid quiz ID.' });
      return;
    }

    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ success: false, message: 'Answers payload is required.' });
      return;
    }

    const attempt = quizService.submitQuiz(quizId, userId, answers);
    if (!attempt) {
      res.status(404).json({ success: false, message: 'Quiz not found or submission failed.' });
      return;
    }

    res.status(200).json({
      success: true,
      attempt,
    });
  } catch (error: any) {
    console.error('Error submitting quiz attempt:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz attempt.' });
  }
});

/**
 * DELETE /api/quizzes/:id
 * Delete quiz
 */
router.delete('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const quizId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(quizId)) {
      res.status(400).json({ success: false, message: 'Invalid quiz ID.' });
      return;
    }

    const deleted = quizService.deleteQuiz(quizId, userId);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Quiz not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to delete quiz.' });
  }
});

export default router;
