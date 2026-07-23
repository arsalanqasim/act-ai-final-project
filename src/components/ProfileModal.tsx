import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile, AcademicLevel, LocationPreference, OpportunityCategory } from '../types';
import { X, Save, Plus, Trash2, User, Target, GraduationCap } from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { userProfile, setUserProfile, isProfileOpen, setIsProfileOpen } = useApp();

  const [formData, setFormData] = useState<UserProfile>({ ...userProfile });
  const [newSkill, setNewSkill] = useState('');

  if (!isProfileOpen) return null;

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const toggleCategory = (cat: OpportunityCategory) => {
    setFormData(prev => {
      const exists = prev.targetCategories.includes(cat);
      const updated = exists 
        ? prev.targetCategories.filter(c => c !== cat)
        : [...prev.targetCategories, cat];
      return { ...prev, targetCategories: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile(formData);
    setIsProfileOpen(false);
  };

  const categoriesList: OpportunityCategory[] = ['Hackathon', 'Scholarship', 'Internship', 'Grant', 'Tech Event'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-slate-700 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          id="btn-close-profile-modal"
          onClick={() => setIsProfileOpen(false)}
          className="absolute right-5 top-5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-xl font-bold text-white">Edit Candidate Profile</h2>
            <p className="text-xs text-slate-400">Match scores automatically recalculate based on your skills & preferences.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          
          {/* Name & Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <input
                id="input-profile-name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="glass-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                id="input-profile-email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="glass-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          {/* Major & Academic Level */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Degree / Major</label>
              <input
                id="input-profile-major"
                type="text"
                placeholder="e.g. Computer Science, Software Engineering"
                value={formData.major}
                onChange={e => setFormData({ ...formData, major: e.target.value })}
                className="glass-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Academic Level</label>
              <select
                id="select-profile-academic-level"
                value={formData.academicLevel}
                onChange={e => setFormData({ ...formData, academicLevel: e.target.value as AcademicLevel })}
                className="glass-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm"
              >
                <option value="Undergraduate">Undergraduate Student</option>
                <option value="Postgraduate">Postgraduate (MS/PhD)</option>
                <option value="Fresh Graduate">Fresh Graduate</option>
                <option value="High School">High School / A-Levels</option>
              </select>
            </div>
          </div>

          {/* Location Preference */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Preferred Location Format</label>
            <select
              id="select-profile-location"
              value={formData.preferredLocation}
              onChange={e => setFormData({ ...formData, preferredLocation: e.target.value as LocationPreference })}
              className="glass-input mt-1.5 w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm"
            >
              <option value="Remote">🌐 Remote Opportunities Only</option>
              <option value="Pakistan">🇵🇰 Pakistan Local Opportunities</option>
              <option value="Global">✈️ International Study & Exchange (Global)</option>
              <option value="Hybrid">Hybrid (Remote + In-Person)</option>
            </select>
          </div>

          {/* Target Categories */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Target Opportunity Types</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoriesList.map(cat => {
                const active = formData.targetCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      active 
                        ? 'bg-cyan-500 text-black border border-cyan-400' 
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {active ? '✓ ' : '+ '} {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills Management */}
          <div>
            <label className="text-xs font-semibold text-slate-300">Core Technical & Academic Skills</label>
            
            {/* Add Skill Input */}
            <div className="mt-1.5 flex gap-2">
              <input
                id="input-add-skill"
                type="text"
                placeholder="Add skill (e.g. PyTorch, React, SQL, NLP)..."
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                className="glass-input flex-1 rounded-xl px-3.5 py-2 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="flex items-center gap-1 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            {/* Skill Tags list */}
            <div className="mt-3 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {formData.skills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="border-t border-slate-800 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              id="btn-save-profile"
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90"
            >
              <Save className="h-4 w-4" /> Save Profile & Recalculate
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
