import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Key, ShieldCheck, ExternalLink, Save, AlertTriangle } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { apiKey, setApiKey, isSettingsOpen, setIsSettingsOpen, reevaluateMatches } = useApp();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(keyInput.trim());
    setIsSaved(true);
    reevaluateMatches();
    setTimeout(() => {
      setIsSaved(false);
      setIsSettingsOpen(false);
    }, 1200);
  };

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
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-xl font-bold text-white">AI Model & API Key Settings</h2>
            <p className="text-xs text-slate-400">Configure your free Google Gemini API Key.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Google Gemini API Key (Free)</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                Get Free Key in 10s <ExternalLink className="h-3 w-3" />
              </a>
            </label>

            <input
              id="input-gemini-api-key"
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              className="glass-input mt-2 w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Keys are stored securely in your browser's local storage and never transmitted to external servers.
            </p>
          </div>

          {/* Engine Status Banner */}
          <div className={`rounded-2xl border p-4 text-xs ${
            keyInput.trim() 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {keyInput.trim() ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Primary Engine: Google Gemini 1.5 Flash Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Fallback Engine: Smart Local Heuristic Active (Zero-Key Mode)</span>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              {keyInput.trim() 
                ? 'Your app will perform live LLM evaluations and proposal drafting via Gemini API.'
                : 'No key set. The app uses the local zero-cost matching & pitch engine. Enter a free Gemini API key to activate live Gemini LLM capabilities.'}
            </p>
          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-800 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Close
            </button>
            <button
              id="btn-save-api-key"
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
            >
              <Save className="h-4 w-4" /> {isSaved ? 'Saved & Recalculated!' : 'Save Settings'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
