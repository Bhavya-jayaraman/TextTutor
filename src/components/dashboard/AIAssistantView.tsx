/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  FileText,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ThemeMode } from '../../types/dashboard.js';
import { User } from '../../types/auth.js';
import {
  clientConversationService,
  Conversation,
  ChatMessage,
} from '../../services/clientConversationService.js';

interface AIAssistantViewProps {
  user: User;
  theme: ThemeMode;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ user, theme }) => {
  const isDark = theme === 'dark';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [sourcesMap, setSourcesMap] = useState<Record<number, Array<{ id: number; title: string; category: string }>>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load user conversations on mount
  const loadConversations = async () => {
    setLoadingChats(true);
    try {
      const res = await clientConversationService.getAllConversations();
      if (res.success && res.conversations) {
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !activeConversationId) {
          setActiveConversationId(res.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const res = await clientConversationService.getConversation(activeConversationId);
        if (res.success && res.messages) {
          setMessages(res.messages);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    loadMessages();
  }, [activeConversationId]);

  const handleNewChat = async () => {
    setError(null);
    try {
      const res = await clientConversationService.createConversation('New Study Chat');
      if (res.success && res.conversation) {
        setConversations((prev) => [res.conversation, ...prev]);
        setActiveConversationId(res.conversation.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error creating new conversation:', err);
      setError('Failed to start a new chat session.');
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const res = await clientConversationService.deleteConversation(id);
      if (res.success) {
        const updated = conversations.filter((c) => c.id !== id);
        setConversations(updated);
        if (activeConversationId === id) {
          setActiveConversationId(updated.length > 0 ? updated[0].id : null);
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    setError(null);
    setIsTyping(true);

    // Optimistic user message append
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: activeConversationId || 0,
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await clientConversationService.sendMessage(userText, activeConversationId || undefined);

      if (res.success) {
        setActiveConversationId(res.conversationId);
        setMessages((prev) => {
          // Replace temp or ensure accurate server messages
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, res.userMessage, res.assistantMessage];
        });

        if (res.sources && res.sources.length > 0) {
          setSourcesMap((prev) => ({
            ...prev,
            [res.assistantMessage.id]: res.sources || [],
          }));
        }

        // Refresh conversation list titles if newly created
        loadConversations();
      } else {
        setError(res.message || 'Failed to receive AI response.');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError('Failed to get answer from AI. Please check your network connection.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span>AI Study Chat Assistant</span>
          </h1>
          <p className="text-xs text-[var(--text-dim)]">
            Context-aware academic assistant answering questions directly using your saved notes repository.
          </p>
        </div>

        <button
          onClick={handleNewChat}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Grid Layout: Conversation List & Active Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar: Conversations List (4 cols) */}
        <div
          className={`lg:col-span-4 p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-theme">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Saved Conversations ({conversations.length})</span>
            </span>
          </div>

          {loadingChats ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2 text-[var(--text-dim)] text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Loading chat history...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
              <p className="text-xs text-[var(--text-dim)]">No conversations found.</p>
              <button
                onClick={handleNewChat}
                className="text-xs text-indigo-400 underline font-semibold"
              >
                Start your first study chat
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {conversations.map((c) => {
                const isActive = c.id === activeConversationId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-indigo-500/20 border-indigo-500/60 text-white font-medium shadow-xs'
                        : isDark
                        ? 'bg-surface/50 border-theme text-slate-300 hover:bg-white/5'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <p className="truncate font-semibold">{c.title}</p>
                      <p className="text-[10px] text-[var(--text-dim)] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
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

                    <button
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      title="Delete chat"
                      className="p-1.5 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Chat Window (8 cols) */}
        <div
          className={`lg:col-span-8 p-6 rounded-2xl border flex flex-col justify-between min-h-[520px] max-h-[620px] ${
            isDark ? 'bg-surface border-theme' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          {/* Suggested Prompts Header Bar */}
          <div className="pb-3 border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Quick Prompts:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                'Explain key concepts in my notes',
                'What is the formula for entropy?',
                'Summarize Raft protocol',
              ].map((promptText, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => setInput(promptText)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                    isDark
                      ? 'bg-[#050505] border-white/10 text-slate-300 hover:border-[#818cf8] hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Body */}
          <div className="py-4 overflow-y-auto space-y-4 flex-1 pr-1">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#818cf8]/20 border border-[#818cf8]/40 flex items-center justify-center text-[#818cf8]">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Welcome to TextTutor AI Chat
                  </h3>
                  <p className="text-xs text-[#94a3b8] max-w-md">
                    Ask any question about your study material. TextTutor will search your notes and formulate a context-aware explanation.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const sources = sourcesMap[msg.id];

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-[#818cf8]/20 border border-[#818cf8]/40 flex items-center justify-center text-[#818cf8] shrink-0 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className="space-y-1 max-w-[85%]">
                      <div
                        className={`p-4 rounded-2xl text-xs leading-relaxed border relative group ${
                          isUser
                            ? 'bg-[#818cf8] text-white border-transparent shadow-[0_0_15px_rgba(129,140,248,0.3)]'
                            : isDark
                            ? 'bg-[#050505] border-white/10 text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {!isUser && (
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 hover:text-white flex items-center gap-1"
                          >
                            {copiedId === msg.id ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Cited Note Sources */}
                      {!isUser && sources && sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-[#94a3b8] font-bold flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5 text-[#818cf8]" />
                            <span>Notes Referenced:</span>
                          </span>
                          {sources.map((src) => (
                            <span
                              key={src.id}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#818cf8]/15 border border-[#818cf8]/30 text-[#818cf8] font-medium"
                            >
                              {src.title}
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className={`text-[10px] text-[#94a3b8] font-mono ${
                          isUser ? 'text-right' : 'text-left'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-1 shadow-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs border flex items-center gap-2 ${
                    isDark ? 'bg-surface/80 border-theme text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200" />
                  <span>Searching your notes & generating response...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="underline font-semibold text-rose-200 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="pt-3 border-t border-theme flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about your study notes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`flex-1 px-4 py-3 rounded-xl text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-surface/80 border border-theme text-white placeholder-slate-500'
                  : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2 disabled:opacity-50"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
