import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { clientAuthService } from '../../services/clientAuthService.js';
import { User } from '../../types/auth.js';
import { TextTutorLogo } from '../common/TextTutorLogo.js';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await clientAuthService.login({
        email,
        password,
        rememberMe,
      });

      if (response.success && response.user) {
        setSuccess('Authentication successful! Redirecting to Dashboard...');
        setTimeout(() => {
          onLoginSuccess(response.user!);
        }, 600);
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Unable to reach the TextTutor authentication server. Please check your backend connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden">
      <div className="flex flex-col items-center text-center mb-6">
        <TextTutorLogo size={48} showText={false} className="mb-3" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to Text<span className="text-indigo-600">Tutor</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Sign in to access your study notes, flashcards, and quizzes</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span className="leading-relaxed">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={onNavigateForgotPassword}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Remember me for 30 days</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
        <span>Don't have an account yet? </span>
        <button
          onClick={onNavigateRegister}
          className="text-indigo-600 font-bold hover:underline ml-1"
        >
          Create an account
        </button>
      </div>
    </div>
  );
};
