/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../layout/Sidebar.js';
import { Navbar } from '../layout/Navbar.js';
import { WelcomeSection } from './WelcomeSection.js';
import { StatCards } from './StatCards.js';
import { QuickActions } from './QuickActions.js';
import { RecentNotes } from './RecentNotes.js';
import { RecentActivity } from './RecentActivity.js';
import { RecentAIConversations } from './RecentAIConversations.js';
import { UpcomingStudyTasks } from './UpcomingStudyTasks.js';
import { LearningProgress } from './LearningProgress.js';
import { MyNotesView } from './MyNotesView.jsx';
import { AIAssistantView } from './AIAssistantView.jsx';
import { FlashcardsView } from './FlashcardsView.jsx';
import { QuizView } from './QuizView.jsx';
import { AnalyticsView } from './AnalyticsView.jsx';
import { StudyPlannerView } from './StudyPlannerView.jsx';
import { ActivityTimelineView } from './ActivityTimelineView.jsx';
import { SettingsView } from './SettingsView.js';
import { Profile } from '../auth/Profile.js';
import { UploadNoteModal } from './UploadNoteModal.jsx';
import { User } from '../../types/auth.js';
import { Note } from '../../types/notes.js';
import { clientNotesService } from '../../services/clientNotesService.js';
import { clientAiService } from '../../services/clientAiService.js';
import { clientConversationService } from '../../services/clientConversationService.js';
import { clientFlashcardService } from '../../services/clientFlashcardService.js';
import { clientQuizService } from '../../services/clientQuizService.js';
import { clientActivityService } from '../../services/clientActivityService.js';
import {
  DashboardView,
  ThemeMode,
  NoteItem,
  ActivityItem,
  DashboardStats,
} from '../../types/dashboard.js';

interface DashboardLayoutProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

