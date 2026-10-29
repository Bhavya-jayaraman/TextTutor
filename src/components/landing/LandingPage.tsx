/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Brain,
  Layers,
  HelpCircle,
  BarChart3,
  Cloud,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  Search,
  Check,
  GraduationCap,
  BookOpen,
  Award,
  Plus,
  Copy,
  LayoutDashboard,
  Calendar,
  X,
  Info,
} from 'lucide-react';
import { User } from '../../types/auth.js';
import { MainNavbar } from '../navigation/MainNavbar.js';
import { TextTutorLogo } from '../common/TextTutorLogo.js';

export interface NoteSample {
  id: string;
  title: string;
  category: string;
  date: string;
  content: string;
  insights: string[];
  retentionMetric: string;
}

interface FeatureDetail {
  title: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  previewTab: 'dashboard' | 'chat' | 'notes' | 'analytics';
  detailedBenefits: string[];
}

interface LandingPageProps {
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
  currentUser: User | null;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateDashboard: () => void;
  notesList: NoteSample[];
  selectedNote: NoteSample;
  setSelectedNote: (note: NoteSample) => void;
  handleCreateNote: (e: React.FormEvent) => void;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newContent: string;
  setNewContent: (val: string) => void;
  isGenerating: boolean;
}

const FEATURE_LIST: FeatureDetail[] = [
  {
    title: 'AI Note Summaries',
    desc: 'Condense long lectures, research PDFs, or complex textbooks into structured bullet digests in seconds.',
    icon: Sparkles,
    gradient: 'from-indigo-600 to-indigo-700',
    iconColor: 'text-indigo-600',
    previewTab: 'notes',
    detailedBenefits: [
      'Extracts definitions, formulas, and actionable concepts',
      'Customizable summary depth (brief vs. comprehensive)',
      'Organizes knowledge into digestible study points',
    ],
  },
  {
    title: '3D Flashcards',
    desc: 'Automatically synthesize interactive 3D flashcards with spaced repetition and confidence tracking.',
    icon: Layers,
    gradient: 'from-emerald-600 to-teal-600',
    iconColor: 'text-emerald-600',
    previewTab: 'dashboard',
    detailedBenefits: [
      'Automatic card creation from your uploaded notes',
      'Interactive 3D flip card experience',
      'Spaced repetition algorithm to reinforce weak spots',
    ],
  },
  {
    title: 'Quiz Generator',
    desc: 'Generate adaptive multiple-choice quizzes to pinpoint retention gaps before exams.',
    icon: HelpCircle,
    gradient: 'from-amber-600 to-orange-600',
    iconColor: 'text-amber-600',
    previewTab: 'dashboard',
    detailedBenefits: [
      'Generates 4-option practice tests with immediate grading',
      'In-depth explanations for correct and incorrect answers',
      'Tracks historical test scores and mastery trends',
    ],
  },
  {
    title: 'Context-Aware AI Tutor',
    desc: 'Chat directly with your notes. Get accurate answers grounded specifically in your study materials.',
    icon: MessageSquare,
    gradient: 'from-cyan-600 to-blue-600',
    iconColor: 'text-cyan-600',
    previewTab: 'chat',
    detailedBenefits: [
      'Grounded in your own uploaded notes and textbooks',
      'Source citations for every AI explanation',
      'Continuous chat history saved per subject',
    ],
  },
  {
    title: 'Study Analytics & Velocity',
    desc: 'Track study velocity, topic mastery heatmaps, and weekly learning goal completion percentages.',
    icon: BarChart3,
    gradient: 'from-pink-600 to-rose-600',
    iconColor: 'text-pink-600',
    previewTab: 'analytics',
    detailedBenefits: [
      'Visual charts for daily study habits and quiz performance',
      'Consecutive study streak counter to stay motivated',
      'Mastery breakdown across all enrolled subjects',
    ],
  },
  {
    title: 'Study Planner & Goals',
    desc: 'Create structured study plans, set daily revision targets, and keep your prep on schedule.',
    icon: Calendar,
    gradient: 'from-violet-600 to-purple-600',
    iconColor: 'text-violet-600',
    previewTab: 'dashboard',
    detailedBenefits: [
      'Customizable target study times per subject',
      'Daily checklist with automated completion tracking',
      'Integrated notifications to prevent cramming',
    ],
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateDashboard,
  notesList,
  selectedNote,
  setSelectedNote,
  handleCreateNote,
  newTitle,
  setNewTitle,
  newContent,
  setNewContent,
  isGenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'dashboard' | 'chat' | 'notes' | 'analytics'>('dashboard');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [workspaceMode, setWorkspaceMode] = useState<'overview' | 'studio'>('overview');
  const [activeSection, setActiveSection] = useState<string>('home');
  const [selectedFeatureModal, setSelectedFeatureModal] = useState<FeatureDetail | null>(null);

  const handleCopy = () => {
    if (selectedNote?.insights) {
      navigator.clipboard.writeText(selectedNote.insights.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: 'How does TextTutor summarize notes and generate study materials?',
      a: 'TextTutor uses advanced AI models to analyze your notes, lecture transcripts, and documents. It extracts core definitions and key themes, creating structured digests, interactive 3D flashcards, and multiple-choice quizzes automatically.',
    },
    {
      q: 'Is my study data and personal notes kept secure and private?',
      a: 'Yes. Your notes are stored securely with strict user-level isolation and JWT authentication. Your personal notes and study materials are never shared publicly or used to train external models.',
    },
    {
      q: 'Can I create flashcards and quizzes directly from my notes?',
      a: 'Absolutely! With a single click, TextTutor extracts key concepts from your notes and creates interactive flashcards with spaced repetition and multiple-choice quizzes with explanations.',
    },
    {
      q: 'How does the AI Study Assistant answer questions?',
      a: 'The TextTutor AI Assistant uses your uploaded notes and study materials as factual context. When you ask a question, it grounds its explanation directly in your own source notes, preventing hallucinations.',
    },
    {
      q: 'Is TextTutor completely free to use?',
      a: 'Yes! TextTutor is an accessible, 100% free AI study companion for students, researchers, and learners everywhere. All features—including AI summarization, flashcards, quizzes, and chat—are available without subscription paywalls.',
    },
  ];

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-indigo-500/20">
      {/* 1. Sticky Main Navbar */}
      <MainNavbar
        currentUser={currentUser}
        onNavigateLogin={onNavigateLogin}
        onNavigateRegister={onNavigateRegister}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateHome={() => {
          setWorkspaceMode('overview');
          setActiveSection('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectSection={(sectionId) => {
          setWorkspaceMode('overview');
          scrollToSection(sectionId);
        }}
        activeSection={activeSection}
        workspaceMode={workspaceMode}
        onToggleStudio={() => {
          setWorkspaceMode(workspaceMode === 'studio' ? 'overview' : 'studio');
          if (workspaceMode !== 'studio') {
            setActiveSection('studio');
          }
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">
        {workspaceMode === 'studio' ? (
          /* Interactive Studio View */
          <div className="space-y-8 max-w-4xl mx-auto py-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                  <span>Interactive Note Studio</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Draft or paste raw notes below to generate real-time AI summaries and flashcard insights.
                </p>
              </div>

              <button
                onClick={() => setWorkspaceMode('overview')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                ← Back to Overview
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-5">
                <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Sample Note</span>
                </h2>

                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Topic / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Quantum Entanglement Principles"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Raw Notes or Transcriptions
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Paste lecture text or research notes here..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full rounded-xl p-4 text-xs font-medium bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate AI Key Insights</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Sample Topics ({notesList.length})</span>
                  <FileText className="w-4 h-4 text-indigo-600" />
                </h2>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {notesList.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedNote.id === note.id
                          ? 'bg-indigo-50/70 border-indigo-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          {note.title}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono">{note.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {note.content}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600">
                        <Sparkles className="w-3 h-3" />
                        <span>{note.insights.length} Key Insights Generated</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Full SaaS Landing Page */
          <>
            {/* 2. Hero Section */}
            <section id="hero" className="relative pt-6 pb-12 flex flex-col justify-center min-h-[75vh]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Hero Left Column */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Pill Tag */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 text-xs font-bold tracking-wide shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Study Companion & Active Recall</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-slate-900">
                    Read Smarter. <span className="text-indigo-600">Understand Deeper.</span>
                  </h1>

                  {/* Supporting text */}
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                    Transform your documents, textbooks, research papers, and notes into structured knowledge, verified AI answers, interactive flashcards, and quizzes.
                  </p>

                  {/* CTA Buttons */}
                  <div className="pt-2 flex flex-wrap gap-4 items-center">
                    <button
                      onClick={currentUser ? onNavigateDashboard : onNavigateRegister}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>{currentUser ? 'Go to Dashboard' : 'Get Started Free'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => scrollToSection('features')}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-2xs"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>Explore Features</span>
                    </button>
                  </div>

                  {/* Trust Badges */}
                  <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>100% Free Forever</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      <span>3D Flashcards & Quizzes</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                      <span>Context-Aware AI Tutor</span>
                    </div>
                  </div>
                </div>

                {/* Hero Right Mockup & Interactive Preview */}
                <div className="lg:col-span-5 relative">
                  <div className="relative z-10 p-6 rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        Interactive Note Preview
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {selectedNote.category}: {selectedNote.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{selectedNote.date}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedNote.content}
                      </p>

                      {/* AI Key Insights Box */}
                      <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Generated AI Insights</span>
                          </span>
                          <button
                            onClick={handleCopy}
                            className="text-[10px] text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1"
                          >
                            {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-700">
                          {selectedNote.insights.slice(0, 2).map((ins, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <span className="text-indigo-600 font-bold">•</span>
                              <span>{ins}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{selectedNote.retentionMetric}</span>
                        <button
                          onClick={() => setWorkspaceMode('studio')}
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Try In Studio</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Features Section */}
            <section id="features" className="pt-8 scroll-mt-24">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full border border-indigo-200">
                  Comprehensive Learning System
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  Everything You Need to Master Any Subject
                </h2>
                <p className="text-sm text-slate-600">
                  From raw notes to interactive active recall: TextTutor combines summarization, flashcards, quizzes, and grounded AI explanations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURE_LIST.map((feat, idx) => {
                  const IconComp = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                          {feat.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedFeatureModal(feat)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Learn details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setActivePreviewTab(feat.previewTab);
                            scrollToSection('product-preview');
                          }}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                        >
                          Preview view
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. How It Works */}
            <section id="how-it-works" className="pt-8 scroll-mt-24">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full border border-indigo-200">
                  How It Works
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  Four Steps to Effortless Retention
                </h2>
                <p className="text-sm text-slate-600">
                  Transform disorganized lecture notes and textbooks into an organized, interactive study system.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: '01', title: 'Add Notes', desc: 'Paste raw lecture text, upload documents, or type notes directly.', icon: BookOpen },
                  { step: '02', title: 'AI Analysis', desc: 'TextTutor extracts key definitions, structures, and main themes.', icon: Brain },
                  { step: '03', title: 'Generate Study Tools', desc: 'Auto-create 3D flashcards, summaries, and practice quizzes.', icon: Sparkles },
                  { step: '04', title: 'Active Recall', desc: 'Practice with spaced repetition loops and track your mastery.', icon: Award },
                ].map((st, i) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={i}
                      className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-indigo-600 font-mono">{st.step}</span>
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {st.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. Interactive Product Preview */}
            <section id="product-preview" className="pt-8 scroll-mt-24">
              <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full border border-indigo-200">
                  Interactive Showcase
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  Experience the TextTutor Interface
                </h2>
                <p className="text-sm text-slate-600">
                  Click through the tabs below to preview the core workspace modules.
                </p>
              </div>

              {/* Preview Tabs Bar */}
              <div className="flex justify-center mb-6">
                <div className="p-1.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-wrap gap-1.5">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'chat', label: 'AI Chat Assistant', icon: MessageSquare },
                    { id: 'notes', label: 'Notes & Summaries', icon: FileText },
                    { id: 'analytics', label: 'Study Analytics', icon: BarChart3 },
                  ].map((tb) => {
                    const TbIcon = tb.icon;
                    return (
                      <button
                        key={tb.id}
                        onClick={() => setActivePreviewTab(tb.id as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          activePreviewTab === tb.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <TbIcon className="w-3.5 h-3.5" />
                        <span>{tb.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Screen Content */}
              <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
                {activePreviewTab === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold">Welcome back, Scholar 👋</h3>
                        <p className="text-xs text-indigo-100">You have 3 active study tasks scheduled for today.</p>
                      </div>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">Active Streak 🔥</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="text-2xl font-black text-indigo-600">24</div>
                        <div className="text-xs font-semibold text-slate-600">Saved Study Notes</div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="text-2xl font-black text-cyan-600">142</div>
                        <div className="text-xs font-semibold text-slate-600">Mastered Flashcards</div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="text-2xl font-black text-emerald-600">92%</div>
                        <div className="text-xs font-semibold text-slate-600">Average Quiz Score</div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'chat' && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="p-3.5 rounded-xl bg-indigo-600 text-white text-xs max-w-sm ml-auto font-medium">
                      Can you explain quantum entanglement in simple terms using my physics notes?
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs max-w-sm space-y-1.5 text-slate-800">
                      <div className="font-bold text-indigo-600 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>TextTutor AI Tutor</span>
                      </div>
                      <p className="leading-relaxed">
                        Based on your Physics Notes: Quantum entanglement occurs when two particles become interconnected so that measuring one instantly determines the state of the other, regardless of distance.
                      </p>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'notes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notesList.slice(0, 2).map((n) => (
                      <div key={n.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{n.category}</span>
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{n.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activePreviewTab === 'analytics' && (
                  <div className="space-y-4 max-w-lg mx-auto">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                      <span>Weekly Retention Velocity</span>
                      <span className="text-emerald-600 font-semibold">+18% this week</span>
                    </div>
                    <div className="h-28 w-full bg-slate-50 border border-slate-200 rounded-xl flex items-end p-4 justify-between gap-3">
                      {[40, 60, 55, 80, 70, 95, 85].map((v, i) => (
                        <div key={i} style={{ height: `${v}%` }} className="flex-1 bg-indigo-600 rounded-t-sm" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 6. 100% Free Access Section */}
            <section id="free-access" className="pt-8 scroll-mt-24">
              <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                  100% Free Forever
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  Empowering Every Scholar, Everywhere
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  TextTutor is a completely free AI learning platform. No credit cards, no paywalls, and no hidden subscriptions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">Unlimited AI Summaries</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Transform lengthy lecture transcripts, research articles, and textbook chapters into clear key insights instantly.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <Check className="w-4 h-4" /> 100% Free Access
                  </div>
                </div>

                <div className="p-6 rounded-2xl border-2 border-indigo-500/40 bg-indigo-50/40 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3">
                      <Brain className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">Interactive Flashcards & Quizzes</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Master concepts faster with auto-generated flashcards, spaced repetition tracking, and custom multiple-choice quizzes.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-indigo-200/60 flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                    <Check className="w-4 h-4" /> Built-in Knowledge Testing
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold mb-3">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">24/7 Grounded AI Study Tutor</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ask questions and receive instant, context-aware answers grounded directly in your uploaded notes and study materials.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-cyan-600">
                    <Check className="w-4 h-4" /> Instant Study Assistance
                  </div>
                </div>
              </div>
            </section>

            {/* 7. FAQ Section */}
            <section id="faq" className="pt-8 scroll-mt-24 max-w-3xl mx-auto">
              <div className="text-center mb-8 space-y-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full border border-indigo-200">
                  FAQ
                </span>
                <h2 className="text-3xl font-black text-slate-900">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-3">
                {faqs.map((f, idx) => (
                  <div
                    key={idx}
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="p-5 rounded-xl border border-slate-200 bg-white transition-all cursor-pointer hover:border-slate-300"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-900">{f.q}</h3>
                      {openFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    {openFaq === idx && (
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed pt-3 border-t border-slate-100">
                        {f.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 8. High-Impact CTA Banner */}
            <section className="pt-8">
              <div className="p-8 sm:p-12 rounded-3xl bg-indigo-600 text-white text-center shadow-lg space-y-5">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
                  Ready to Study Smarter with TextTutor?
                </h2>
                <p className="text-sm text-indigo-100 max-w-xl mx-auto">
                  Transform your study materials into structured knowledge, flashcards, and quizzes today. 100% free with no credit card required.
                </p>
                <div className="pt-2">
                  <button
                    onClick={currentUser ? onNavigateDashboard : onNavigateRegister}
                    className="bg-white text-indigo-700 hover:bg-slate-100 px-7 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all inline-flex items-center gap-2 transform hover:scale-105"
                  >
                    <span>{currentUser ? 'Go to Dashboard' : 'Get Started Free'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Feature Details Modal (for all Learn More buttons) */}
      {selectedFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <selectedFeatureModal.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{selectedFeatureModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedFeatureModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedFeatureModal.desc}
            </p>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Key Capabilities:
              </span>
              <ul className="space-y-1.5">
                {selectedFeatureModal.detailedBenefits.map((b, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const tab = selectedFeatureModal.previewTab;
                  setSelectedFeatureModal(null);
                  setActivePreviewTab(tab);
                  scrollToSection('product-preview');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-700"
              >
                Preview Feature Tab
              </button>
              <button
                onClick={() => {
                  setSelectedFeatureModal(null);
                  if (currentUser) {
                    onNavigateDashboard();
                  } else {
                    onNavigateRegister();
                  }
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl text-white shadow-xs"
              >
                {currentUser ? 'Open in Dashboard' : 'Try Free'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer id="footer" className="border-t border-slate-200 py-12 mt-20 bg-white text-slate-600">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-3">
            <TextTutorLogo size={32} showText={true} textClassName="font-black text-slate-900 text-lg" />
            <p className="leading-relaxed text-slate-500">
              Study Smarter with TextTutor AI. Transform your study materials into structured knowledge, flashcards, and quizzes.
            </p>
          </div>

          <div>
            <div className="font-bold text-slate-900 uppercase tracking-wider mb-3">Product</div>
            <ul className="space-y-2 font-medium">
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-indigo-600 transition-colors">
                  AI Summaries
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-indigo-600 transition-colors">
                  3D Flashcards
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-indigo-600 transition-colors">
                  Quiz Engine
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('free-access')} className="hover:text-indigo-600 transition-colors">
                  100% Free Access
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-slate-900 uppercase tracking-wider mb-3">Workflow</div>
            <ul className="space-y-2 font-medium">
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-indigo-600 transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('product-preview')} className="hover:text-indigo-600 transition-colors">
                  Interactive Preview
                </button>
              </li>
              <li>
                <button onClick={() => setWorkspaceMode('studio')} className="hover:text-indigo-600 transition-colors">
                  Interactive Studio
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq')} className="hover:text-indigo-600 transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-slate-900 uppercase tracking-wider mb-3">Account</div>
            <ul className="space-y-2 font-medium">
              <li>
                <button onClick={onNavigateRegister} className="hover:text-indigo-600 transition-colors">
                  Create Free Account
                </button>
              </li>
              <li>
                <button onClick={onNavigateLogin} className="hover:text-indigo-600 transition-colors">
                  Sign In
                </button>
              </li>
              <li>
                <button onClick={currentUser ? onNavigateDashboard : onNavigateLogin} className="hover:text-indigo-600 transition-colors">
                  Dashboard
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
          <div>© 2026 TextTutor. All Rights Reserved.</div>
          <div className="flex gap-6">
            <span>Free & Open Study Companion</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
