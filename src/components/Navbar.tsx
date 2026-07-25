import React, { lazy, Suspense, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, User, Settings, Bookmark, Zap, LogIn, LogOut, ChevronDown, Shield, Cpu, Bell, LayoutDashboard } from 'lucide-react';
import { LoadingFallback } from './LoadingFallback';

const NotificationPreferencesModal = lazy(() => import('./NotificationPreferencesModal').then(module => ({ default: module.NotificationPreferencesModal })));

interface NavbarProps {
  onOpenCareerCenter?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCareerCenter }) => {
  const { 
    savedIds, 
    setIsProfileOpen, 
    setIsIngesterOpen, 
    setIsSettingsOpen,
    engineMode
  } = useApp();

  const { 
    currentUser, 
    isAuthenticated, 
    isGuest,
    setIsAuthModalOpen, 
    setAuthMode, 
    logout 
  } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6">
        
        {/* Brand Logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="truncate font-['Outfit'] text-base font-bold tracking-tight text-slate-900 sm:text-xl">
                Opportunity<span className="text-cyan-600">Pulse</span> AI
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">Agentic Opportunity Radar & Application Copilot</p>
          </div>
        </div>

        {/* Action Buttons & User Auth Menu */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          


          {/* AI Ingest Button */}
          <button
            id="btn-ingest-opportunity"
            onClick={() => setIsIngesterOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/15 transition-all hover:opacity-90 active:scale-95 sm:text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Ingest Link/Text</span>
            <span className="sm:hidden">Ingest</span>
          </button>

          {/* Career Workspace button */}
          <button
            id="btn-open-career-workspace"
            onClick={onOpenCareerCenter}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100 hover:text-indigo-900"
            title="My Career Workspace"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Career Workspace</span>
          </button>

          {/* Auth State: User Menu */}
          {currentUser && (
            <div className="relative">
              <button
                id="btn-user-menu"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-all hover:border-cyan-300 hover:bg-slate-50 hover:text-cyan-700 shadow-sm"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-[11px]">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden font-semibold sm:inline">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name || 'Guest User'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email || 'Local Mode'}</p>
                    {isAuthenticated ? (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <Shield className="h-3 w-3" /> Supabase Session Active
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                        <Shield className="h-3 w-3" /> Guest Session (Local)
                      </div>
                    )}
                  </div>

                  <button
                    id="btn-career-workspace-dropdown"
                    onClick={() => { if (onOpenCareerCenter) onOpenCareerCenter(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-cyan-600 hover:bg-cyan-500/10 transition-colors mt-1"
                  >
                    <LayoutDashboard className="h-4 w-4 text-cyan-600" /> My Career Workspace
                  </button>

                  <button
                    onClick={() => { setIsProfileOpen(true); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <User className="h-4 w-4 text-cyan-600" /> Edit Profile & Skills
                  </button>

                  {/* Saved Opportunities (Bookmarks) */}
                  <button
                    onClick={() => { setIsProfileOpen(true); setIsDropdownOpen(false); }}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Saved Opportunities"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-purple-600" />
                      <span>Saved Opportunities</span>
                    </div>
                    {savedIds.length > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-800">
                        {savedIds.length}
                      </span>
                    )}
                  </button>

                  {/* Email Alert Preferences */}
                  <button
                    id="btn-notification-preferences"
                    onClick={() => { setIsNotificationsOpen(true); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Email alert preferences"
                  >
                    <Bell className="h-4 w-4 text-amber-500" />
                    <span>Alert Preferences</span>
                  </button>



                  {/* Login/Signup or Logout */}
                  {isAuthenticated ? (
                    <button
                      id="btn-logout"
                      onClick={() => { logout(); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mt-1 border-t border-slate-100"
                    >
                      <LogOut className="h-4 w-4" /> Log Out
                    </button>
                  ) : (
                    <button
                      id="btn-login-dropdown"
                      onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 transition-colors mt-1 border-t border-slate-100"
                    >
                      <LogIn className="h-4 w-4" /> Log In / Sign Up
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
      {isNotificationsOpen && <Suspense fallback={<div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><LoadingFallback label="Loading notification preferences…" /></div>}><NotificationPreferencesModal isOpen onClose={() => setIsNotificationsOpen(false)} /></Suspense>}
    </header>
  );
};
