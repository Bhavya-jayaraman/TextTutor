import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Calendar,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Save,
  KeyRound,
  BarChart2,
  BookOpen,
  Sparkles,
  Brain,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { clientAuthService } from '../../services/clientAuthService.js';
import { clientAnalyticsService, AnalyticsOverview } from '../../services/clientAnalyticsService.js';
import { User } from '../../types/auth.js';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
}

const AVATAR_COLORS = [
  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
];

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Stats state
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    clientAnalyticsService
      .getAnalytics()
      .then((res) => {
        if (res.success && res.analytics) {
          setAnalytics(res.analytics);
        }
      })
      .catch((err) => console.error('Failed loading profile analytics:', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim()) {
      setError('Name and email cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      const response = await clientAuthService.updateProfile({ name, email });
      if (response.success && response.user) {
        setSuccess('Profile updated successfully!');
        onUpdateUser(response.user);
        setIsEditing(false);
      } else {
        setError(response.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving profile updates.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill out all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await clientAuthService.changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Current password incorrect or failed to save.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Member since 2026';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-surface border border-theme rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme pb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 border rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg transition-all ${avatarColor}`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">{user.name}</h2>
              <p className="text-xs text-[var(--text-dim)] flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Learner • Knowledge Explorer</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition-all self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Avatar color picker */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
            Profile Avatar Style
          </label>
          <div className="flex items-center gap-2">
            {AVATAR_COLORS.map((style, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarColor(style)}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs transition-transform hover:scale-110 ${style}`}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Learning Statistics Summary */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4" />
            <span>Learning Lifetime Statistics</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#050505] border border-white/5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Notes</span>
              </div>
              <p className="text-lg font-mono font-bold text-white">{analytics?.totalNotes || 0}</p>
            </div>

            <div className="p-3 bg-[#050505] border border-white/5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summaries</span>
              </div>
              <p className="text-lg font-mono font-bold text-white">{analytics?.aiSummariesGenerated || 0}</p>
            </div>

            <div className="p-3 bg-[#050505] border border-white/5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Brain className="w-3.5 h-3.5" />
                <span>Flashcards</span>
              </div>
              <p className="text-lg font-mono font-bold text-white">{analytics?.flashcardsCreated || 0}</p>
            </div>

            <div className="p-3 bg-[#050505] border border-white/5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-rose-400">
                <Flame className="w-3.5 h-3.5" />
                <span>Study Streak</span>
              </div>
              <p className="text-lg font-mono font-bold text-white">{analytics?.studyStreakDays || 1} Days</p>
            </div>
          </div>
        </div>

        {/* Profile Info Form */}
        <form onSubmit={handleSave} className="space-y-5 pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white disabled:opacity-70 focus:outline-none focus:border-[#818cf8] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white disabled:opacity-70 focus:outline-none focus:border-[#818cf8] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#050505] border border-white/10 rounded-xl flex items-center justify-between text-xs text-[#94a3b8]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#818cf8]" />
              <span>Account Created</span>
            </div>
            <span className="font-mono text-white">{formattedDate}</span>
          </div>

          <div className="pt-2 flex flex-wrap justify-between items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-xs text-[#818cf8] font-semibold flex items-center gap-1.5 hover:underline"
            >
              <KeyRound className="w-4 h-4" />
              <span>{showPasswordSection ? 'Hide Password Options' : 'Change Password'}</span>
            </button>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setName(user.name);
                      setEmail(user.email);
                      setIsEditing(false);
                      setError(null);
                    }}
                    className="px-4 py-2.5 border border-white/10 hover:border-white/20 text-xs font-medium text-[#94a3b8] rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-semibold rounded-xl shadow-[0_0_15px_rgba(129,140,248,0.3)] transition-all flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#818cf8]" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Change Password Modal / Section */}
        {showPasswordSection && (
          <form
            onSubmit={handleChangePassword}
            className="p-5 bg-[#050505] border border-white/10 rounded-2xl space-y-4 pt-4 mt-4 animate-fadeIn"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              <span>Update Password</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#94a3b8] mb-1 font-medium">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111115] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#818cf8]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#94a3b8] mb-1 font-medium">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full bg-[#111115] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#818cf8]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#94a3b8] mb-1 font-medium">Confirm New</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new"
                  className="w-full bg-[#111115] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#818cf8]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-4 py-2 bg-[#818cf8] hover:bg-[#6366f1] text-white text-xs font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(129,140,248,0.3)] flex items-center gap-2"
              >
                {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
