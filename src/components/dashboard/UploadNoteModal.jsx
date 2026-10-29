/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { clientDocumentService } from '../../services/clientDocumentService.js';
import { clientNotesService } from '../../services/clientNotesService.js';

export const UploadNoteModal = ({
  isOpen,
  onClose,
  onAddNote,
  theme = 'light',
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Study Material');
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [extractedPreview, setExtractedPreview] = useState(null);

  const allowedExtensions = ['pdf', 'docx', 'txt', 'md'];
  const MAX_FILE_SIZE_MB = 50;

  const validateFile = (file) => {
    setError(null);
    if (!file) return false;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file format (.${ext}). TextTutor supports PDF, DOCX, and TXT files.`);
      return false;
    }
    if (file.size === 0) {
      setError('The selected file is empty. Please select a valid document.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please select a document under ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      if (!title) {
        setTitle(nameWithoutExt);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      if (!title) {
        setTitle(nameWithoutExt);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadAndProcess = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a document file (.pdf, .docx, .txt) to upload.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);
    setProgress(15);
    setStageText('Uploading document...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (title.trim()) formData.append('title', title.trim());
      if (category.trim()) formData.append('category', category.trim());
      formData.append('saveNote', 'true');

      setStageText('Extracting text and pages...');
      setProgress(45);

      const result = await clientDocumentService.uploadDocument(formData, (percent) => {
        if (percent < 90) {
          setProgress(Math.max(15, Math.min(85, percent)));
        }
      });

      setStageText('Indexing chunks for AI study...');
      setProgress(90);

      if (result.success) {
        setExtractedPreview({
          wordCount: result.wordCount,
          charCount: result.characterCount,
          pageCount: result.pageCount,
          fileName: result.fileName,
          fileType: result.fileType,
          sampleText: result.extractedText ? result.extractedText.slice(0, 300) + '...' : '',
        });

        if (result.note && onAddNote) {
          const noteObj = {
            id: String(result.note.id),
            title: result.note.title,
            category: result.note.category,
            date: new Date(result.note.created_at || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            updatedAt: 'Just now',
            content: result.note.content,
            insights: result.note.insights || [],
            tags: result.note.tags || [],
            is_pinned: Boolean(result.note.is_pinned),
          };
          onAddNote(noteObj);
        }

        setProgress(100);
        setStageText('Ready');
        setSuccessMsg(`Document "${result.fileName}" parsed, structured, and indexed for AI study!`);

        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        throw new Error(result.message || 'Failed to process document.');
      }
    } catch (err) {
      console.error('Document upload error:', err);
      const rawMsg = err.response?.data?.message || err.message || 'Failed to process document.';
      if (rawMsg.toLowerCase().includes('scanned') || rawMsg.toLowerCase().includes('ocr')) {
        setError(rawMsg);
      } else if (rawMsg.toLowerCase().includes('password') || rawMsg.toLowerCase().includes('encrypted')) {
        setError(rawMsg);
      } else {
        setError(rawMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle('');
    setError(null);
    setSuccessMsg(null);
    setProgress(0);
    setIsProcessing(false);
    setExtractedPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Upload Study Document</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extract readable text from PDF, Word (.docx), or Text files
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleUploadAndProcess} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              selectedFile
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop to replace
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Click to select or drag & drop document
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports <span className="font-semibold text-indigo-600 dark:text-indigo-400">PDF, DOCX, TXT</span> (Configurable up to 50 MB)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Document Metadata Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Note Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 4: Photosynthesis"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Biology, Lecture Notes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{stageText || 'Extracting text & indexing concepts...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Extracted Preview Badge */}
          {extractedPreview && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span>Extracted {extractedPreview.wordCount} words ({extractedPreview.charCount} characters)</span>
              </div>
              <p className="line-clamp-2 italic text-slate-500 dark:text-slate-400">
                "{extractedPreview.sampleText}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isProcessing}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm transition flex items-center gap-2 ${
                !selectedFile || isProcessing
                  ? 'bg-indigo-400 dark:bg-indigo-800 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Process & Save to Notes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadNoteModal;
