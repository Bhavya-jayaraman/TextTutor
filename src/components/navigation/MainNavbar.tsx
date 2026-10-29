import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { User } from '../../types/auth.js';
import { TextTutorLogo } from '../common/TextTutorLogo.js';

interface MainNavbarProps {
  theme?: string;
  toggleTheme?: () => void;
  currentUser?: User | null;
  onNavigateLogin?: () => void;
  onNavigateRegister?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateHome?: () => void;
  onSelectSection?: (sectionId: string) => void;
  activeSection?: string;
  workspaceMode?: 'overview' | 'studio';
  onToggleStudio?: () => void;
}

export const MainNavbar: React.FC<MainNavbarProps> = ({
  currentUser,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateDashboard,
  onNavigateHome,
  onSelectSection,
  activeSection = 'home',
  workspaceMode = 'overview',
  onToggleStudio,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (sectionId === 'home') {
      if (onNavigateHome) {
        onNavigateHome();
      } else if (onSelectSection) {
        onSelectSection('hero');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (sectionId === 'studio') {
      if (onToggleStudio) {
        onToggleStudio();
      } else if (onSelectSection) {
        onSelectSection('product-preview');
      }
    } else if (onSelectSection) {
      onSelectSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'studio', label: 'AI Studio' },
    { id: 'faq', label: 'FAQ' },
    { id: 'footer', label: 'Contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-200 h-[74px] bg-white/95 backdrop-blur-md border-b ${
          isScrolled ? 'border-slate-200 shadow-xs' : 'border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => handleLinkClick('home')}
            className="cursor-pointer group select-none"
          >
            <TextTutorLogo
              size={38}
              showText={true}
              textClassName="text-2xl font-black tracking-tight text-slate-900 group-hover:opacity-90 transition-opacity"
            />
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => {
              const isActive =
                activeSection === item.id || (item.id === 'studio' && workspaceMode === 'studio');
              return (
                <button
                  key={item.id}
                  onClick={() => handleLinkClick(item.id)}
                  className={`text-sm font-semibold transition-colors duration-150 py-1 relative ${
                    isActive
                      ? 'text-indigo-600 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-[-3px] left-0 w-full h-[2px] bg-indigo-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={onNavigateDashboard}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onNavigateLogin}
                  className="text-sm font-semibold px-4.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all"
                >
                  Sign In
                </button>

                <button
                  onClick={onNavigateRegister}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2 rounded-xl shadow-xs hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 hover:text-slate-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-[300px] h-full z-10 p-6 flex flex-col justify-between shadow-xl border-l border-slate-200 bg-white">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <TextTutorLogo size={32} showText={true} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleLinkClick(item.id)}
                    className="text-left py-2 px-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-2">
              {currentUser ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateDashboard) onNavigateDashboard();
                  }}
                  className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onNavigateLogin) onNavigateLogin();
                    }}
                    className="w-full border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl text-sm hover:border-indigo-600 hover:text-indigo-600 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onNavigateRegister) onNavigateRegister();
                    }}
                    className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
