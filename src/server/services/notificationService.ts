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

const notificationsFilePath = path.join(dataDir, 'notifications.json');

export interface DBNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'study_session' | 'missed_goal' | 'daily_reminder' | 'quiz_reminder' | 'flashcard_reminder' | 'system';
  is_read: boolean;
  created_at: string;
}

function loadNotifications(): DBNotification[] {
  try {
    if (fs.existsSync(notificationsFilePath)) {
      const raw = fs.readFileSync(notificationsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading notifications.json:', err);
  }
  return [];
}

function saveNotifications(notifs: DBNotification[]): void {
  try {
    fs.writeFileSync(notificationsFilePath, JSON.stringify(notifs, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving notifications.json:', err);
  }
}

function seedInitialNotifications(userId: number): DBNotification[] {
  const notifs = loadNotifications();
  const userNotifs = notifs.filter((n) => n.user_id === userId);
  if (userNotifs.length > 0) return notifs;

  const maxId = notifs.length > 0 ? Math.max(...notifs.map((n) => n.id)) : 0;
  const now = new Date();

  const seed: Array<{
    title: string;
    message: string;
    type: DBNotification['type'];
    is_read: boolean;
    offsetMinutes: number;
  }> = [
    {
      title: '⏰ Upcoming Study Session',
      message: 'Scheduled "Review Quantum Computing Flashcards" starts in 30 minutes.',
      type: 'study_session',
      is_read: false,
      offsetMinutes: 20,
    },
    {
      title: '🎯 Daily Goal Progress',
      message: 'You are 1 quiz away from completing your daily practice target!',
      type: 'daily_reminder',
      is_read: false,
      offsetMinutes: 120,
    },
    {
      title: '⚡ Spaced Repetition Reminder',
      message: '10 neuroscience flashcards are due for review today.',
      type: 'flashcard_reminder',
      is_read: true,
      offsetMinutes: 360,
    },
    {
      title: '🏆 Quiz Mastery Achieved',
      message: 'Great job! You achieved a 100% score on Raft Consensus Quiz.',
      type: 'quiz_reminder',
      is_read: true,
      offsetMinutes: 1440,
    },
  ];

  let nextId = maxId + 1;
  seed.forEach((item) => {
    const timestamp = new Date(now.getTime() - item.offsetMinutes * 60000).toISOString();
    notifs.push({
      id: nextId++,
      user_id: userId,
      title: item.title,
      message: item.message,
      type: item.type,
      is_read: item.is_read,
      created_at: timestamp,
    });
  });

  saveNotifications(notifs);
  return notifs;
}

export const notificationService = {
  getUserNotifications(userId: number): DBNotification[] {
    const notifs = seedInitialNotifications(userId);
    return notifs
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createNotification(
    userId: number,
    data: {
      title: string;
      message: string;
      type: DBNotification['type'];
    }
  ): DBNotification {
    const notifs = loadNotifications();
    const maxId = notifs.length > 0 ? Math.max(...notifs.map((n) => n.id)) : 0;
    const newNotif: DBNotification = {
      id: maxId + 1,
      user_id: userId,
      title: data.title,
      message: data.message,
      type: data.type,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    notifs.push(newNotif);
    saveNotifications(notifs);
    return newNotif;
  },

  markAsRead(id: number, userId: number): DBNotification | null {
    const notifs = loadNotifications();
    const idx = notifs.findIndex((n) => n.id === id && n.user_id === userId);
    if (idx === -1) return null;

    notifs[idx].is_read = true;
    saveNotifications(notifs);
    return notifs[idx];
  },

  markAllAsRead(userId: number): boolean {
    const notifs = loadNotifications();
    let updated = false;
    notifs.forEach((n) => {
      if (n.user_id === userId && !n.is_read) {
        n.is_read = true;
        updated = true;
      }
    });

    if (updated) {
      saveNotifications(notifs);
    }
    return true;
  },
};
