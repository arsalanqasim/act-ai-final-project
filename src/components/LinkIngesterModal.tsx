import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ingestOpportunityWithProvenance } from '../services/geminiService';
import { findApprovedSource, APPROVED_SOURCES_REGISTRY } from '../config/approvedSources';
import { Opportunity, OpportunityCategory } from '../types';
import {
  X, Sparkles, PlusCircle, FileText, Loader2, Link2, CheckCircle2,
  AlertTriangle, ShieldCheck, Info, ChevronDown, ChevronUp, Edit3, ArrowLeft
} from 'lucide-react';

export const LinkIngesterModal: React.FC = () => {
  const { isIngesterOpen, setIsIngesterOpen, addOpportunity } = useApp();

  // Mode state: 'url' | 'text'
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  const [showRegistryList, setShowRegistryList] = useState(false);

  // Workflow state: Step 1 (Input) vs Step 2 (Preview & Edit)
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewOpp, setPreviewOpp] = useState<Opportunity | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{ isDuplicate: boolean; existingId?: string; message?: string } | null>(null);

  if (!isIngesterOpen) return null;

  const matchedSource = urlInput.trim() ? findApprovedSource(urlInput) : null;

  const resetState = () => {
    setUrlInput('');
    setRawTextInput('');
    setErrorMessage(null);
    setPreviewOpp(null);
    setDuplicateInfo(null);
    setIsParsing(false);
    setIsIngesterOpen(false);
  };

  const handleRunIngester = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'url' && !urlInput.trim()) {
      setErrorMessage('Please enter an opportunity source URL.');
      return;
    }
    if (mode === 'text' && !rawTextInput.trim()) {
      setErrorMessage('Please paste the opportunity listing text.');
      return;
    }

    setIsParsing(true);
    try {
      const res = await ingestOpportunityWithProvenance({
        mode,
        url: mode === 'url' ? urlInput.trim() : undefined,
        rawText: mode === 'text' ? rawTextInput.trim() : undefined
      });

      if (res.error && !res.opportunity) {
        setErrorMessage(res.error);
        setIsParsing(false);
        return;
      }

      if (res.error && res.opportunity) {
        setErrorMessage(`Notice: ${res.error}`);
      }

      setPreviewOpp(res.opportunity);
      if (res.duplicate) {
        setDuplicateInfo(res.duplicate);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process ingestion request.';
      setErrorMessage(msg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveConfirmedOpportunity = async () => {
    if (!previewOpp) return;
    try {
      const applicationUrl = new URL(previewOpp.applyUrl);
      if (applicationUrl.protocol !== 'https:' || applicationUrl.username || applicationUrl.password) {
        throw new Error('Use a valid HTTPS application URL without embedded credentials.');
      }
      await addOpportunity(previewOpp);
      resetState();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save this opportunity.');
    }
  };

  const sampleLinkedInText = `🚀 Devpost 2026 Agentic AI Hackathon
Build autonomous multi-agent systems using Google Gemini Flash & Supabase.
Category: Hackathon
Prizes: $40,000 Total Cash Pool
Deadline: 2026-08-25
Location: Remote (Global)
Eligibility: Students, developers, and tech youth
Apply: https://devpost.com/hackathons/agentic-ai-2026`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-slate-700 shadow-2xl transition-all">

        {/* Close Button */}
        <button
          id="btn-close-ingester-modal"
          onClick={resetState}
          className="absolute right-5 top-5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-xl font-bold text-white">Trusted Opportunity Ingestion Agent</h2>
            <p className="text-xs text-slate-400">Extract structured listings with verified domain provenance and trust metrics.</p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* STEP 1: INPUT FORM */}
        {!previewOpp && (
          <form onSubmit={handleRunIngester} className="mt-6 space-y-4">

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900/80 border border-slate-800">
              <button
                id="btn-tab-mode-url"
                type="button"
                onClick={() => { setMode('url'); setErrorMessage(null); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'url'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Link2 className="h-4 w-4" /> Fetch Approved Source URL
              </button>
              <button
                id="btn-tab-mode-text"
                type="button"
                onClick={() => { setMode('text'); setErrorMessage(null); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'text'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" /> Paste Raw Listing Text
              </button>
            </div>

            {/* URL Mode */}
            {mode === 'url' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Enter Official or Approved Opportunity URL (HTTPS)</span>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://devpost.com/hackathons/agentic-ai-2026')}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Use Sample URL
                  </button>
                </label>

                <input
                  id="input-ingest-url"
                  type="url"
                  placeholder="https://devpost.com/hackathons/..."
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setErrorMessage(null); }}
                  className="glass-input w-full rounded-2xl p-3.5 text-xs sm:text-sm font-mono text-cyan-300"
                  required
                />

                {/* Live Domain Verification Indicator */}
                {urlInput.trim() && (
                  <div className="mt-2">
                    {matchedSource ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-bold">{matchedSource.name}</span> is an <strong>{matchedSource.sourceType === 'official' ? 'Official Domain' : 'Approved Platform'}</strong>. Safe server URL fetching enabled.
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-300 flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Domain not in approved registry:</strong> Direct server URL fetching is restricted to verified domains to prevent unauthenticated scraping. Please switch to <strong>Paste Raw Listing Text</strong> tab to parse content safely.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Text Mode */}
            {mode === 'text' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Paste LinkedIn Post, Announcement, or Listing Text
                  </label>
                  <button
                    type="button"
                    onClick={() => setRawTextInput(sampleLinkedInText)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Paste Sample Post
                  </button>
                </div>
                <textarea
                  id="textarea-raw-ingest-input"
                  rows={6}
                  placeholder="Paste opportunity description, rules, deadline, location, and apply link..."
                  value={rawTextInput}
                  onChange={(e) => setRawTextInput(e.target.value)}
                  className="glass-input w-full rounded-2xl p-4 text-xs sm:text-sm font-mono leading-relaxed"
                  required
                />
              </div>
            )}

            {/* Approved Sources Accordion */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowRegistryList(!showRegistryList)}
                className="w-full p-3 text-left font-medium text-slate-400 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Approved Opportunity Sources Registry ({APPROVED_SOURCES_REGISTRY.length} Verified Domains)
                </span>
                {showRegistryList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showRegistryList && (
                <div className="p-3 border-t border-slate-800 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {APPROVED_SOURCES_REGISTRY.map(src => (
                    <div key={src.domain} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        {src.name}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px] mt-0.5">{src.domain}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="border-t border-slate-800 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetState}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                id="btn-run-ingest-agent"
                type="submit"
                disabled={isParsing || (mode === 'url' && !matchedSource)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ingesting & Scoring...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" /> Extract & Review Listing
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: EDITABLE PREVIEW & PROVENANCE BREAKDOWN */}
        {previewOpp && (
          <div className="mt-5 space-y-4">

            {/* Duplicate Notice Banner */}
            {duplicateInfo?.isDuplicate && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  Potential Duplicate Opportunity Detected
                </div>
                <p>{duplicateInfo.message || 'An opportunity matching this URL or title already exists in your feed.'}</p>
              </div>
            )}

            {/* Trust Provenance Header Card */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 to-indigo-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    previewOpp.verificationState === 'source-confirmed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {previewOpp.trustLabel || 'Community Submitted'}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    Trust Score: {previewOpp.trustScore ?? 50}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Domain: <strong className="text-slate-200">{previewOpp.sourceDomain || 'User Input'}</strong> • Engine: <span className="text-cyan-300">{previewOpp.extractionEngine}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpp(null)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Re-parse
              </button>
            </div>

            {/* Editable Fields Section */}
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4 text-cyan-400" /> Review & Edit Extracted Attributes
                </span>
                <span className="text-[10px] text-slate-400">All fields editable prior to save</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Title</label>
                  <input
                    id="input-edit-title"
                    type="text"
                    value={previewOpp.title}
                    onChange={e => setPreviewOpp({ ...previewOpp, title: e.target.value })}
                    className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Organization</label>
                  <input
                    id="input-edit-org"
                    type="text"
                    value={previewOpp.organization}
                    onChange={e => setPreviewOpp({ ...previewOpp, organization: e.target.value })}
                    className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Category</label>
                  <select
                    id="select-edit-category"
                    value={previewOpp.category}
                    onChange={e => setPreviewOpp({ ...previewOpp, category: e.target.value as OpportunityCategory })}
                    className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-white bg-slate-900"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Scholarship">Scholarship</option>
                    <option value="Internship">Internship</option>
                    <option value="Grant">Grant</option>
                    <option value="Tech Event">Tech Event</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Deadline (YYYY-MM-DD)</label>
                  <input
                    id="input-edit-deadline"
                    type="text"
                    value={previewOpp.deadline}
                    onChange={e => setPreviewOpp({ ...previewOpp, deadline: e.target.value })}
                    className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Location / Format</label>
                  <input
                    id="input-edit-location"
                    type="text"
                    value={previewOpp.location}
                    onChange={e => setPreviewOpp({ ...previewOpp, location: e.target.value })}
                    className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold">Stipend / Prize Pool</label>
                  <input
                    id="input-edit-prize"
                    type="text"
                    value={previewOpp.stipendOrPrize}
                    onChange={e => setPreviewOpp({ ...previewOpp, stipendOrPrize: e.target.value })}
                    className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold">Application URL</label>
                <input
                  id="input-edit-apply-url"
                  type="url"
                  value={previewOpp.applyUrl}
                  onChange={e => setPreviewOpp({ ...previewOpp, applyUrl: e.target.value })}
                  className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-cyan-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold">Required Tech Stack / Eligibility Tags (comma separated)</label>
                <input
                  id="input-edit-tech-stack"
                  type="text"
                  value={previewOpp.techStackOrEligibility.join(', ')}
                  onChange={e => setPreviewOpp({ ...previewOpp, techStackOrEligibility: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold">Summary Description</label>
                <textarea
                  id="textarea-edit-description"
                  rows={3}
                  value={previewOpp.description}
                  onChange={e => setPreviewOpp({ ...previewOpp, description: e.target.value })}
                  className="glass-input mt-1 w-full rounded-xl p-2 text-xs text-white leading-relaxed"
                />
              </div>
            </div>

            {/* Trust Rationale Reasons List */}
            {previewOpp.trustReasons && previewOpp.trustReasons.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Trust Score Rationale:</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-400">
                  {previewOpp.trustReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Final Action Footer */}
            <div className="border-t border-slate-800 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewOpp(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Back to Edit
              </button>
              <button
                id="btn-confirm-save-opportunity"
                type="button"
                onClick={handleSaveConfirmedOpportunity}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:opacity-90"
              >
                <CheckCircle2 className="h-4 w-4" /> Save Opportunity to Feed
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
