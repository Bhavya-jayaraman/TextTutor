/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Sparkles, Quote, Calendar, Flame } from 'lucide-react';
import { User } from '../../types/auth.js';
import { ThemeMode } from '../../types/dashboard.js';

interface WelcomeSectionProps {
  user: User;
  theme: ThemeMode;
  streakDays?: number;
}

const MOTIVATIONAL_QUOTES = [
  {
    quote: "The beautiful thing about learning is that nobody can take it away from you.",
    author: "B.B. King",
  },
  {
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
  {
    quote: "Investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    quote: "Knowledge is power. Information is liberating.",
    author: "Kofi Annan",
  },
  {
    quote: "Education is not the learning of facts, but the training of the mind to think.",
    author: "Albert Einstein",
  },
];

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  user,
  theme,
  streakDays = 7,
}) => {
  const isDark = theme === 'dark';

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const randomQuote = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  }, []);

  return (
    <div className="rounded-[30px] p-6 sm:p-10 relative overflow-hidden bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4] text-white shadow-2xl min-h-[260px] flex flex-col justify-between">
      {/* Decorative Glow Circles */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 right-32 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {/* Header Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>AI Learning Platform</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-400/25 backdrop-blur-md border border-amber-300/40 rounded-full text-amber-100 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>{streakDays} Day Study Streak</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayFormatted}</span>
            </span>
          </div>

          {/* Welcome Greeting */}
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back, {user.name} 👋
          </h1>
          <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed max-w-xl">
            Supercharge your study sessions with AI summaries, interactive 3D flashcards, and personalized knowledge quizzes.
          </p>

          {/* Motivational Learning Quote */}
          <div className="pt-2">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-start gap-3">
              <Quote className="w-4 h-4 text-cyan-200 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5 text-white/90">
                <p className="italic font-serif leading-relaxed">
                  "{randomQuote.quote}"
                </p>
                <p className="text-[11px] font-bold text-cyan-200">
                  — {randomQuote.author}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Learning Illustration Badge */}
        <div className="hidden lg:flex items-center justify-center shrink-0">
          <div className="relative w-44 h-44 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/25 p-6 flex flex-col items-center justify-center text-center shadow-2xl space-y-3 transform hover:rotate-2 transition-transform">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-300 flex items-center justify-center shadow-lg text-slate-900">
              <Sparkles className="w-8 h-8 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider uppercase text-cyan-200">TextTutor AI</div>
              <div className="text-[11px] text-white/80 font-medium">Smart Synthesis Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
