import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateCopilotPitchWithGemini } from '../services/geminiService';
import { EngineMode } from '../types';
import { X, Sparkles, Copy, Check, Download, Loader2, Cpu } from 'lucide-react';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

export const CopilotModal: React.FC = () => {
  const { copilotOpp, setCopilotOpp, userProfile } = useApp();
  const [pitchDraft, setPitchDraft] = useState('');
  const [pitchEngineMode, setPitchEngineMode] = useState<EngineMode>('Local Heuristic Engine');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useAccessibleModal(copilotOpp !== null, dialogRef, () => setCopilotOpp(null));

  const generatePitch = useCallback(async () => {
    if (!copilotOpp) return;
    setIsGenerating(true);
    try {
      const { pitch, engineMode } = await generateCopilotPitchWithGemini(userProfile, copilotOpp);
      setPitchDraft(pitch);
      setPitchEngineMode(engineMode);
    } catch (err) {
      console.error('Failed to generate proposal:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [copilotOpp, userProfile]);

  useEffect(() => {
    if (copilotOpp) {
      generatePitch();
    }
  }, [copilotOpp, generatePitch]);

  if (!copilotOpp) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pitchDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([pitchDraft], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Pitch_${copilotOpp.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="copilot-modal-title" className="glass-panel relative w-full max-w-3xl rounded-3xl p-6 sm:p-8 border-slate-700 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          id="btn-close-copilot-modal"
          onClick={() => setCopilotOpp(null)}
          className="absolute right-5 top-5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="copilot-modal-title" className="font-['Outfit'] text-xl font-bold text-white">Application Copilot Agent</h2>
              <p className="text-xs text-slate-400">Customized 1-Page Pitch for <strong>{copilotOpp.title}</strong></p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            pitchEngineMode === 'Secure Server AI Gateway'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Cpu className="h-3 w-3" /> {pitchEngineMode}
          </span>
        </div>

        {/* Generated Markdown Pitch Display */}
        <div className="mt-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="mt-3 text-xs font-semibold text-slate-300">Writing tailored application pitch...</p>
              <p className="mt-1 text-[11px] text-slate-400">Aligning {userProfile.skills.length} skills with {copilotOpp.organization} criteria</p>
            </div>
          ) : (
            <div className="glass-panel max-h-[420px] overflow-y-auto rounded-2xl p-5 border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-200 font-mono whitespace-pre-wrap">
              {pitchDraft}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-6 border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={generatePitch}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Regenerate Pitch
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-download-pitch-md"
              onClick={handleDownload}
              disabled={isGenerating || !pitchDraft}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Download .MD
            </button>

            <button
              id="btn-copy-pitch-text"
              onClick={handleCopy}
              disabled={isGenerating || !pitchDraft}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Pitch Text
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
