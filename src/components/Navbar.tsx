import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Sparkles, PlusCircle, User, Settings, Bookmark, Zap, LogIn, LogOut, ChevronDown, Upload, FileText } from 'lucide-react';
import { ResumeUploadModal } from './ResumeUploadModal';

export const Navbar: React.FC = () => {
  const { 
    savedIds, 
    setIsProfileOpen, 
    setIsIngesterOpen, 
    setIsSettingsOpen 
  } = useApp();

  const { 
    currentUser, 
    isAuthenticated, 
    setIsAuthModalOpen, 
    setAuthMode, 
    logout 
  } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-[#0B0F19]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Outfit'] text-xl font-bold tracking-tight text-white">
                  Opportunity<span className="text-cyan-400">Pulse</span> AI
                </span>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                  HEC ACT-AI
                </span>
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">Agentic Opportunity Radar & Application Copilot</p>
            </div>
          </div>

          {/* Action Buttons & User Auth Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Upload CV Button */}
            <button
              id="btn-upload-cv-navbar"
              onClick={() => setIsResumeModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
              title="Upload CV to Auto-Fill Profile"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import CV</span>
            </button>

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

            {/* Bookmarks */}
            <button
              id="btn-bookmarks"
              onClick={() => setIsProfileOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
              title="Saved Opportunities"
            >
              <Bookmark className="h-4 w-4" />
              {savedIds.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-black">
                  {savedIds.length}
                </span>
              )}
            </button>

            {/* AI Settings */}
            <button
              id="btn-settings"
              onClick={() => setIsSettingsOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
              title="AI Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Auth State: User Menu or Login Button */}
            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-menu"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-cyan-500/40 hover:text-white"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/40 text-indigo-300 font-bold text-[11px]">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden font-semibold sm:inline">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* User Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-800 bg-[#0F172A] p-2 shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => { setIsResumeModalOpen(true); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <FileText className="h-4 w-4 text-cyan-400" /> Auto-Fill Profile from CV
                    </button>

                    <button
                      onClick={() => { setIsProfileOpen(true); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4 text-indigo-400" /> Edit Profile & Skills
                    </button>

                    <button
                      onClick={() => { setIsSettingsOpen(true); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Settings className="h-4 w-4 text-purple-400" /> AI Settings & Keys
                    </button>

                    <button
                      id="btn-logout"
                      onClick={() => { logout(); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors mt-1 border-t border-slate-800/80"
                    >
                      <LogOut className="h-4 w-4" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-login-trigger"
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>Log In / Sign Up</span>
              </button>
            )}

          </div>

        </div>
      </header>

      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />
    </>
  );
};
