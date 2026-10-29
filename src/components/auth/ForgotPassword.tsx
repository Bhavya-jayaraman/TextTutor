import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { clientAuthService } from '../../services/clientAuthService.js';
import { TextTutorLogo } from '../common/TextTutorLogo.js';

interface ForgotPasswordProps {
  onNavigateLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigateLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await clientAuthService.forgotPassword({ email });
      if (response.success) {
        setMessage(response.message || 'Password reset link dispatched.');
      } else {
        setError(response.message || 'Failed to request password reset.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden">
      <button
        onClick={onNavigateLogin}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Sign In</span>
      </button>

      <div className="flex flex-col items-center text-center mb-6">
        <TextTutorLogo size={48} showText={false} className="mb-3" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs text-slate-500 mt-1">Enter your account email to receive a password recovery link</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Account Email Address
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Reset Instructions...</span>
            </>
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>
    </div>
  );
};
