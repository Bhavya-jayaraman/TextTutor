/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { MessageSquare, Sparkles, ArrowRight, Clock, Bot, Plus } from 'lucide-react';
import { DashboardView, ThemeMode } from '../../types/dashboard.js';
import { clientConversationService, Conversation } from '../../services/clientConversationService.js';

interface RecentAIConversationsProps {
  theme: ThemeMode;
  onNavigateView: (view: DashboardView) => void;
}

export const RecentAIConversations: React.FC<RecentAIConversationsProps> = ({
  theme,
  onNavigateView,
}) => {
  const isDark = theme === 'dark';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChats() {
      try {
        const res = await clientConversationService.getAllConversations();
        if (res.success && res.conversations) {
          setConversations(res.conversations.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed loading recent conversations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadChats();
  }, []);

  return (
    <div
      className={`p-6 rounded-[24px] border transition-all h-full flex flex-col justify-between ${
        isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200/80 shadow-xs'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recent AI Conversations
              </h2>
              <p className="text-xs text-[var(--text-dim)]">Interactive study chat history</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateView('ai-assistant')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <span>Open Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--text-dim)]">
            Loading recent AI chats...
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <Bot className="w-10 h-10 text-indigo-400 opacity-40 mx-auto" />
            <p className="text-xs text-[var(--text-dim)]">No saved AI chats yet.</p>
            <button
              onClick={() => onNavigateView('ai-assistant')}
              className="px-4 py-2 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold hover:bg-indigo-500/25 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start First Study Chat</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigateView('ai-assistant')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${
                  isDark
                    ? 'bg-slate-900/50 border-white/5 hover:border-indigo-500/40 hover:bg-white/5'
                    : 'bg-slate-50 border-slate-200/80 hover:border-indigo-300 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold truncate group-hover:text-indigo-400 transition-colors ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {c.title || 'Untitled Study Chat'}
                    </h4>
                    <p className="text-[11px] text-[var(--text-dim)] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>
                        {new Date(c.updated_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/15 px-2.5 py-1 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
                  Continue
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
