import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { OpportunityCategory, LocationPreference } from '../types';
import { Sparkles, Check, ArrowRight, Globe, Layers, Award, FileText, Upload } from 'lucide-react';
import { ResumeUploadModal } from './ResumeUploadModal';

export const OnboardingWizard: React.FC = () => {
  const { isWizardOpen, currentUser, completeOnboarding } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Clean initial state without pre-selected defaults
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<OpportunityCategory[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationPreference>('Remote');

  // Resume Modal trigger
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  if (!isWizardOpen || !currentUser) return null;

  const popularSkills = [
    'Python', 'React', 'TypeScript', 'Generative AI', 'Machine Learning', 
    'Node.js', 'Tailwind CSS', 'SQL', 'C++', 'Java', 'Data Science', 'PyTorch', 
    'Docker', 'AWS', 'NLP', 'Git', 'Flutter', 'UI/UX Design', 'Product Management'
  ];

  const categoriesList: OpportunityCategory[] = [
    'Hackathon', 'Scholarship', 'Internship', 'Grant', 'Tech Event'
  ];

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleCategory = (cat: OpportunityCategory) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleFinish = () => {
    completeOnboarding(
      selectedSkills.length > 0 ? selectedSkills : ['Python', 'React', 'Generative AI'],
      selectedCategories.length > 0 ? selectedCategories : ['Hackathon', 'Scholarship', 'Internship', 'Grant'],
      selectedLocation
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
        <div className="glass-panel relative w-full max-w-xl rounded-3xl p-6 sm:p-8 border-slate-700 shadow-2xl">
          
          {/* Wizard Step Indicator */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-bold text-xs">
                {step}/3
              </div>
              <span className="font-['Outfit'] font-bold text-white text-sm sm:text-base">
                Profile Setup & Radar Calibration
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-6 rounded-full transition-all ${step >= 1 ? 'bg-cyan-400' : 'bg-slate-800'}`} />
              <div className={`h-2 w-6 rounded-full transition-all ${step >= 2 ? 'bg-cyan-400' : 'bg-slate-800'}`} />
              <div className={`h-2 w-6 rounded-full transition-all ${step >= 3 ? 'bg-cyan-400' : 'bg-slate-800'}`} />
            </div>
          </div>

          {/* STEP 1: SKILLS SELECTOR & RESUME AUTO-FILL */}
          {step === 1 && (
            <div className="mt-6 space-y-4">
              
              {/* CV Auto-fill banner */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-cyan-400 shrink-0" />
                  <div>
                    <strong className="text-xs font-bold text-white">Have a Resume / CV?</strong>
                    <p className="text-[11px] text-slate-300">Upload your CV to extract your skills, title, and profile automatically.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResumeModalOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload CV
                </button>
              </div>

              <div className="flex items-center gap-2 text-cyan-400 pt-2">
                <Layers className="h-5 w-5" />
                <h3 className="font-['Outfit'] text-lg font-bold text-white">Select Your Core Technical & Academic Skills</h3>
              </div>
              <p className="text-xs text-slate-400">
                Click on the skills that match your experience. (Select at least 1 or 2 skills).
              </p>

              <div className="flex flex-wrap gap-2 pt-1 max-h-52 overflow-y-auto">
                {popularSkills.map(skill => {
                  const selected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                        selected 
                          ? 'bg-cyan-500 text-black border border-cyan-400 shadow-md shadow-cyan-500/20' 
                          : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '} {skill}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-end">
                <button
                  id="btn-wizard-next-1"
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
                >
                  Next: Target Opportunities <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORY SELECTOR */}
          {step === 2 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Award className="h-5 w-5" />
                <h3 className="font-['Outfit'] text-lg font-bold text-white">Target Opportunity Categories</h3>
              </div>
              <p className="text-xs text-slate-400">
                Select the types of opportunities you want OpportunityPulse AI to prioritize.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {categoriesList.map(cat => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center justify-between rounded-2xl p-3 text-xs font-semibold border transition-all ${
                        active 
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{cat} Opportunities</span>
                      {active && <Check className="h-4 w-4 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  id="btn-wizard-next-2"
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
                >
                  Next: Location Preference <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION & FINISH */}
          {step === 3 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Globe className="h-5 w-5" />
                <h3 className="font-['Outfit'] text-lg font-bold text-white">Preferred Location / Format</h3>
              </div>
              <p className="text-xs text-slate-400">
                Select your preferred opportunity format.
              </p>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {[
                  { id: 'Remote', label: '🌐 Remote Opportunities Only', desc: 'Work from home or anywhere worldwide' },
                  { id: 'Pakistan', label: '🇵🇰 Pakistan Local Opportunities', desc: 'Local hackathons, national grants, and domestic tech summits' },
                  { id: 'Global', label: '✈️ International / Global Exchange', desc: 'Scholarships, global exchange & study' },
                  { id: 'Hybrid', label: 'Hybrid Format', desc: 'Combination of remote and on-site opportunities' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedLocation(item.id as LocationPreference)}
                    className={`flex flex-col text-left rounded-2xl p-3.5 border transition-all ${
                      selectedLocation === item.id 
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <strong className="text-xs font-semibold text-white">{item.label}</strong>
                    <span className="text-[11px] text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  id="btn-wizard-finish"
                  type="button"
                  onClick={handleFinish}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" /> Launch My Opportunity Radar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />
    </>
  );
};
