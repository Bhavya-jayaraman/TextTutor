/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const notesFilePath = path.join(dataDir, 'notes.json');
const tagsFilePath = path.join(dataDir, 'tags.json');
const noteTagsFilePath = path.join(dataDir, 'note_tags.json');

export interface DBNote {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  is_pinned: number; // 0 or 1
  created_at: string;
  updated_at: string;
  insights?: string[];
}

export interface DBTag {
  id: number;
  name: string;
}

export interface DBNoteTag {
  note_id: number;
  tag_id: number;
}

export interface FullNote {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  insights: string[];
}

function loadNotes(): DBNote[] {
  try {
    if (fs.existsSync(notesFilePath)) {
      const raw = fs.readFileSync(notesFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading notes.json:', err);
  }
  return [];
}

function saveNotes(notes: DBNote[]): void {
  try {
    fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving notes.json:', err);
  }
}

function loadTags(): DBTag[] {
  try {
    if (fs.existsSync(tagsFilePath)) {
      const raw = fs.readFileSync(tagsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading tags.json:', err);
  }
  return [];
}

function saveTags(tags: DBTag[]): void {
  try {
    fs.writeFileSync(tagsFilePath, JSON.stringify(tags, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving tags.json:', err);
  }
}

function loadNoteTags(): DBNoteTag[] {
  try {
    if (fs.existsSync(noteTagsFilePath)) {
      const raw = fs.readFileSync(noteTagsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading note_tags.json:', err);
  }
  return [];
}

function saveNoteTags(noteTags: DBNoteTag[]): void {
  try {
    fs.writeFileSync(noteTagsFilePath, JSON.stringify(noteTags, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving note_tags.json:', err);
  }
}

// Initial seed notes for new users to start with sample study data
function seedInitialNotesForUser(userId: number): DBNote[] {
  const existingNotes = loadNotes();
  const userNotes = existingNotes.filter((n) => n.user_id === userId);
  if (userNotes.length > 0) return existingNotes;

  const maxId = existingNotes.length > 0 ? Math.max(...existingNotes.map((n) => n.id)) : 0;
  const now = new Date().toISOString();

  const seedData: Array<{
    title: string;
    category: string;
    content: string;
    tags: string[];
    is_pinned: number;
    insights: string[];
  }> = [
    {
      title: 'Quantum Superposition & Entanglement',
      category: 'Physics',
      is_pinned: 1,
      content:
        'The core principle of superposition allows a qubit to represent both 0 and 1 simultaneously. Unlike classical bits, entanglement links particles regardless of distance, opening breakthrough capabilities for complex optimization algorithms.',
      tags: ['quantum', 'physics', 'computing'],
      insights: [
        'Superposition enables massive parallel computation capabilities.',
        'Entanglement allows instant quantum state correlation.',
        'Decoherence remains the primary quantum engineering hurdle.',
      ],
    },
    {
      title: 'Distributed Systems & Raft Consensus Protocol',
      category: 'Computer Science',
      is_pinned: 0,
      content:
        'Raft consensus decomposes state machine replication into leader election, log replication, and safety guarantees. Quorums ensure fault tolerance across unreliable distributed node networks.',
      tags: ['distributed', 'consensus', 'raft'],
      insights: [
        'Raft prioritizes understandability compared to Paxos.',
        'Leader election requires a strict term timestamp majority.',
        'Log compaction via snapshotting prevents memory bloat.',
      ],
    },
    {
      title: 'Neuroscience of Long-Term Potentiation (LTP)',
      category: 'Biology',
      is_pinned: 0,
      content:
        'Long-Term Potentiation (LTP) strengthens synaptic connections during repetitive high-frequency stimulation. Sleep consolidation migrates short-term hippocampal memories to long-term cerebral cortex storage.',
      tags: ['memory', 'neuroscience', 'brain'],
      insights: [
        'LTP relies heavily on NMDA receptor calcium activation.',
        'REM and NREM sleep stages serve distinct memory consolidation roles.',
        'Spaced repetition triggers optimal protein synthesis for memory.',
      ],
    },
  ];

  const tags = loadTags();
  const noteTags = loadNoteTags();
  let nextTagId = tags.length > 0 ? Math.max(...tags.map((t) => t.id)) + 1 : 1;
  let currentNoteId = maxId + 1;

  seedData.forEach((item) => {
    const noteId = currentNoteId++;
    const noteObj: DBNote = {
      id: noteId,
      user_id: userId,
      title: item.title,
      category: item.category,
      content: item.content,
      is_pinned: item.is_pinned,
      created_at: now,
      updated_at: now,
      insights: item.insights,
    };
    existingNotes.push(noteObj);

    // Process tags
    item.tags.forEach((tagName) => {
      let tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (!tag) {
        tag = { id: nextTagId++, name: tagName.toLowerCase() };
        tags.push(tag);
      }
      noteTags.push({ note_id: noteId, tag_id: tag.id });
    });
  });

  saveNotes(existingNotes);
  saveTags(tags);
  saveNoteTags(noteTags);

  return existingNotes;
}

function generateInsightsFromContent(content: string): string[] {
  const sentences = content.split('.').map((s) => s.trim()).filter((s) => s.length > 10);
  if (sentences.length >= 3) {
    return sentences.slice(0, 3).map((s, i) => `${i + 1}. ${s}.`);
  } else if (sentences.length === 2) {
    return [
      `1. ${sentences[0]}.`,
      `2. ${sentences[1]}.`,
      '3. Synthesized key takeaway for active recall.',
    ];
  } else if (sentences.length === 1) {
    return [
      `1. Core Concept: ${sentences[0]}.`,
      '2. Takeaway: Review key formulas and definitions.',
      '3. Practice: Convert concept into flashcards for retention.',
    ];
  }
  return [
    '1. Primary concept extracted automatically.',
    '2. Key review point indexed for spaced repetition.',
    '3. TextTutor AI study summary created.',
  ];
}

export const notesService = {
  getNotesByUserId(userId: number): FullNote[] {
    const allNotes = loadNotes();
    const userNotes = allNotes.filter((n) => n.user_id === userId);
    const tags = loadTags();
    const noteTags = loadNoteTags();

    return userNotes.map((note) => {
      const associatedTagIds = noteTags
        .filter((nt) => nt.note_id === note.id)
        .map((nt) => nt.tag_id);
      const tagNames = tags
        .filter((t) => associatedTagIds.includes(t.id))
        .map((t) => t.name);

      return {
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        category: note.category || 'General',
        is_pinned: Boolean(note.is_pinned),
        created_at: note.created_at,
        updated_at: note.updated_at,
        tags: tagNames,
        insights: note.insights || generateInsightsFromContent(note.content),
      };
    });
  },

  getNoteById(id: number, userId: number): FullNote | null {
    const notes = this.getNotesByUserId(userId);
    return notes.find((n) => n.id === id) || null;
  },

  createNote(
    userId: number,
    data: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
      is_pinned?: boolean;
    }
  ): FullNote {
    const notes = loadNotes();
    const tags = loadTags();
    const noteTags = loadNoteTags();

    const maxId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) : 0;
    const newId = maxId + 1;
    const now = new Date().toISOString();

    const insights = generateInsightsFromContent(data.content);

    const newNote: DBNote = {
      id: newId,
      user_id: userId,
      title: data.title.trim(),
      content: data.content.trim(),
      category: (data.category || 'General').trim(),
      is_pinned: data.is_pinned ? 1 : 0,
      created_at: now,
      updated_at: now,
      insights,
    };

    notes.push(newNote);
    saveNotes(notes);

    // Process tags
    const inputTags = data.tags || [];
    let nextTagId = tags.length > 0 ? Math.max(...tags.map((t) => t.id)) + 1 : 1;
    const addedTagNames: string[] = [];

    inputTags.forEach((rawTag) => {
      const cleanName = rawTag.trim().toLowerCase();
      if (!cleanName) return;

      let tag = tags.find((t) => t.name.toLowerCase() === cleanName);
      if (!tag) {
        tag = { id: nextTagId++, name: cleanName };
        tags.push(tag);
      }
      noteTags.push({ note_id: newId, tag_id: tag.id });
      addedTagNames.push(tag.name);
    });

    saveTags(tags);
    saveNoteTags(noteTags);

    return {
      id: newNote.id,
      user_id: newNote.user_id,
      title: newNote.title,
      content: newNote.content,
      category: newNote.category,
      is_pinned: Boolean(newNote.is_pinned),
      created_at: newNote.created_at,
      updated_at: newNote.updated_at,
      tags: addedTagNames,
      insights,
    };
  },

  updateNote(
    id: number,
    userId: number,
    data: {
      title?: string;
      content?: string;
      category?: string;
      tags?: string[];
      is_pinned?: boolean;
    }
  ): FullNote | null {
    const notes = loadNotes();
    const noteIndex = notes.findIndex((n) => n.id === id && n.user_id === userId);
    if (noteIndex === -1) return null;

    const existingNote = notes[noteIndex];
    const now = new Date().toISOString();

    if (data.title !== undefined) existingNote.title = data.title.trim();
    if (data.content !== undefined) {
      existingNote.content = data.content.trim();
      existingNote.insights = generateInsightsFromContent(existingNote.content);
    }
    if (data.category !== undefined) existingNote.category = data.category.trim();
    if (data.is_pinned !== undefined) existingNote.is_pinned = data.is_pinned ? 1 : 0;
    existingNote.updated_at = now;

    notes[noteIndex] = existingNote;
    saveNotes(notes);

    // Update tags if provided
    let tags = loadTags();
    let noteTags = loadNoteTags();

    if (data.tags !== undefined) {
      // Remove existing note_tags for this note
      noteTags = noteTags.filter((nt) => nt.note_id !== id);

      let nextTagId = tags.length > 0 ? Math.max(...tags.map((t) => t.id)) + 1 : 1;
      const addedTagNames: string[] = [];

      data.tags.forEach((rawTag) => {
        const cleanName = rawTag.trim().toLowerCase();
        if (!cleanName) return;

        let tag = tags.find((t) => t.name.toLowerCase() === cleanName);
        if (!tag) {
          tag = { id: nextTagId++, name: cleanName };
          tags.push(tag);
        }
        noteTags.push({ note_id: id, tag_id: tag.id });
        addedTagNames.push(tag.name);
      });

      saveTags(tags);
      saveNoteTags(noteTags);
    }

    return this.getNoteById(id, userId);
  },

  deleteNote(id: number, userId: number): boolean {
    const notes = loadNotes();
    const noteIndex = notes.findIndex((n) => n.id === id && n.user_id === userId);
    if (noteIndex === -1) return false;

    notes.splice(noteIndex, 1);
    saveNotes(notes);

    // Clean up note_tags
    let noteTags = loadNoteTags();
    noteTags = noteTags.filter((nt) => nt.note_id !== id);
    saveNoteTags(noteTags);

    return true;
  },

  getAllTags(): string[] {
    const tags = loadTags();
    return tags.map((t) => t.name);
  },
};
