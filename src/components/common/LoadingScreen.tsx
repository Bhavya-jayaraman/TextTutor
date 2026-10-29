import React from 'react';
import { TextTutorLogo } from './TextTutorLogo.js';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Initializing TextTutor AI...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 text-slate-900">
      <div className="flex flex-col items-center space-y-4">
        <TextTutorLogo size={64} showText={false} className="animate-pulse" />
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Text<span className="text-indigo-600">Tutor</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};
