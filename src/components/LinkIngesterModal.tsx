import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseUnstructuredTextWithGemini } from '../services/geminiService';
import { X, Sparkles, PlusCircle, FileText, Loader2 } from 'lucide-react';

export const LinkIngesterModal: React.FC = () => {
  const { isIngesterOpen, setIsIngesterOpen, addOpportunity } = useApp();
  const [rawInput, setRawInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  if (!isIngesterOpen) return null;

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;

    setIsParsing(true);
    try {
      const extractedOpp = await parseUnstructuredTextWithGemini(rawInput);
      addOpportunity(extractedOpp);
      setRawInput('');
      setIsIngesterOpen(false);
    } catch (err) {
      console.error('Failed to ingest opportunity:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const sampleLinkedInText = `🚀 Exciting News! Devpost is launching the 2026 Agentic AI Hackathon! 
Build multi-agent workflows using Gemini APIs. $40,000 in total cash prizes.
Deadline: August 25, 2026. Open to students and developers globally. 
Apply here: https://devpost.com/hackathons/agentic-ai-2026`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel relative w-full max-w-xl rounded-3xl p-6 sm:p-8 border-slate-700 shadow-2xl">
        
        {/* Close Button */}
        <button
          id="btn-close-ingester-modal"
          onClick={() => setIsIngesterOpen(false)}
          className="absolute right-5 top-5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-xl font-bold text-white">Unstructured Opportunity Ingestion Agent</h2>
            <p className="text-xs text-slate-400">Paste any raw LinkedIn post, WhatsApp alert, or text to extract structured details locally.</p>
          </div>
        </div>

        <form onSubmit={handleIngest} className="mt-6 space-y-4">
          
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Paste Raw Opportunity Text or Post</span>
              <button
                type="button"
                onClick={() => setRawInput(sampleLinkedInText)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Paste Sample Post
              </button>
            </label>
            <textarea
              id="textarea-raw-ingest-input"
              rows={6}
              placeholder="Paste LinkedIn post content, WhatsApp message, tweet, or opportunity description text here..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="glass-input mt-2 w-full rounded-2xl p-4 text-xs sm:text-sm font-mono leading-relaxed"
              required
            />
          </div>

          {/* Parser Explanation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400 flex items-start gap-2">
            <FileText className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              The <strong>Ingestion Agent</strong> uses local NLP parsing rules to extract title, organization, category, deadline, tech stack, prize, and apply link into your opportunity feed.
            </p>
          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-800 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsIngesterOpen(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              id="btn-run-ingest-agent"
              type="submit"
              disabled={isParsing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Ingesting Text...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" /> Extract & Add Opportunity
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
