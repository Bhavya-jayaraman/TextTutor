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

const plannerFilePath = path.join(dataDir, 'study_plans.json');

export interface StudyTask {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export interface DBStudyPlan {
  id: number;
  user_id: number;
  title: string;
  category: string;
  start_date: string;
  end_date: string;
  daily_goal: string;
  daily_duration_minutes: number;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  tasks: StudyTask[];
  created_at: string;
}

function loadPlans(): DBStudyPlan[] {
  try {
    if (fs.existsSync(plannerFilePath)) {
      const raw = fs.readFileSync(plannerFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading study_plans.json:', err);
  }
  return [];
}

function savePlans(plans: DBStudyPlan[]): void {
  try {
    fs.writeFileSync(plannerFilePath, JSON.stringify(plans, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving study_plans.json:', err);
  }
}

function seedInitialStudyPlans(userId: number): DBStudyPlan[] {
  const plans = loadPlans();
  const userPlans = plans.filter((p) => p.user_id === userId);
  if (userPlans.length > 0) return plans;

  const maxId = plans.length > 0 ? Math.max(...plans.map((p) => p.id)) : 0;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nextWeekStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const seed: DBStudyPlan[] = [
    {
      id: maxId + 1,
      user_id: userId,
      title: 'Quantum Computing Mastery',
      category: 'Physics',
      start_date: todayStr,
      end_date: nextWeekStr,
      daily_goal: '2 hours daily study & flashcard review',
      daily_duration_minutes: 120,
      priority: 'High',
      completed: false,
      tasks: [
        { id: '1', title: 'Review Quantum Computing Flashcards', time: '09:00 AM', completed: true, priority: 'High' },
        { id: '2', title: 'Generate Raft Consensus Practice Quiz', time: '11:30 AM', completed: false, priority: 'High' },
        { id: '3', title: 'Draft Neuroscience Lecture Notes', time: '02:00 PM', completed: false, priority: 'Medium' },
        { id: '4', title: 'AI Assistant Q&A Session', time: '04:30 PM', completed: false, priority: 'Low' },
      ],
      created_at: now.toISOString(),
    },
    {
      id: maxId + 2,
      user_id: userId,
      title: 'Distributed Systems & Microservices',
      category: 'Computer Science',
      start_date: todayStr,
      end_date: nextWeekStr,
      daily_goal: '1.5 hours daily note synthesis',
      daily_duration_minutes: 90,
      priority: 'Medium',
      completed: false,
      tasks: [
        { id: '5', title: 'Read Raft consensus paper section 4', time: '10:00 AM', completed: true, priority: 'High' },
        { id: '6', title: 'Practice 15 distributed systems flashcards', time: '03:00 PM', completed: false, priority: 'Medium' },
      ],
      created_at: now.toISOString(),
    },
  ];

  plans.push(...seed);
  savePlans(plans);
  return plans;
}

export const plannerService = {
  getUserPlans(userId: number): DBStudyPlan[] {
    const plans = seedInitialStudyPlans(userId);
    return plans
      .filter((p) => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getPlanById(id: number, userId: number): DBStudyPlan | null {
    const plans = this.getUserPlans(userId);
    return plans.find((p) => p.id === id) || null;
  },

  createPlan(
    userId: number,
    data: {
      title: string;
      category?: string;
      start_date?: string;
      end_date?: string;
      daily_goal?: string;
      daily_duration_minutes?: number;
      priority?: 'High' | 'Medium' | 'Low';
      tasks?: StudyTask[];
    }
  ): DBStudyPlan {
    const plans = loadPlans();
    const maxId = plans.length > 0 ? Math.max(...plans.map((p) => p.id)) : 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const newPlan: DBStudyPlan = {
      id: maxId + 1,
      user_id: userId,
      title: data.title.trim(),
      category: (data.category || 'General').trim(),
      start_date: data.start_date || todayStr,
      end_date: data.end_date || todayStr,
      daily_goal: data.daily_goal || '1 hour daily',
      daily_duration_minutes: data.daily_duration_minutes || 60,
      priority: data.priority || 'Medium',
      completed: false,
      tasks: data.tasks || [],
      created_at: now.toISOString(),
    };

    plans.push(newPlan);
    savePlans(plans);
    return newPlan;
  },

  updatePlan(
    id: number,
    userId: number,
    data: {
      title?: string;
      category?: string;
      start_date?: string;
      end_date?: string;
      daily_goal?: string;
      daily_duration_minutes?: number;
      priority?: 'High' | 'Medium' | 'Low';
      completed?: boolean;
      tasks?: StudyTask[];
    }
  ): DBStudyPlan | null {
    const plans = loadPlans();
    const idx = plans.findIndex((p) => p.id === id && p.user_id === userId);
    if (idx === -1) return null;

    const plan = plans[idx];
    if (data.title !== undefined) plan.title = data.title.trim();
    if (data.category !== undefined) plan.category = data.category.trim();
    if (data.start_date !== undefined) plan.start_date = data.start_date;
    if (data.end_date !== undefined) plan.end_date = data.end_date;
    if (data.daily_goal !== undefined) plan.daily_goal = data.daily_goal;
    if (data.daily_duration_minutes !== undefined) plan.daily_duration_minutes = data.daily_duration_minutes;
    if (data.priority !== undefined) plan.priority = data.priority;
    if (data.completed !== undefined) plan.completed = data.completed;
    if (data.tasks !== undefined) plan.tasks = data.tasks;

    plans[idx] = plan;
    savePlans(plans);
    return plan;
  },

  deletePlan(id: number, userId: number): boolean {
    const plans = loadPlans();
    const idx = plans.findIndex((p) => p.id === id && p.user_id === userId);
    if (idx === -1) return false;

    plans.splice(idx, 1);
    savePlans(plans);
    return true;
  },
};
