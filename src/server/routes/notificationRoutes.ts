/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { notificationService } from '../services/notificationService.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const notifications = notificationService.getUserNotifications(userId);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

/**
 * POST /api/notifications
 * Create notification
 */
router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { title, message, type } = req.body;
    if (!title || !message) {
      res.status(400).json({ success: false, message: 'Title and message are required.' });
      return;
    }

    const newNotif = notificationService.createNotification(userId, {
      title,
      message,
      type: type || 'system',
    });

    res.status(201).json({ success: true, notification: newNotif });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification.' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    notificationService.markAllAsRead(userId);
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const notifId = parseInt(req.params.id, 10);
    const updated = notificationService.markAsRead(notifId, userId);

    if (!updated) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

export default router;
