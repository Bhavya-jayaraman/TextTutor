/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { plannerService } from '../services/plannerService.js';
import { activityService } from '../services/activityService.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/study-plans
 * Get all study plans for authenticated user
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const plans = plannerService.getUserPlans(userId);
    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error('Error fetching study plans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch study plans.' });
  }
});

/**
 * POST /api/study-plans
 * Create new study plan
 */
router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { title, category, start_date, end_date, daily_goal, daily_duration_minutes, priority, tasks } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Title is required.' });
      return;
    }

    const newPlan = plannerService.createPlan(userId, {
      title,
      category,
      start_date,
      end_date,
      daily_goal,
      daily_duration_minutes,
      priority,
      tasks,
    });

    activityService.logActivity(userId, 'note_updated', `Created study plan "${newPlan.title}"`);

    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error('Error creating study plan:', error);
    res.status(500).json({ success: false, message: 'Failed to create study plan.' });
  }
});

/**
 * PUT /api/study-plans/:id
 * Update existing study plan
 */
router.put('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const planId = parseInt(req.params.id, 10);
    const updatedPlan = plannerService.updatePlan(planId, userId, req.body);

    if (!updatedPlan) {
      res.status(404).json({ success: false, message: 'Study plan not found.' });
      return;
    }

    res.status(200).json({ success: true, plan: updatedPlan });
  } catch (error) {
    console.error('Error updating study plan:', error);
    res.status(500).json({ success: false, message: 'Failed to update study plan.' });
  }
});

/**
 * DELETE /api/study-plans/:id
 * Delete study plan
 */
router.delete('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const planId = parseInt(req.params.id, 10);
    const success = plannerService.deletePlan(planId, userId);

    if (!success) {
      res.status(404).json({ success: false, message: 'Study plan not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Study plan deleted successfully.' });
  } catch (error) {
    console.error('Error deleting study plan:', error);
    res.status(500).json({ success: false, message: 'Failed to delete study plan.' });
  }
});

export default router;
