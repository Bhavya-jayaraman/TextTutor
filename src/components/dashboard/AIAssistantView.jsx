/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
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
  Edit2,
  BookOpen,
  Filter,
  GraduationCap,
  Layers,
  ListChecks,
  ChevronRight,
  Info,
} from 'lucide-react';
import { clientConversationService } from '../../services/clientConversationService.js';
import { clientNotesService } from '../../services/clientNotesService.js';
import { clientDocumentService } from '../../services/clientDocumentService.js';

export const AIAssistantView = ({ user, theme }) => {
  const isDark = theme === 'dark';

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [sourcesMap, setSourcesMap] = useState({});
  const [editingConvId, setEditingConvId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');

  // RAG Context Selection State
  const [notesList, setNotesList] = useState([]);
  const [docsList, setDocsList] = useState([]);
  const [selectedFocus, setSelectedFocus] = useState({ type: 'all', id: null, label: 'All Library Materials' });
  const [activeCitationExcerpt, setActiveCitationExcerpt] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load available notes and documents for context filtering
  useEffect(() => {
    const loadContextMaterials = async () => {
      try {
        const [notesRes, docsRes] = await Promise.allSettled([
          clientNotesService.getAllNotes(),
          clientDocumentService.getDocuments(),
        ]);
        if (notesRes.status === 'fulfilled' && notesRes.value?.notes) {
          setNotesList(notesRes.value.notes);
        }
        if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
          setDocsList(docsRes.value);
        }
      } catch (e) {
        console.warn('Could not load materials for context dropdown:', e);
      }
    };
    loadContextMaterials();
  }, []);

  // Load all user conversations on mount
  const loadConversations = async (autoSelectFirst = true) => {
    setLoadingChats(true);
    try {
      const res = await clientConversationService.getAllConversations();
      if (res.success && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
        if (autoSelectFirst && res.conversations.length > 0 && !activeConversationId) {
          setActiveConversationId(res.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load message history when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      try {
        const res = await clientConversationService.getConversation(activeConversationId);
        if (res.success && Array.isArray(res.messages)) {
          setMessages(res.messages);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Could not load chat history for this conversation.');
      } finally {
        setLoadingMessages(false);
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

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this study conversation?')) return;

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
      setError('Failed to delete conversation.');
    }
  };

  const handleStartRename = (e, conv) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setRenameTitle(conv.title);
  };

  const handleSaveRename = async (e, convId) => {
    e.stopPropagation();
    if (!renameTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      const res = await clientConversationService.updateConversationTitle(convId, renameTitle.trim());
      if (res.success && res.conversation) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: res.conversation.title } : c))
        );
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    } finally {
      setEditingConvId(null);
    }
  };

  const handleSend = async (customPrompt) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : input;
    if (!textToSend.trim() || isTyping) return;

    const userText = textToSend.trim();
    setInput('');
    setError(null);
    setIsTyping(true);

    // Optimistic user message append
    const tempUserMsg = {
      id: Date.now(),
      conversation_id: activeConversationId || 0,
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const options = {};
      if (selectedFocus.type === 'note' && selectedFocus.id) {
        options.noteId = selectedFocus.id;
      } else if (selectedFocus.type === 'document' && selectedFocus.id) {
        options.documentId = selectedFocus.id;
      }

      const res = await clientConversationService.sendMessage(userText, activeConversationId || undefined, options);

      if (res.success) {
        const returnedConvId = res.conversationId;
        setActiveConversationId(returnedConvId);

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, res.userMessage, res.assistantMessage];
        });

        if (res.sources && res.sources.length > 0) {
          setSourcesMap((prev) => ({
            ...prev,
            [res.assistantMessage.id]: res.sources,
          }));
        }

        // Refresh conversation sidebar to update conversation title and updated timestamp
        loadConversations(false);
      } else {
        setError(res.message || 'Failed to receive response from AI tutor.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to reach AI study assistant. Please check connection and try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickStudyActions = [
    { label: 'Summarize Material', prompt: 'Summarize the core takeaways and main ideas from my study material.' },
    { label: 'Explain Key Concepts', prompt: 'Explain the key concepts and mechanisms in my notes step by step.' },
    { label: 'Generate Flashcards', prompt: 'Generate 5 high-yield active recall flashcard questions and answers from my material.' },
    { label: 'Create Practice Quiz', prompt: 'Create a practice multiple-choice quiz with 4 options to test my understanding.' },
    { label: 'Exam Prep Review', prompt: 'What are the likely high-stakes exam questions and key distinctions I need to master from these notes?' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme pb-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span>AI Study Assistant</span>
          </h1>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Context-grounded academic assistant answering questions directly from your saved study materials.
          </p>
        </div>

        <button
          onClick={handleNewChat}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs text-rose-300 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Chat Layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 rounded-2xl border ${isDark ? 'border-white/10 bg-[#0f172a]/40' : 'border-slate-200 bg-white'} overflow-hidden min-h-[640px]`}>
        {/* Left Sidebar: Conversations List */}
        <div className={`lg:col-span-1 border-r ${isDark ? 'border-white/10 bg-[#0b1329]' : 'border-slate-200 bg-slate-50/70'} p-4 flex flex-col`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)]">
              Sessions ({conversations.length})
            </span>
            <button
              onClick={() => loadConversations(false)}
              title="Refresh sessions"
              className="p-1 hover:bg-white/5 rounded text-[var(--text-dim)] hover:text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loadingChats && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-[var(--text-dim)]">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 px-2">
                <MessageSquare className="w-8 h-8 text-[var(--text-dim)] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[var(--text-dim)]">No study sessions yet.</p>
                <button
                  onClick={handleNewChat}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Start first session →
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversationId === conv.id;
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition text-left text-xs ${
                      isActive
                        ? isDark
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-white font-medium shadow-sm'
                          : 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium shadow-sm'
                        : isDark
                        ? 'hover:bg-white/5 text-slate-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-[var(--text-dim)]'}`} />
                      {isEditing ? (
                        <input
                          type="text"
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          onBlur={(e) => handleSaveRename(e, conv.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(e, conv.id);
                            if (e.key === 'Escape') setEditingConvId(null);
                          }}
                          autoFocus
                          className={`w-full px-2 py-0.5 rounded text-xs bg-slate-900 border border-indigo-500 text-white outline-none`}
                        />
                      ) : (
                        <span className="truncate">{conv.title || 'Untitled Session'}</span>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1">
                        <button
                          onClick={(e) => handleStartRename(e, conv)}
                          title="Rename"
                          className="p-1 hover:text-indigo-400 text-[var(--text-dim)] transition"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          title="Delete session"
                          className="p-1 hover:text-rose-400 text-[var(--text-dim)] transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Panel: Active Chat Stream & Input */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-[640px]">
          {/* Active Conversation Header & Context Filter */}
          <div className={`p-4 border-b ${isDark ? 'border-white/10 bg-[#0f172a]/60' : 'border-slate-200 bg-white'} flex flex-wrap items-center justify-between gap-3`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {conversations.find((c) => c.id === activeConversationId)?.title || 'Study Chat Session'}
                </h3>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Grounded in your notes & documents
                </span>
              </div>
            </div>

            {/* Context Scope Filter Dropdown */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Context:</span>
              </div>
              <select
                value={selectedFocus.type === 'all' ? 'all' : `${selectedFocus.type}:${selectedFocus.id}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    setSelectedFocus({ type: 'all', id: null, label: 'All Library Materials' });
                  } else {
                    const [type, idStr] = val.split(':');
                    const numId = Number(idStr);
                    if (type === 'note') {
                      const note = notesList.find((n) => n.id === numId);
                      setSelectedFocus({ type: 'note', id: numId, label: note ? note.title : `Note #${numId}` });
                    } else if (type === 'document') {
                      const doc = docsList.find((d) => d.id === numId);
                      setSelectedFocus({ type: 'document', id: numId, label: doc ? doc.fileName : `Doc #${numId}` });
                    }
                  }
                }}
                className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium transition cursor-pointer max-w-[220px] truncate ${
                  isDark
                    ? 'bg-slate-900 border-white/10 text-slate-200 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
                }`}
              >
                <option value="all">📚 All Notes & Documents</option>
                {docsList.length > 0 && (
                  <optgroup label="Uploaded Documents">
                    {docsList.map((d) => (
                      <option key={`doc-${d.id}`} value={`document:${d.id}`}>
                        📄 {d.fileName} ({d.pageCount || 1}p)
                      </option>
                    ))}
                  </optgroup>
                )}
                {notesList.length > 0 && (
                  <optgroup label="Study Notes">
                    {notesList.map((n) => (
                      <option key={`note-${n.id}`} value={`note:${n.id}`}>
                        📝 {n.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Quick Study Action Pills Bar */}
          <div className={`px-4 py-2 border-b text-xs flex items-center gap-2 overflow-x-auto scrollbar-none ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50/80 border-slate-100'}`}>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 shrink-0">Quick Study:</span>
            {quickStudyActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(action.prompt)}
                disabled={isTyping}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 transition cursor-pointer disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {loadingMessages ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-dim)] space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading study session messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    How can I assist your studies today?
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mt-1.5 leading-relaxed">
                    Ask questions, request summaries, or test your comprehension. I ground all explanations in your actual uploaded notes and documents.
                  </p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)] block text-left">
                    Suggested study prompts:
                  </span>
                  {quickStudyActions.slice(0, 3).map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action.prompt)}
                      className={`w-full text-left p-3 rounded-xl text-xs border transition flex items-center justify-between ${
                        isDark
                          ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-medium">"{action.prompt}"</span>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const sources = sourcesMap[msg.id];

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-sm'
                          : isDark
                          ? 'bg-slate-800 border border-white/10 text-indigo-400'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className="space-y-2 max-w-[85%]">
                      <div
                        className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : isDark
                            ? 'bg-[#1e293b]/70 border border-white/10 text-slate-200 rounded-tl-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Rich Citation Chips */}
                        {sources && sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-1.5">
                            <span className="text-[10px] text-[var(--text-dim)] font-semibold uppercase tracking-wider flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-indigo-400" />
                              Grounding Citations ({sources.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {sources.map((src, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setActiveCitationExcerpt(src)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 transition cursor-pointer"
                                  title="Click to view extracted excerpt"
                                >
                                  <FileText className="w-3 h-3 text-indigo-500" />
                                  <span>{src.title || src.fileName || 'Source Document'}</span>
                                  {src.pageNumber && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-200/60 dark:bg-indigo-800 text-[10px] font-semibold">
                                      p. {src.pageNumber}
                                    </span>
                                  )}
                                  {src.sectionHeading && (
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] truncate max-w-[120px]">
                                      § {src.sectionHeading}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      {!isUser && (
                        <div className="flex items-center gap-2 pl-1">
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-[var(--text-dim)] hover:text-white transition cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy answer</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 mr-auto max-w-xl">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-slate-800 border border-white/10 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div
                  className={`p-3.5 rounded-2xl rounded-tl-none border text-xs flex items-center gap-2 ${
                    isDark ? 'bg-[#1e293b]/70 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Searching indexed chunks & synthesizing study response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sticky Bottom Input Bar */}
          <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-[#0f172a]/80' : 'border-slate-200 bg-white'}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-3"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask anything about ${selectedFocus.label} (Enter to send, Shift+Enter for newline)...`}
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl text-xs resize-none outline-none transition border ${
                    isDark
                      ? 'bg-slate-900/90 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`p-3 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 ${
                  input.trim() && !isTyping
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    : isDark
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Citation Excerpt Modal */}
      {activeCitationExcerpt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                <span>{activeCitationExcerpt.title || activeCitationExcerpt.fileName || 'Source Material'}</span>
              </div>
              <button
                onClick={() => setActiveCitationExcerpt(null)}
                className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
            <div className="py-4 space-y-2 text-xs">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
                {activeCitationExcerpt.pageNumber && (
                  <span>Page: {activeCitationExcerpt.pageNumber}</span>
                )}
                {activeCitationExcerpt.sectionHeading && (
                  <span>Section: {activeCitationExcerpt.sectionHeading}</span>
                )}
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {activeCitationExcerpt.excerpt || 'No specific excerpt text available.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantView;
