import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, Cpu, Lock, CheckCircle2, Server } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, engineMode } = useApp();
  const { isSupabaseConfigured, isAuthenticated, currentUser } = useAuth();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel relative w-full max-w-lg rounded-3xl p-6 sm:p-8 border-slate-700 shadow-2xl">
        
        {/* Close Button */}
        <button
          id="btn-close-settings-modal"
          onClick={() => setIsSettingsOpen(false)}
          className="absolute right-5 top-5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-xl font-bold text-white">Engine Status & Data Security</h2>
            <p className="text-xs text-slate-400">Phase 1 Secure Architecture & Privacy Protocol</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          
          {/* Active AI Engine Banner */}
          <div className={`rounded-2xl border p-4 text-xs ${
            engineMode === 'Secure Server AI Gateway'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Active AI Engine: {engineMode}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
              {engineMode === 'Secure Server AI Gateway'
                ? 'Server-side Vercel AI Gateway is actively processing matching, text ingestion, and pitch drafts via official Google Gemini APIs.'
                : 'Server AI route is unconfigured or operating in local mode. All opportunity matching, text parsing, and proposal drafts run 100% locally on your device via our smart heuristic fallback engine.'}
            </p>
          </div>

          {/* Backend & Auth Status */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-xs">
            <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-cyan-400" /> Backend Environment & Authentication Status
            </h3>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Supabase Postgres Auth:</span>
                <span className={`font-semibold ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isSupabaseConfigured ? 'Connected & Row Level Security Enabled' : 'Unconfigured (Local Guest Preview Active)'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">User Session Scoping:</span>
                <span className="font-semibold text-slate-200">
                  {isAuthenticated && currentUser ? `Authenticated (${currentUser.email})` : 'Guest Preview Mode'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Gemini Key Storage:</span>
                <span className="font-semibold text-cyan-400">Server-Side Only (`GEMINI_API_KEY`)</span>
              </div>
            </div>
          </div>

          {/* Privacy & Security Guarantees */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-xs">
            <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-indigo-400" /> Hard Security Rules
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Zero Browser Keys:</strong> Neither `GEMINI_API_KEY` nor `VITE_GEMINI_API_KEY` is ever compiled into browser JS bundles or stored in `localStorage`.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>No Key Prompting:</strong> Users are never asked to supply their own API keys in UI forms or settings.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Row Level Security:</strong> User profiles, saved bookmarks, and custom opportunities are isolated strictly per-user in Supabase Postgres.</span>
              </li>
            </ul>
          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-800 pt-4 flex justify-end">
            <button
              id="btn-close-settings-footer"
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
