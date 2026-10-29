/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  Check,
  User as UserIcon,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { ThemeMode, DashboardView } from '../../types/dashboard.js';
import { User } from '../../types/auth.js';
import { clientNotificationService, NotificationItem } from '../../services/clientNotificationService.js';

interface NavbarProps {
  user: User;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onOpenMobileMenu: () => void;
  onSelectView: (view: DashboardView) => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenMobileMenu,
  onSelectView,
  onLogout,
  searchQuery,
  onSearchChange,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await clientNotificationService.getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await clientNotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleMarkItemRead = async (id: number) => {
    try {
      await clientNotificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error('Error marking item read:', err);
    }
  };

  return (
    <header className="sticky top-2 z-20 px-3 sm:px-6 py-1">
      <div className="h-[70px] rounded-2xl px-4 sm:px-6 flex items-center justify-between gap-4 border border-slate-200/80 shadow-xs bg-white/90 backdrop-blur-md text-slate-900">
        {/* Left Mobile Menu Toggle + Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search study notes, summaries, or flashcards..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Right Actions (Notifications, User Profile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              )}
            </button>

            {/* Notification Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 shadow-xl p-4 z-50 bg-white text-slate-900">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No notifications right now.</p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => !item.is_read && handleMarkItemRead(item.id)}
                        className={`p-2.5 rounded-xl text-xs border transition-colors cursor-pointer ${
                          item.is_read
                            ? 'bg-slate-50 border-slate-100 text-slate-500'
                            : 'bg-indigo-50/70 border-indigo-100 text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-slate-800">{item.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold leading-tight text-slate-900">
                  {user.name}
                </div>
                <div className="text-[10px] text-indigo-600 font-semibold">AI Learner</div>
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 shadow-xl p-2 z-50 bg-white text-slate-900">
                <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    onSelectView('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    onSelectView('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>Preferences</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
