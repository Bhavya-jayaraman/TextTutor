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
  CheckCircle2,
  X,
  BookOpen,
  Download,
  Grid,
  List as ListIcon,
  Clock,
  Calendar,
  Upload,
} from 'lucide-react';
import { clientNotesService } from '../../services/clientNotesService.js';
import { UploadNoteModal } from './UploadNoteModal.jsx';
import { DocumentWorkspaceModal } from './DocumentWorkspaceModal.js';

export const MyNotesView = ({
  theme = 'light',
  initialSearchQuery = '',
  onNotesUpdated,
}) => {
  const isDark = theme === 'dark';

  // Notes state
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters, Sorting, and Layout
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  // Workspace modal
  const [workspaceNote, setWorkspaceNote] = useState(null);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState('overview');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type, text) => {
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
        setError(response.message || 'Failed to load study materials.');
      }
    } catch (err) {
      console.error('Fetch notes error:', err);
      setError(err.response?.data?.message || 'Unable to connect to the TextTutor API. Please ensure the backend is running.');
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
    const tagSet = new Set();
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
          (note.title && note.title.toLowerCase().includes(query)) ||
          (note.category && note.category.toLowerCase().includes(query)) ||
          (note.content && note.content.toLowerCase().includes(query)) ||
          (note.tags && note.tags.some((t) => t.toLowerCase().includes(query)));

        const matchesCategory =
          selectedCategory === 'All' || note.category === selectedCategory;

        const matchesTag =
          selectedTag === 'All' ||
          (note.tags && note.tags.includes(selectedTag));

        return matchesSearch && matchesCategory && matchesTag;
      })
      .sort((a, b) => {
        if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
          return a.is_pinned ? -1 : 1;
        }

        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        if (sortBy === 'alphabetical') return (a.title || '').localeCompare(b.title || '');
        return dateB - dateA;
      });
  }, [notes, searchQuery, selectedCategory, selectedTag, sortBy]);

  // Open Workspace
  const handleOpenWorkspace = (note, tab = 'overview') => {
    setWorkspaceNote(note);
    setWorkspaceInitialTab(tab);
    setIsWorkspaceOpen(true);
  };

  // Toggle Pin
  const handleTogglePin = async (e, note) => {
    e.stopPropagation();
    try {
      const res = await clientNotesService.togglePin(note.id);
      if (res.success && res.note) {
        const updated = notes.map((n) => (n.id === note.id ? res.note : n));
        setNotes(updated);
        if (onNotesUpdated) onNotesUpdated(updated);
        showToast('success', res.note.is_pinned ? 'Material pinned to top' : 'Material unpinned');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update pin status');
    }
  };

  // Download Note
  const handleDownloadNote = (e, note) => {
    e.stopPropagation();
    const blob = new Blob(
      [`TITLE: ${note.title}\nCATEGORY: ${note.category}\nTAGS: ${(note.tags || []).join(', ')}\n\nCONTENT:\n${note.content}`],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(note.title || 'study_note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', `Downloaded "${note.title}.txt"`);
  };

  // Create Note
  const handleOpenCreate = () => {
    setFormTitle('');
    setFormCategory('General');
    setFormContent('');
    setFormTags('');
    setFormIsPinned(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('error', 'Title and content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await clientNotesService.createNote({
        title: formTitle.trim(),
        category: formCategory.trim() || 'General',
        content: formContent.trim(),
        tags: tagsArray,
        is_pinned: formIsPinned,
      });

      if (res.success && res.note) {
        const updated = [res.note, ...notes];
        setNotes(updated);
        if (onNotesUpdated) onNotesUpdated(updated);
        setIsCreateOpen(false);
        showToast('success', 'Study note created successfully!');
      } else {
        showToast('error', res.message || 'Failed to create note');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error creating note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Note
  const handleOpenEdit = (e, note) => {
    e.stopPropagation();
    setEditingNote(note);
    setFormTitle(note.title || '');
    setFormCategory(note.category || 'General');
    setFormContent(note.content || '');
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setFormIsPinned(Boolean(note.is_pinned));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingNote) return;
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('error', 'Title and content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await clientNotesService.updateNote(editingNote.id, {
        title: formTitle.trim(),
        category: formCategory.trim() || 'General',
        content: formContent.trim(),
        tags: tagsArray,
        is_pinned: formIsPinned,
      });

      if (res.success && res.note) {
        const updated = notes.map((n) => (n.id === editingNote.id ? res.note : n));
        setNotes(updated);
        if (onNotesUpdated) onNotesUpdated(updated);
        setEditingNote(null);
        showToast('success', 'Note updated successfully!');
      } else {
        showToast('error', res.message || 'Failed to update note');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error updating note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id) => {
    try {
      const res = await clientNotesService.deleteNote(id);
      if (res.success) {
        const updated = notes.filter((n) => n.id !== id);
        setNotes(updated);
        if (onNotesUpdated) onNotesUpdated(updated);
        setDeletingNoteId(null);
        showToast('success', 'Note deleted from library');
      } else {
        showToast('error', res.message || 'Failed to delete note');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error deleting note');
    }
  };

  // Callback from UploadNoteModal
  const handleAddUploadedNote = (newNote) => {
    fetchNotes();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm transition-all animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Study Materials & Notes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your notes, upload PDF/Word documents, and review AI study insights
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title, content, or tags..."
              className="w-full pl-9 pr-9 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
              </select>
            </div>

            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 font-medium mr-1 shrink-0 flex items-center gap-1">
            <Folder className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md" />
                <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              </div>
              <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md pt-2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-rose-800 dark:text-rose-200">
            Error Loading Notes
          </h3>
          <p className="text-sm text-rose-600 dark:text-rose-300 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={fetchNotes}
            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-700 transition"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredAndSortedNotes.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {searchQuery || selectedCategory !== 'All'
                ? 'No matching study materials found'
                : 'Your study library is empty'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search terms or selecting another category filter.'
                : 'Start by uploading a lecture document (.pdf, .docx, .txt) or creating your first note.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleOpenWorkspace(note)}
              className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer"
            >
              <div>
                {/* Card Top: Category & Pin */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {note.category || 'General'}
                  </span>

                  <button
                    onClick={(e) => handleTogglePin(e, note)}
                    className={`p-1.5 rounded-lg transition ${
                      note.is_pinned
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={note.is_pinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-amber-500' : ''}`} />
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition mb-2">
                  {note.title}
                </h3>

                {/* Content snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {note.content}
                </p>

                {/* AI Insights snippet */}
                {note.insights && note.insights.length > 0 && (
                  <div className="mb-4 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Key AI Insight:</span>
                    </div>
                    <p className="line-clamp-2 italic">
                      {note.insights[0]}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {note.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{note.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(note.created_at || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => handleDownloadNote(e, note)}
                    className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Download as Text"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleOpenEdit(e, note)}
                    className="p-1.5 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Note"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingNoteId(note.id);
                    }}
                    className="p-1.5 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Layout */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
          {filteredAndSortedNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleOpenWorkspace(note)}
              className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={(e) => handleTogglePin(e, note)}
                  className={`p-1.5 rounded-lg transition ${
                    note.is_pinned
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-slate-300 hover:text-slate-500'
                  }`}
                >
                  <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-amber-500' : ''}`} />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {note.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {note.category || 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl mt-0.5">
                    {note.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {new Date(note.created_at || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDownloadNote(e, note)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleOpenEdit(e, note)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingNoteId(note.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      <UploadNoteModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddNote={handleAddUploadedNote}
        theme={theme}
      />

      {/* Create / Edit Note Modal */}
      {(isCreateOpen || editingNote) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl rounded-2xl shadow-2xl border p-6 space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-semibold tracking-tight">
                {editingNote ? 'Edit Study Note' : 'Create New Study Note'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingNote(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingNote ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Intro to Algorithms"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g., Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="exam, sorting, trees"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Content / Notes
                </label>
                <textarea
                  required
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Type your study notes, formulas, or summaries here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pinNote" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  Pin this note to the top of your library
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingNote(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 text-center space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Delete Study Material?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This action cannot be undone. The document and its associated AI insights will be removed.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingNoteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNote(deletingNoteId)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Modal */}
      {isWorkspaceOpen && workspaceNote && (
        <DocumentWorkspaceModal
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
          note={workspaceNote}
          initialTab={workspaceInitialTab}
          theme={theme}
          onNoteUpdated={(updated) => {
            const upList = notes.map((n) => (n.id === updated.id ? updated : n));
            setNotes(upList);
            if (onNotesUpdated) onNotesUpdated(upList);
          }}
        />
      )}
    </div>
  );
};

export default MyNotesView;
