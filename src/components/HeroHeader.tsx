import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Target, Award, Globe, ShieldCheck } from 'lucide-react';

export const HeroHeader: React.FC = () => {
  const { userProfile, opportunities, setIsProfileOpen, apiKey } = useApp();

  return (
    <div className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0F172A] via-[#0B0F19] to-[#0B0F19] py-10 px-4 sm:px-6">
      
      {/* Glow Orbs background */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Tailored for Pakistani Students & Tech Youth</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="mt-4 max-w-3xl">
          <h1 className="font-['Outfit'] text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Never Miss a High-Signal <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Opportunity</span> Again.
          </h1>
          <p className="mt-3 text-base text-slate-300 sm:text-lg">
            Bypass social media noise. OpportunityPulse AI matches your skills with verified AI Hackathons, Fulbright & Erasmus Scholarships, Remote Tech Internships, and Ignite Grants.
          </p>
        </div>

        {/* Candidate Context Pill & Quick Stats */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          
          {/* Active Profile Pill */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs sm:text-sm">
            <Target className="h-4 w-4 text-cyan-400" />
            <div>
              <span className="text-slate-400">Active Profile: </span>
              <strong className="text-white">{userProfile.major}</strong> ({userProfile.academicLevel})
            </div>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="ml-2 text-xs font-semibold text-cyan-400 hover:underline"
            >
              Edit
            </button>
          </div>

          {/* Engine Mode Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs">
            <ShieldCheck className={`h-4 w-4 ${apiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-300">
              Engine: <strong className="text-white">{apiKey ? 'Google Gemini 1.5 Flash' : 'Smart Heuristic (Zero-Key)'}</strong>
            </span>
          </div>

          {/* Opportunities Counter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs text-slate-300">
            <Award className="h-4 w-4 text-indigo-400" />
            <span>Active Listings: <strong className="text-white">{opportunities.length}</strong></span>
          </div>

        </div>

      </div>
    </div>
  );
};
