/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { analyticsService } from '../services/analyticsService.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/analytics
 * Get aggregated analytics for authenticated user
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const analytics = analyticsService.getAnalytics(userId);
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics data.' });
  }
});

export default router;
