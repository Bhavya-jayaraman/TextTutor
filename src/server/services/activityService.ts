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

const activityFilePath = path.join(dataDir, 'activity_logs.json');

export interface DBActivityLog {
  id: number;
  user_id: number;
  action: 'note_created' | 'note_updated' | 'summary_generated' | 'flashcards_generated' | 'quiz_completed' | 'ai_chat_used';
  description: string;
  created_at: string;
}

function loadLogs(): DBActivityLog[] {
  try {
    if (fs.existsSync(activityFilePath)) {
      const raw = fs.readFileSync(activityFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading activity_logs.json:', err);
  }
  return [];
}

function saveLogs(logs: DBActivityLog[]): void {
  try {
    fs.writeFileSync(activityFilePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving activity_logs.json:', err);
  }
}

function seedInitialActivityLogs(userId: number): DBActivityLog[] {
  const logs = loadLogs();
  const userLogs = logs.filter((l) => l.user_id === userId);
  if (userLogs.length > 0) return logs;

  const maxId = logs.length > 0 ? Math.max(...logs.map((l) => l.id)) : 0;
  const now = new Date();

  const seed: Array<{
    action: DBActivityLog['action'];
    description: string;
    offsetMinutes: number;
  }> = [
    {
      action: 'note_created',
      description: 'Created study note "Quantum Superposition & Entanglement"',
      offsetMinutes: 15,
    },
    {
      action: 'summary_generated',
      description: 'Generated AI Summary & Key Insights for Raft Consensus Protocol',
      offsetMinutes: 90,
    },
    {
      action: 'flashcards_generated',
      description: 'Created 10 AI Spaced Repetition Flashcards for Neuroscience',
      offsetMinutes: 240,
    },
    {
      action: 'quiz_completed',
      description: 'Scored 100% on Neuroscience LTP Practice Quiz',
      offsetMinutes: 1440,
    },
    {
      action: 'ai_chat_used',
      description: 'Socratic Q&A session on Quantum Decoherence',
      offsetMinutes: 2880,
    },
  ];

  let nextId = maxId + 1;
  seed.forEach((item) => {
    const timestamp = new Date(now.getTime() - item.offsetMinutes * 60000).toISOString();
    logs.push({
      id: nextId++,
      user_id: userId,
      action: item.action,
      description: item.description,
      created_at: timestamp,
    });
  });

  saveLogs(logs);
  return logs;
}

export const activityService = {
  getUserActivity(userId: number): DBActivityLog[] {
    const logs = loadLogs();
    return logs
      .filter((l) => l.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  logActivity(
    userId: number,
    action: DBActivityLog['action'],
    description: string
  ): DBActivityLog {
    const logs = loadLogs();
    const maxId = logs.length > 0 ? Math.max(...logs.map((l) => l.id)) : 0;
    const newLog: DBActivityLog = {
      id: maxId + 1,
      user_id: userId,
      action,
      description,
      created_at: new Date().toISOString(),
    };

    logs.push(newLog);
    saveLogs(logs);
    return newLog;
  },
};
