/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { clientAuthService } from './services/clientAuthService.js';
import { User } from './types/auth.js';
import { Login } from './components/auth/Login.js';
import { Register } from './components/auth/Register.js';
import { ForgotPassword } from './components/auth/ForgotPassword.js';
import { Profile } from './components/auth/Profile.js';
import { MainNavbar } from './components/navigation/MainNavbar.js';
import { Dashboard } from './components/dashboard/Dashboard.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { LoadingScreen } from './components/common/LoadingScreen.js';
import { TextTutorLogo } from './components/common/TextTutorLogo.js';

export interface NoteSample {
  id: string;
  title: string;
  category: string;
  date: string;
  content: string;
  insights: string[];
  retentionMetric: string;
}

const SAMPLE_NOTES: NoteSample[] = [
  {
    id: '1',
    title: 'Quantum Computing Principles',
    category: 'Physics',
    date: 'Oct 24, 2026',
    content:
      'The core principle of superposition allows a qubit to represent both 0 and 1 simultaneously. Unlike classical bits, entanglement links particles regardless of distance, opening breakthrough capabilities for complex optimization.',
    insights: [
      'Superposition enables massive parallel computation.',
      'Entanglement is the physical mechanism for instant correlation.',
      'Decoherence remains the primary engineering hurdle.',
    ],
    retentionMetric: '🚀 40% Better Retention',
  },
  {
    id: '2',
    title: 'Distributed Systems & Consensus',
    category: 'Computer Science',
    date: 'Nov 02, 2026',
    content:
      'Raft consensus decomposes state machine replication into leader election, log replication, and safety guarantees. Quorums ensure fault tolerance across unreliable networks.',
    insights: [
      'Raft prioritizes understandability over Paxos complexity.',
      'Leader election requires a strict term timestamp majority.',
      'Log compaction via snapshotting prevents memory bloat.',
    ],
    retentionMetric: '⚡ 3.5x Faster Review',
  },
  {
    id: '3',
    title: 'Neuroscience of Memory Formation',
    category: 'Biology',
    date: 'Dec 12, 2026',
    content:
      'Long-Term Potentiation (LTP) strengthens synaptic connections during repetitive high-frequency stimulation. Sleep consolidation migrates short-term hippocampal memories to cerebral cortex storage.',
    insights: [
      'LTP relies heavily on NMDA receptor activation.',
      'REM and NREM sleep stages serve distinct consolidation roles.',
      'Spaced repetition triggers optimal protein synthesis for memory.',
    ],
    retentionMetric: '🧠 85% Mastery Score',
  },
];

type ViewMode = 'landing' | 'login' | 'register' | 'forgot-password' | 'profile' | 'dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => clientAuthService.getStoredUser());
  const [currentView, setCurrentView] = useState<ViewMode>(() => (currentUser ? 'dashboard' : 'landing'));
  const [selectedNote, setSelectedNote] = useState<NoteSample>(SAMPLE_NOTES[0]);
  const [notesList, setNotesList] = useState<NoteSample[]>(SAMPLE_NOTES);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    return !!clientAuthService.getStoredToken();
  });

  useEffect(() => {
    document.documentElement.className = 'light';
    localStorage.setItem('texttutor_theme', 'light');
  }, []);

  // Sync token validation on mount
  useEffect(() => {
    const handleUnauthorized = () => {
      clientAuthService.logout();
      setCurrentUser(null);
      setCurrentView('login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const token = clientAuthService.getStoredToken();
    if (token) {
      clientAuthService
        .getProfile()
        .then((res) => {
          if (res.success && res.user) {
            setCurrentUser(res.user);
          }
        })
        .catch(() => {
          clientAuthService.logout();
          setCurrentUser(null);
          setCurrentView('landing');
        })
        .finally(() => {
          setIsInitialLoading(false);
        });
    } else {
      setIsInitialLoading(false);
    }

    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    clientAuthService.logout();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsGenerating(true);

    setTimeout(() => {
      const sentences = newContent.split('.').filter((s) => s.trim().length > 10);
      const generatedInsights =
        sentences.length >= 2
          ? sentences.slice(0, 3).map((s, idx) => `${idx + 1}. ${s.trim()}`)
          : [
              '1. Key concept identified from text input.',
              '2. Primary subject matter extracted automatically.',
              '3. Summary formatted for quick memory retention.',
            ];

      const created: NoteSample = {
        id: Date.now().toString(),
        title: newTitle,
        category: 'Custom Note',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        content: newContent,
        insights: generatedInsights,
        retentionMetric: '✨ Smart AI Analysis',
      };

      setNotesList((prev) => [created, ...prev]);
      setSelectedNote(created);
      setNewTitle('');
      setNewContent('');
      setIsGenerating(false);
    }, 700);
  };

  if (isInitialLoading) {
    return <LoadingScreen message="Verifying authentication session..." />;
  }

  if (currentView === 'dashboard' && currentUser) {
    return (
      <Dashboard
        user={currentUser}
        onOpenProfile={() => setCurrentView('profile')}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'landing') {
    return (
      <LandingPage
        theme="light"
        toggleTheme={() => {}}
        currentUser={currentUser}
        onNavigateLogin={() => setCurrentView('login')}
        onNavigateRegister={() => setCurrentView('register')}
        onNavigateDashboard={() => setCurrentView('dashboard')}
        notesList={notesList}
        selectedNote={selectedNote}
        setSelectedNote={setSelectedNote}
        handleCreateNote={handleCreateNote}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newContent={newContent}
        setNewContent={setNewContent}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/20 flex flex-col">
      {/* Navigation Header for Auth Pages */}
      <MainNavbar
        theme="light"
        currentUser={currentUser}
        onNavigateLogin={() => setCurrentView('login')}
        onNavigateRegister={() => setCurrentView('register')}
        onNavigateDashboard={() => setCurrentView('dashboard')}
        onNavigateHome={() => setCurrentView('landing')}
        onSelectSection={(sectionId) => {
          setCurrentView('landing');
          setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative flex items-center justify-center">
        {currentView === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setCurrentView('register')}
            onNavigateForgotPassword={() => setCurrentView('forgot-password')}
          />
        )}

        {currentView === 'register' && (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'forgot-password' && (
          <ForgotPassword onNavigateLogin={() => setCurrentView('login')} />
        )}

        {currentView === 'profile' && currentUser && (
          <Profile
            user={currentUser}
            onUpdateUser={(updated) => setCurrentUser(updated)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 bg-white text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <TextTutorLogo size={24} showText={true} textClassName="font-bold text-slate-900 text-sm" />
            <span className="hidden sm:inline text-slate-400">—</span>
            <span className="hidden sm:inline">Transform Your Notes Into Knowledge with AI</span>
          </div>

          <div className="flex gap-6 text-slate-500">
            <span>© 2026 TextTutor. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
