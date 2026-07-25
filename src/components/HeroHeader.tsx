import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Award, ShieldCheck, Briefcase } from 'lucide-react';

export const HeroHeader: React.FC = () => {
  const { userProfile, opportunities, setIsProfileOpen } = useApp();

  return (
    <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-white py-16 sm:py-20 px-4 sm:px-6">
      
      {/* Glow Orbs background */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        


        {/* Hero Title & Subtitle */}
        <div className="max-w-3xl">
          <h1 className="font-['Outfit'] text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            Cut the Noise. Land the <span className="bg-gradient-to-r from-cyan-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent pr-1">Opportunity</span>.
          </h1>
          <p className="mt-6 text-base text-slate-600 sm:text-lg leading-relaxed sm:leading-loose">
            Stop searching across WhatsApp groups, LinkedIn, blogs, and newsletters. OpportunityPulse AI filters the noise and matches you with internships, scholarships, tech grants, and remote roles tailored to your skills.
          </p>
        </div>

        {/* Candidate Context Pill & Quick Stats */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          
          {/* Active Profile Pill */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-2 text-xs sm:text-sm">
            <Briefcase className="h-4 w-4 text-cyan-600" />
            <div>
              <span className="text-slate-500">Active Profile: </span>
              <strong className="text-slate-900">{userProfile.major}</strong> ({userProfile.academicLevel})
            </div>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="ml-2 text-xs font-semibold text-cyan-600 hover:underline"
            >
              Edit
            </button>
          </div>



          {/* Opportunities Counter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white shadow-sm px-3.5 py-2 text-xs text-slate-600">
            <Award className="h-4 w-4 text-indigo-600" />
            <span>Active Listings: <strong className="text-slate-900">{opportunities.length}</strong></span>
          </div>

        </div>

      </div>
    </div>
  );
};
