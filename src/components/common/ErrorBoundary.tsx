/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TextTutor UI Boundary Caught Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111115] border border-white/10 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                TextTutor encountered an unexpected interface error. Don't worry, your study notes and progress remain safe in your account.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/50 border border-white/5 rounded-xl text-left overflow-x-auto">
                <code className="text-[10px] font-mono text-rose-300/80 block whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-xs font-semibold rounded-xl text-white transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-[#818cf8] hover:bg-[#6366f1] text-xs font-semibold rounded-xl text-white transition-all shadow-[0_0_15px_rgba(129,140,248,0.3)] flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
