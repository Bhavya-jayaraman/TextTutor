/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { activityService } from '../services/activityService.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/activity
 * Get activity timeline logs for authenticated user
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const activity = activityService.getUserActivity(userId);
    res.status(200).json({ success: true, activity });
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs.' });
  }
});

export default router;
