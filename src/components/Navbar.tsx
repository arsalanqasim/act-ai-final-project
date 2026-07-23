import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, PlusCircle, User, Settings, Bookmark, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    savedIds, 
    setIsProfileOpen, 
    setIsIngesterOpen, 
    setIsSettingsOpen, 
    userProfile, 
    apiKey 
  } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md">
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
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

          {/* Settings */}
          <button
            id="btn-settings"
            onClick={() => setIsSettingsOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
            title="AI Settings"
          >
            <Settings className="h-4 w-4" />
            {apiKey && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Profile Trigger */}
          <button
            id="btn-profile"
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-white"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 font-bold text-[11px]">
              {userProfile.name.charAt(0)}
            </div>
            <span className="hidden font-medium sm:inline">{userProfile.name.split(' ')[0]}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
