import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldCheck, Cpu, Lock, CheckCircle2 } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen } = useApp();

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
            <h2 className="font-['Outfit'] text-xl font-bold text-white">Engine Status & Data Privacy</h2>
            <p className="text-xs text-slate-400">Phase 0 Zero-Key Execution Specs</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          
          {/* Active Engine Status Banner */}
          <div className="rounded-2xl border bg-emerald-500/10 border-emerald-500/30 p-4 text-xs text-emerald-300">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Primary Engine: Local Smart Heuristic Engine Active</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
              No API key is required. All opportunity matching, text parsing, and proposal generation runs 100% locally in your browser.
            </p>
          </div>

          {/* Privacy & Architecture Details */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-xs">
            <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-cyan-400" /> Privacy & Security Protocols
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Zero Secret Exposure:</strong> Frontend code contains no hardcoded or public API keys.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Local Processing:</strong> Uploaded CVs and pasted opportunity text are processed directly on your device and never sent to external servers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Phase 1 Roadmap:</strong> Secure server-side AI model integration will be introduced in Phase 1 via encrypted backend proxies.</span>
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
