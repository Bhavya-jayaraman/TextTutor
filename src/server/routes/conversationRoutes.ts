/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { conversationService } from '../services/conversationService.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/conversations
 * Fetch all chat conversations for the current user
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const conversations = conversationService.getUserConversations(userId);
    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations.' });
  }
});

/**
 * GET /api/conversations/:id
 * Get single conversation with all its messages
 */
router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const conversationId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(conversationId)) {
      res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
      return;
    }

    const conversation = conversationService.getConversationById(conversationId, userId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found or access denied.' });
      return;
    }

    const messages = conversationService.getMessagesByConversation(conversationId, userId);

    res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversation details.' });
  }
});

/**
 * POST /api/conversations
 * Create a new conversation
 */
router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { title } = req.body;
    const conversation = conversationService.createConversation(userId, title);

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation.' });
  }
});

/**
 * DELETE /api/conversations/:id
 * Delete conversation and its messages
 */
router.delete('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const conversationId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(conversationId)) {
      res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
      return;
    }

    const success = conversationService.deleteConversation(conversationId, userId);
    if (!success) {
      res.status(404).json({ success: false, message: 'Conversation not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete conversation.' });
  }
});

export default router;
