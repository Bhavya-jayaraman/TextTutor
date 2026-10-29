/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Sparkles,
  Shield,
  CheckCircle2,
  Globe,
  Trash2,
  LogOut,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { ThemeMode } from '../../types/dashboard.js';
import { clientAuthService } from '../../services/clientAuthService.js';

interface SettingsViewProps {
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const [insightDepth, setInsightDepth] = useState('Detailed (3-5 Bullet Points)');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [language, setLanguage] = useState('English (US)');
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = () => {
    const prefsJson = JSON.stringify({
      insightDepth,
      emailNotifs,
      dailyReminders,
      pushNotifs,
      language,
      analyticsOptIn,
      privateMode,
    });
    localStorage.setItem('texttutor_preferences', prefsJson);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogoutAll = () => {
    clientAuthService.logout();
    if (onLogout) onLogout();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await clientAuthService.deleteAccount();
      if (onLogout) onLogout();
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
          <Settings className="w-6 h-6 text-indigo-600" />
          <span>Application Preferences</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure AI summary granularity, notification alerts, study privacy, and account security.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6">
        {/* AI Preferences */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Summarization & Response Preferences</span>
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Key Insight Granularity</label>
            <select
              value={insightDepth}
              onChange={(e) => setInsightDepth(e.target.value)}
              className="w-full p-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="Brief (1-2 Key Bullets)">Brief (1-2 Key Bullets)</option>
              <option value="Detailed (3-5 Bullet Points)">Detailed (3-5 Bullet Points)</option>
              <option value="Comprehensive Study Outline">Comprehensive Study Outline</option>
            </select>
          </div>
        </div>

        {/* Language Locale */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Language & Locale</span>
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Display & Output Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="English (US)">English (US)</option>
              <option value="Spanish (Español)">Spanish (Español)</option>
              <option value="French (Français)">French (Français)</option>
              <option value="German (Deutsch)">German (Deutsch)</option>
              <option value="Japanese (日本語)">Japanese (日本語)</option>
              <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Notification Preferences</span>
          </h2>

          <div className="space-y-3 text-xs text-slate-700">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Email Weekly Digest</span>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Daily Spaced Repetition Reminders</span>
              <input
                type="checkbox"
                checked={dailyReminders}
                onChange={(e) => setDailyReminders(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Browser Push Notifications</span>
              <input
                type="checkbox"
                checked={pushNotifs}
                onChange={(e) => setPushNotifs(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Security</span>
          </h2>

          <div className="space-y-3 text-xs text-slate-700">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Allow Anonymous Usage Analytics</span>
              <input
                type="checkbox"
                checked={analyticsOptIn}
                onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Private Study Mode (Hide notes on recent feed)</span>
              <input
                type="checkbox"
                checked={privateMode}
                onChange={(e) => setPrivateMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Account Danger Zone */}
        <div className="space-y-3 pt-4 border-t border-rose-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Session & Danger Zone</span>
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              onClick={handleLogoutAll}
              className="px-4 py-2 border border-slate-300 hover:border-slate-400 text-xs text-slate-700 rounded-xl font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout from All Devices</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs text-rose-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Save Preferences Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {savedSuccess ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preferences Saved Successfully!</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Changes apply immediately.</span>
          )}

          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-rose-700">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-600">
                This action is irreversible. All your study notes, AI summaries, flashcards, and quizzes will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-xs font-semibold rounded-xl text-white shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
