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

const summariesFilePath = path.join(dataDir, 'summaries.json');

export interface DBSummary {
  id: number;
  note_id: number;
  user_id: number;
  short_summary: string;
  detailed_summary: string;
  bullet_points: string[];
  keywords: string[];
  created_at: string;
}

function loadSummaries(): DBSummary[] {
  try {
    if (fs.existsSync(summariesFilePath)) {
      const raw = fs.readFileSync(summariesFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading summaries.json:', err);
  }
  return [];
}

function saveSummaries(summaries: DBSummary[]): void {
  try {
    fs.writeFileSync(summariesFilePath, JSON.stringify(summaries, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving summaries.json:', err);
  }
}

export const summaryService = {
  getSummariesByNoteId(noteId: number, userId: number): DBSummary[] {
    const all = loadSummaries();
    return all.filter((s) => s.note_id === noteId && s.user_id === userId);
  },

  getLatestSummaryByNoteId(noteId: number, userId: number): DBSummary | null {
    const noteSummaries = this.getSummariesByNoteId(noteId, userId);
    if (noteSummaries.length === 0) return null;
    return noteSummaries.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  },

  saveSummary(
    userId: number,
    noteId: number,
    data: {
      shortSummary: string;
      detailedSummary: string;
      bulletPoints: string[];
      keywords: string[];
    }
  ): DBSummary {
    const summaries = loadSummaries();
    const maxId = summaries.length > 0 ? Math.max(...summaries.map((s) => s.id)) : 0;
    const newSummary: DBSummary = {
      id: maxId + 1,
      note_id: noteId,
      user_id: userId,
      short_summary: data.shortSummary,
      detailed_summary: data.detailedSummary,
      bullet_points: data.bulletPoints,
      keywords: data.keywords,
      created_at: new Date().toISOString(),
    };

    summaries.push(newSummary);
    saveSummaries(summaries);
    return newSummary;
  },

  getAllUserSummaries(userId: number): DBSummary[] {
    const all = loadSummaries();
    return all.filter((s) => s.user_id === userId);
  },

  getSummaryStats(userId: number): {
    totalSummaries: number;
    recentlySummarizedNoteIds: number[];
  } {
    const userSummaries = this.getAllUserSummaries(userId);
    const sorted = [...userSummaries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Unique note IDs in order of recent summarization
    const recentNoteIds = Array.from(new Set(sorted.map((s) => s.note_id))).slice(0, 5);

    return {
      totalSummaries: userSummaries.length,
      recentlySummarizedNoteIds: recentNoteIds,
    };
  },
};