function mapNoteToItem(n: Note): NoteItem {
  return {
    id: String(n.id),
    title: n.title,
    category: n.category,
    date: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    updatedAt: new Date(n.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    content: n.content,
    insights: n.insights || [],
    tags: n.tags || [],
  };
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  onUpdateUser,
  onLogout,
}) => {
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const theme: ThemeMode = 'light';

  useEffect(() => {
    document.documentElement.className = 'light';
    localStorage.setItem('texttutor_theme', 'light');
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalAiSummaries, setTotalAiSummaries] = useState<number>(0);
  const [totalAiChats, setTotalAiChats] = useState<number>(0);
  const [totalFlashcards, setTotalFlashcards] = useState<number>(0);
  const [totalQuizzes, setTotalQuizzes] = useState<number>(0);

  const fetchDashboardNotesAndStats = async () => {
    try {
      const res = await clientNotesService.getAllNotes();
      if (res.success && res.notes) {
        setNotes(res.notes.map(mapNoteToItem));
      }
    } catch (err) {
      console.error('Failed fetching dashboard notes:', err);
    }

    try {
      const actRes = await clientActivityService.getActivity();
      if (actRes.success && actRes.activity) {
        setActivities(
          actRes.activity.map((a) => ({
            id: String(a.id),
            type: a.action,
            title: a.action.replace('_', ' ').toUpperCase(),
            description: a.description,
            timestamp: new Date(a.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            iconType: a.action.includes('note') ? 'note' : a.action.includes('quiz') ? 'quiz' : 'summary',
          }))
        );
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Failed fetching activities:', err);
      setActivities([]);
    }

    try {
      const aiRes = await clientAiService.getAiStats();
      if (aiRes.success) {
        setTotalAiSummaries(aiRes.totalSummaries);
      }
    } catch (err) {
      console.error('Failed fetching AI stats:', err);
    }

    try {
      const convRes = await clientConversationService.getAllConversations();
      if (convRes.success && convRes.conversations) {
        setTotalAiChats(convRes.conversations.length);
      }
    } catch (err) {
      console.error('Failed fetching conversation stats:', err);
    }

    try {
      const fcRes = await clientFlashcardService.getStats();
      if (fcRes.success) {
        setTotalFlashcards(fcRes.totalFlashcards);
      }
    } catch (err) {
      console.error('Failed fetching flashcard stats:', err);
    }

    try {
      const qRes = await clientQuizService.getStats();
      if (qRes.success) {
        setTotalQuizzes(qRes.totalAttempts > 0 ? qRes.totalAttempts : qRes.totalQuizzesGenerated);
      }
    } catch (err) {
      console.error('Failed fetching quiz stats:', err);
    }
  };

  useEffect(() => {
    fetchDashboardNotesAndStats();
  }, []);

  const stats: DashboardStats = {
    totalNotes: notes.length,
    aiSummariesGenerated: totalAiSummaries > 0 ? totalAiSummaries : notes.reduce((acc, n) => acc + (n.insights ? n.insights.length : 0), 0),
    flashcardsCreated: totalFlashcards,
    quizzesTaken: totalQuizzes,
    studyStreakDays: notes.length > 0 ? 7 : 0,
  };

  const handleAddNote = (newNote: NoteItem) => {
    setNotes((prev) => [newNote, ...prev]);
    fetchDashboardNotesAndStats();
  };

  const handleNotesUpdated = (updatedNotes: Note[]) => {
    setNotes(updatedNotes.map(mapNoteToItem));
  };

  const handleQuickAction = (key: string) => {
    if (key === 'upload_note') {
      setIsUploadModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        user={user}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        theme="light"
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          user={user}
          theme="light"
          onOpenMobileMenu={() => setMobileOpen(true)}
          onSelectView={setActiveView}
          onLogout={onLogout}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim() && activeView !== 'my-notes') {
              setActiveView('my-notes');
            }
          }}
        />

        {/* Dashboard Pages - Stretches naturally across the page */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto w-full space-y-8">
          {activeView === 'dashboard' && (
            <>
              {/* 1. Hero Section */}
              <WelcomeSection user={user} theme={theme} streakDays={stats.studyStreakDays} />

              {/* 2. Statistics Cards */}
              <StatCards stats={stats} theme={theme} />

              {/* 3. Quick Actions */}
              <QuickActions
                theme={theme}
                onSelectAction={handleQuickAction}
                onNavigateView={setActiveView}
              />

              {/* 4. Charts */}
              <LearningProgress theme={theme} onNavigateView={setActiveView} />

              {/* 5, 6, 7. Three-Column Grid: Recent Notes, Recent AI Conversations, Upcoming Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <RecentNotes notes={notes} theme={theme} onNavigateView={setActiveView} />
                </div>
                <div>
                  <RecentAIConversations theme={theme} onNavigateView={setActiveView} />
                </div>
                <div>
                  <UpcomingStudyTasks theme={theme} onNavigateView={setActiveView} />
                </div>
              </div>

              {/* Recent Activity Stream */}
              <RecentActivity activities={activities} theme={theme} onNavigateView={setActiveView} />
            </>
          )}

          {activeView === 'my-notes' && (
            <MyNotesView
              theme={theme}
              initialSearchQuery={searchQuery}
              onNotesUpdated={handleNotesUpdated}
            />
          )}

          {activeView === 'ai-assistant' && <AIAssistantView user={user} theme={theme} />}

          {activeView === 'flashcards' && <FlashcardsView theme={theme} />}

          {activeView === 'quiz' && <QuizView theme={theme} />}

          {activeView === 'analytics' && <AnalyticsView theme={theme} />}

          {activeView === 'study-planner' && <StudyPlannerView theme={theme} />}

          {activeView === 'activity' && <ActivityTimelineView theme={theme} />}

          {activeView === 'profile' && (
            <Profile user={user} onUpdateUser={onUpdateUser} onLogout={onLogout} />
          )}

          {activeView === 'settings' && (
            <SettingsView theme="light" onLogout={onLogout} />
          )}
        </main>
      </div>

      {/* Upload Note Modal */}
      <UploadNoteModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddNote={handleAddNote}
        theme={theme}
      />
    </div>
  );
};
