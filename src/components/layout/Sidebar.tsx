/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Layers,
  HelpCircle,
  BarChart3,
  Calendar,
  History,
  User as UserIcon,
  Settings,
  LogOut,
  X,
  Target,
} from 'lucide-react';
import { DashboardView, ThemeMode } from '../../types/dashboard.js';
import { User } from '../../types/auth.js';
import { TextTutorLogo } from '../common/TextTutorLogo.js';

interface SidebarProps {
  activeView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  user: User;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  theme?: ThemeMode;
}

interface NavItem {
  id: DashboardView;
  label: string;
  icon: React.ElementType;
  badge?: string;
  iconBg: string;
  iconColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  { id: 'my-notes', label: 'My Notes', icon: FileText, iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, iconBg: 'bg-pink-50', iconColor: 'text-pink-600' },
  { id: 'study-planner', label: 'Study Planner', icon: Calendar, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  { id: 'activity', label: 'Activity Log', icon: History, iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
  { id: 'profile', label: 'Profile', icon: UserIcon, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { id: 'settings', label: 'Settings', icon: Settings, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  user,
  onLogout,
  mobileOpen,
  onCloseMobile,
}) => {
  const navContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-200">
        <div
          className="cursor-pointer select-none"
          onClick={() => onSelectView('dashboard')}
        >
          <TextTutorLogo
            size={36}
            showText={true}
            textClassName="text-xl font-black tracking-tight text-slate-900"
          />
          <span className="block text-[10px] text-indigo-600 font-bold tracking-wider uppercase pl-[46px] -mt-1">
            AI Study Companion
          </span>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                    isActive ? 'bg-white/20 text-white' : `${item.iconBg} ${item.iconColor}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Learning Goal Card & User Info */}
      <div className="p-3 border-t border-slate-200 space-y-3">
        {/* Today's Learning Goal Card */}
        <div className="p-3.5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-cyan-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900">Today's Goal</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
              75%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-600">
              <span>Study Time</span>
              <span className="font-bold text-indigo-600">45 / 60 mins</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-slate-200 h-screen sticky top-0 z-30 bg-white">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[260px] max-w-[80vw] h-full shadow-xl z-10 border-r border-slate-200 bg-white">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
