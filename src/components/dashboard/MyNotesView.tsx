/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  Tag,
  Folder,
  ArrowUpDown,
  Filter,
  AlertCircle,
  Copy,
  CheckCircle2,
  X,
  Loader2,
  BookOpen,
  Layers,
  HelpCircle,
  MessageSquare,
  Download,
  Grid,
  List as ListIcon,
  Clock,
  Calendar,
  FileCheck2,
  ArrowUpRight,
} from 'lucide-react';
import { Note } from '../../types/notes.js';
import { ThemeMode } from '../../types/dashboard.js';
import { clientNotesService } from '../../services/clientNotesService.js';
import { DocumentWorkspaceModal, WorkspaceTab } from './DocumentWorkspaceModal.js';

interface MyNotesViewProps {
  theme: ThemeMode;
  initialSearchQuery?: string;
  onNotesUpdated?: (notes: Note[]) => void;
}

export type SortOption = 'newest' | 'oldest' | 'updated' | 'alphabetical';
export type DisplayViewMode = 'grid' | 'list';

export const MyNotesView: React.FC<MyNotesViewProps> = ({
  theme,
  initialSearchQuery = '',
  onNotesUpdated,
}) => {
  const isDark = theme === 'dark';

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters, Sorting, and Layout
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<DisplayViewMode>('grid');

  // Workspace & Modals state
  const [workspaceNote, setWorkspaceNote] = useState<Note | null>(null);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<WorkspaceTab>('overview');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState<boolean>(false);

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Computer Science');
  const [formContent, setFormContent] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Notes
  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientNotesService.getAllNotes();
      if (response.success && response.notes) {
        setNotes(response.notes);
        if (onNotesUpdated) {
          onNotesUpdated(response.notes);
        }
      } else {
        setError(response.message || 'Failed to load document notes.');
      }
    } catch (err: any) {
      console.error('Fetch notes error:', err);
      setError(err.response?.data?.message || 'Network error occurred while fetching document notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Derived Categories & Tags
  const categories = useMemo(() => {
    const cats = Array.from(new Set(notes.map((n) => n.category || 'General')));
    return ['All', ...cats];
  }, [notes]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => tagSet.add(t));
      }
    });
    return ['All', ...Array.from(tagSet)];
  }, [notes]);

  // Filter & Sort
  const filteredAndSortedNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          note.title.toLowerCase().includes(query) ||
          note.category.toLowerCase().includes(query) ||
          (note.tags && note.tags.some((t) => t.toLowerCase().includes(query)));

        const matchesCategory =
          selectedCategory === 'All' || note.category === selectedCategory;

        const matchesTag =
          selectedTag === 'All' ||
          (note.tags && note.tags.includes(selectedTag));

        return matchesSearch && matchesCategory && matchesTag;
      })
      .sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }

        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === 'updated') {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        } else if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [notes, searchQuery, selectedCategory, selectedTag, sortBy]);

  // Open Workspace with Specific Tab
  const handleOpenWorkspace = (note: Note, tab: WorkspaceTab = 'overview') => {
    setWorkspaceNote(note);
    setWorkspaceInitialTab(tab);
    setIsWorkspaceOpen(true);
  };

  // Toggle Pin
  const handleTogglePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    try {
      const res = await clientNotesService.togglePin(note.id, note.is_pinned);
      if (res.success && res.note) {
        const updated = notes.map((n) => (n.id === note.id ? res.note! : n));
        setNotes(updated);
        if (onNotesUpdated) onNotesUpdated(updated);
        showToast('success', res.note.is_pinned ? 'Document pinned to top' : 'Document unpinned');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update pin status');
    }
  };

  // Download Note as Text File
  const handleDownloadNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const blob = new Blob([`TITLE: ${note.title}\nCATEGORY: ${note.category}\nTAGS: ${(note.tags || []).join(', ')}\n\nCONTENT:\n${note.content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', `Downloaded "${note.title}.txt"`);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormTitle('');
    setFormCategory('Computer Science');
    setFormContent('');
    setFormTags('');
    setFormIsPinned(false);
    setIsCreateOpen(true);
  };

  // Create Note Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('error', 'Title and Content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await clientNotesService.createNote({
        title: formTitle,
        category: formCategory,
        content: formContent,
        tags: tagsArray,
        is_pinned: formIsPinned,
      });

      if (res.success && res.note) {
        const updated = [res.note, ...notes];
        setNotes(updated);
        if (onNotesUpdated) onNotesUpdated(updated);
        setIsCreateOpen(false);
        showToast('success', 'Document created successfully!');
      } else {
        showToast('error', res.message || 'Failed to create document');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Error creating document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Note
  const handleOpenEdit = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setEditingNote(note);
    setFormTitle(note.title);
    setFormCategory(note.category);
    setFormContent(note.content);
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setFormIsPinned(note.is_pinned);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('error', 'Title and Content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await clientNotesService.updateNote(editingNote.id, {
        title: formTitle,
        category: formCategory,
        content: formContent,
        tags: tagsArray,
        is_pinned: formIsPinned,
      });

      if (res.success && res.note) {
        const updated = notes.map((n) => (n.id === editingNote.id ? res.note! : n));
        setNotes(updated);
        if (onNotesUpdated) onNotesUpdated(updated);
        setEditingNote(null);
        showToast('success', 'Document updated successfully!');
      } else {
        showToast('error', res.message || 'Failed to update document');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Error updating document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Note
  const handleConfirmDelete = (e: React.MouseEvent, noteId: number) => {
    e.stopPropagation();
    setDeletingNoteId(noteId);
  };

  const handleDeleteExecute = async () => {
    if (!deletingNoteId) return;
    setIsSubmitting(true);
    try {
      const res = await clientNotesService.deleteNote(deletingNoteId);
      if (res.success) {
        const updated = notes.filter((n) => n.id !== deletingNoteId);
        setNotes(updated);
        if (onNotesUpdated) onNotesUpdated(updated);
        showToast('success', 'Document deleted successfully');
      } else {
        showToast('error', res.message || 'Failed to delete document');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Error deleting document');
    } finally {
      setIsSubmitting(false);
      setDeletingNoteId(null);
    }
  };

  // Helper function for icon colors based on subject/category
  const getSubjectStyle = (category: string = 'General') => {
    const cat = category.toLowerCase();
    if (cat.includes('computer') || cat.includes('code') || cat.includes('tech')) {
      return {
        gradient: 'from-[#6366F1] via-indigo-600 to-[#06B6D4]',
        badgeBg: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
        iconColor: 'text-indigo-400',
      };
    } else if (cat.includes('physics') || cat.includes('math')) {
      return {
        gradient: 'from-[#06B6D4] via-cyan-600 to-blue-600',
        badgeBg: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
        iconColor: 'text-cyan-400',
      };
    } else if (cat.includes('bio') || cat.includes('med') || cat.includes('life')) {
      return {
        gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
        badgeBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
        iconColor: 'text-emerald-400',
      };
    } else if (cat.includes('history') || cat.includes('art') || cat.includes('lit')) {
      return {
        gradient: 'from-amber-500 via-orange-600 to-rose-600',
        badgeBg: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        iconColor: 'text-amber-400',
      };
    }
    return {
      gradient: 'from-purple-500 via-indigo-600 to-blue-600',
      badgeBg: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
      iconColor: 'text-purple-400',
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className={`text-2xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>Notes & Document Management</span>
            <span className="text-xs px-3 py-1 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#6366F1] dark:text-indigo-300 font-mono font-bold">
              {notes.length} Documents
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Google Drive style document hub. Click any document card to enter its AI Study Workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / List View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#1e293b] text-[#6366F1] shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Table List View"
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#1e293b] text-[#6366F1] shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-[#6366F1] via-indigo-600 to-[#06B6D4] hover:opacity-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Document</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchNotes} className="underline text-rose-300 font-semibold hover:text-white">
            Retry
          </button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by file name, subject, or AI tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                isDark
                  ? 'bg-[#1e293b] border border-white/10 text-white placeholder-slate-500'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Subject / Category */}
          <div className="md:col-span-3 flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#6366F1] shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                isDark
                  ? 'bg-[#1e293b] border border-white/10 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-900'
              }`}
            >
              <option value="All">All Subjects</option>
              {categories
                .filter((c) => c !== 'All')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          {/* Filter AI Tags */}
          <div className="md:col-span-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#6366F1] shrink-0" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                isDark
                  ? 'bg-[#1e293b] border border-white/10 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-900'
              }`}
            >
              <option value="All">All AI Tags</option>
              {allTags
                .filter((t) => t !== 'All')
                .map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[#6366F1] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={`w-full px-3 py-2 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                isDark
                  ? 'bg-[#1e293b] border border-white/10 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-900'
              }`}
            >
              <option value="newest">Newest Uploads</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Opened</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border animate-pulse space-y-4 ${
                isDark ? 'bg-[#0f172a] border-white/5' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="w-16 h-5 rounded-full bg-white/10" />
              </div>
              <div className="w-3/4 h-5 rounded bg-white/10" />
              <div className="flex gap-2">
                <div className="w-16 h-4 rounded bg-white/5" />
                <div className="w-20 h-4 rounded bg-white/5" />
              </div>
              <div className="w-full h-9 rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedNotes.length === 0 ? (
        /* Empty State */
        <div
          className={`p-12 text-center rounded-2xl border flex flex-col items-center justify-center space-y-4 ${
            isDark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1]">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No documents found.
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'All' || selectedTag !== 'All'
                ? 'No documents match your current filter criteria.'
                : 'Upload your lecture documents, study notes, or PDFs to access AI summaries, flashcards, and quizzes.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-[#6366F1] hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GOOGLE DRIVE / NOTION CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedNotes.map((note) => {
            const subjectStyle = getSubjectStyle(note.category);
            const wordCount = note.content.trim().split(/\s+/).filter(Boolean).length;
            const estimatedPages = Math.max(1, Math.ceil(note.content.length / 1500));
            const readingTime = Math.max(1, Math.ceil(wordCount / 200));

            return (
              <div
                key={note.id}
                onClick={() => handleOpenWorkspace(note, 'overview')}
                className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group relative hover:-translate-y-1.5 hover:shadow-xl ${
                  note.is_pinned
                    ? isDark
                      ? 'bg-[#1e293b]/90 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                      : 'bg-indigo-50/50 border-indigo-300'
                    : isDark
                    ? 'bg-[#0f172a] border-white/10 hover:border-white/25'
                    : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header: Icon + Category + Pin */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${subjectStyle.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                      >
                        <FileText className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${subjectStyle.badgeBg}`}>
                          {note.category || 'General'}
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-500 font-semibold">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Processed</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleTogglePin(e, note)}
                      title={note.is_pinned ? 'Unpin document' : 'Pin document'}
                      className={`p-2 rounded-xl border transition-all ${
                        note.is_pinned
                          ? 'bg-[#6366F1] border-[#6366F1] text-white'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {/* Document Title (NO RAW TEXT!) */}
                  <h3 className={`text-base font-extrabold mb-3 line-clamp-2 leading-snug group-hover:text-[#6366F1] transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {note.title}
                  </h3>

                  {/* Document Metadata Badges */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-medium ${
                        isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#6366F1]" />
                      <span>{estimatedPages} Pages</span>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-medium ${
                        isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>{readingTime} min read</span>
                    </div>
                  </div>

                  {/* AI Tags Chips */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${
                            isDark
                              ? 'bg-[#1e293b] border-white/10 text-slate-300'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Uploaded {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span>Updated {new Date(note.updated_at || note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* CARD ACTION BUTTONS */}
                <div className="space-y-2 pt-1">
                  {/* Primary CTA: Open Workspace */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenWorkspace(note, 'overview');
                    }}
                    className="w-full bg-gradient-to-r from-[#6366F1] via-indigo-600 to-[#06B6D4] text-white text-xs font-bold py-2.5 rounded-2xl shadow-md hover:shadow-indigo-500/30 flex items-center justify-center gap-1.5 transition-all group-hover:scale-[1.01]"
                  >
                    <span>Open Workspace</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  {/* Secondary Quick Action Bar */}
                  <div className="grid grid-cols-6 gap-1 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkspace(note, 'ai-summary');
                      }}
                      title="AI Summary"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/20 hover:text-[#6366F1] flex items-center justify-center transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkspace(note, 'flashcards');
                      }}
                      title="Flashcards"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 flex items-center justify-center transition-all"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkspace(note, 'quiz');
                      }}
                      title="Quiz"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 flex items-center justify-center transition-all"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkspace(note, 'ask-ai');
                      }}
                      title="Chat with AI"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                    </button>

                    <button
                      onClick={(e) => handleDownloadNote(e, note)}
                      title="Download"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-cyan-500/20 hover:text-[#06B6D4] flex items-center justify-center transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-[#06B6D4]" />
                    </button>

                    <button
                      onClick={(e) => handleConfirmDelete(e, note.id)}
                      title="Delete"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* NOTION / GOOGLE DRIVE TABLE LIST VIEW */
        <div
          className={`rounded-3xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`text-[11px] font-extrabold uppercase tracking-wider border-b ${
                    isDark ? 'bg-[#1e293b]/60 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <th className="p-4 pl-6">Document Name</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Pages & Reading</th>
                  <th className="p-4">AI Status</th>
                  <th className="p-4">Upload Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-xs">
                {filteredAndSortedNotes.map((note) => {
                  const estimatedPages = Math.max(1, Math.ceil(note.content.length / 1500));
                  const wordCount = note.content.trim().split(/\s+/).filter(Boolean).length;
                  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

                  return (
                    <tr
                      key={note.id}
                      onClick={() => handleOpenWorkspace(note, 'overview')}
                      className={`hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                        note.is_pinned ? (isDark ? 'bg-indigo-500/10' : 'bg-indigo-50/50') : ''
                      }`}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#6366F1]/15 text-[#6366F1] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {note.title}
                            </p>
                            {note.tags && note.tags.length > 0 && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                #{note.tags.join(' #')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#6366F1]/15 text-[#6366F1] dark:text-indigo-300 border border-[#6366F1]/30">
                          {note.category || 'General'}
                        </span>
                      </td>

                      <td className="p-4 font-medium text-slate-500 dark:text-slate-300">
                        {estimatedPages} Pages ({readingTime} min)
                      </td>

                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <Sparkles className="w-3 h-3" />
                          <span>AI Ready</span>
                        </span>
                      </td>

                      <td className="p-4 text-slate-400">
                        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWorkspace(note, 'overview');
                            }}
                            className="bg-[#6366F1] hover:bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs"
                          >
                            Open Workspace
                          </button>
                          <button
                            onClick={(e) => handleConfirmDelete(e, note.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCUMENT WORKSPACE MODAL */}
      {workspaceNote && (
        <DocumentWorkspaceModal
          note={workspaceNote}
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
          theme={theme}
          initialTab={workspaceInitialTab}
        />
      )}

      {/* CREATE DOCUMENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-bold flex items-center gap-2 text-[#6366F1]">
                <Plus className="w-5 h-5" />
                <span>Upload or Add New Document</span>
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Machine Learning Concepts & Neural Nets"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                    isDark
                      ? 'bg-[#1e293b] border border-white/10 text-white placeholder-slate-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Subject / Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                      isDark
                        ? 'bg-[#1e293b] border border-white/10 text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Biology">Biology & Neuroscience</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="History">History</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ai, neural, algorithms"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] ${
                      isDark
                        ? 'bg-[#1e293b] border border-white/10 text-white placeholder-slate-500'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Document Content / Extracted Text *
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste or type document text here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className={`w-full p-3.5 rounded-xl text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] resize-none ${
                    isDark
                      ? 'bg-[#1e293b] border border-white/10 text-white placeholder-slate-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createIsPinned"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded accent-[#6366F1] w-4 h-4"
                />
                <label htmlFor="createIsPinned" className="text-xs text-slate-300 font-medium">
                  Pin this document to top of library
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Document...</span>
                    </>
                  ) : (
                    <span>Save Document</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingNoteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Delete Document</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove this document from your Notes library?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingNoteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteExecute}
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
