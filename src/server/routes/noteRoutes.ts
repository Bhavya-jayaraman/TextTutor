/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { notesService } from '../services/notesService.js';
import { activityService } from '../services/activityService.js';

const router = Router();

// Protect all note routes with JWT auth
router.use(authenticateToken);

/**
 * GET /api/notes
 * Retrieve all notes for the authenticated user
 */
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const notes = notesService.getNotesByUserId(userId);
    res.status(200).json({ success: true, notes });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notes.' });
  }
});

/**
 * GET /api/notes/:id
 * Retrieve a specific note by ID
 */
router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const noteId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID provided.' });
      return;
    }

    const note = notesService.getNoteById(noteId, userId);
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found or access denied.' });
      return;
    }

    res.status(200).json({ success: true, note });
  } catch (error: any) {
    console.error('Error fetching note by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve note.' });
  }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    const { title, content, category, tags, is_pinned } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, message: 'Note title is required.' });
      return;
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ success: false, message: 'Note content is required.' });
      return;
    }

    const newNote = notesService.createNote(userId, {
      title,
      content,
      category: typeof category === 'string' ? category : 'General',
      tags: Array.isArray(tags) ? tags : [],
      is_pinned: Boolean(is_pinned),
    });

    activityService.logActivity(userId, 'note_created', `Created study note "${newNote.title}"`);

    res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      note: newNote,
    });
  } catch (error: any) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, message: 'Failed to create note.' });
  }
});

/**
 * PUT /api/notes/:id
 * Update an existing note
 */
router.put('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const noteId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID provided.' });
      return;
    }

    const { title, content, category, tags, is_pinned } = req.body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      res.status(400).json({ success: false, message: 'Title cannot be empty.' });
      return;
    }

    if (content !== undefined && (typeof content !== 'string' || !content.trim())) {
      res.status(400).json({ success: false, message: 'Content cannot be empty.' });
      return;
    }

    const updatedNote = notesService.updateNote(noteId, userId, {
      title,
      content,
      category,
      tags: Array.isArray(tags) ? tags : undefined,
      is_pinned: is_pinned !== undefined ? Boolean(is_pinned) : undefined,
    });

    if (!updatedNote) {
      res.status(404).json({ success: false, message: 'Note not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      note: updatedNote,
    });
  } catch (error: any) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Failed to update note.' });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note by ID
 */
router.delete('/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    const noteId = parseInt(req.params.id, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized access.' });
      return;
    }

    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID provided.' });
      return;
    }

    const success = notesService.deleteNote(noteId, userId);
    if (!success) {
      res.status(404).json({ success: false, message: 'Note not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note.' });
  }
});

export default router;
