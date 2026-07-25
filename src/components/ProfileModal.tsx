import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile, CareerLevel, LocationPreference, OpportunityCategory } from '../types';
import { X, Save, Plus, User, Upload } from 'lucide-react';
import { ResumeUploadModal } from './ResumeUploadModal';

export const ProfileModal: React.FC = () => {
  const { userProfile, setUserProfile, isProfileOpen, setIsProfileOpen } = useApp();

  const [formData, setFormData] = useState<UserProfile>({ ...userProfile });
  const [newSkill, setNewSkill] = useState('');
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto">
        <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl my-8">
          
          {/* Close Button */}
          <button
            id="btn-close-profile-modal"
            onClick={() => setIsProfileOpen(false)}
            className="absolute right-5 top-5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:text-slate-900 hover:border-slate-300"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-['Outfit'] text-xl font-bold text-slate-900">Edit Professional Profile</h2>
                <p className="text-xs text-slate-500">Match scores automatically recalculate based on your skills & preferences.</p>
              </div>
            </div>

            {/* Resume Upload Trigger Button */}
            <button
              type="button"
              onClick={() => setIsResumeModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-50 border border-cyan-200 px-3.5 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 transition-all self-start sm:self-auto"
            >
              <Upload className="h-4 w-4" /> Upload CV / Auto-Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            
            {/* Name & Email */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  id="input-profile-name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-xs sm:text-sm shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  id="input-profile-email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-xs sm:text-sm shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Major/Title & Career Level */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Title / Major / Specialization</label>
                <input
                  id="input-profile-major"
                  type="text"
                  placeholder="e.g. Software Engineer, Data Scientist, CS Student"
                  value={formData.major}
                  onChange={e => setFormData({ ...formData, major: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-xs sm:text-sm shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Career & Academic Stage</label>
                <select
                  id="select-profile-academic-level"
                  value={formData.academicLevel}
                  onChange={e => setFormData({ ...formData, academicLevel: e.target.value as CareerLevel })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-xs sm:text-sm shadow-sm"
                >
                  <option value="Experienced Professional">Experienced Professional / Developer</option>
                  <option value="Freelancer / Self-Taught">Freelancer / Independent Developer</option>
                  <option value="Fresh Graduate">Fresh Graduate</option>
                  <option value="Postgraduate (MS/PhD)">Postgraduate (MS / PhD / Researcher)</option>
                  <option value="Undergraduate Student">Undergraduate Student</option>
                  <option value="High School / A-Levels">High School / A-Levels</option>
                </select>
              </div>
            </div>

            {/* Location Preference */}
            <div>
              <label className="text-xs font-semibold text-slate-700">Preferred Opportunity Location Format</label>
              <select
                id="select-profile-location"
                value={formData.preferredLocation}
                onChange={e => setFormData({ ...formData, preferredLocation: e.target.value as LocationPreference })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-xs sm:text-sm shadow-sm"
              >
                <option value="Remote">🌐 Remote Opportunities Only</option>
                <option value="Pakistan">🇵🇰 Pakistan Local Opportunities</option>
                <option value="Global">✈️ International Study & Exchange (Global)</option>
                <option value="Hybrid">Hybrid (Remote + In-Person)</option>
              </select>
            </div>

            {/* Target Categories */}
            <div>
              <label className="text-xs font-semibold text-slate-700">Target Opportunity Types</label>
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
                          ? 'bg-cyan-600 text-white border border-cyan-600' 
                          : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300'
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
              <label className="text-xs font-semibold text-slate-700">Core Technical & Professional Skills</label>
              
              {/* Add Skill Input */}
              <div className="mt-1.5 flex gap-2">
                <input
                  id="input-add-skill"
                  type="text"
                  placeholder="Add skill (e.g. PyTorch, React, SQL, Cloud)..."
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-xs sm:text-sm shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="flex items-center gap-1 rounded-xl bg-cyan-50 border border-cyan-200 px-4 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {/* Skill Tags list */}
              <div className="mt-3 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {formData.skills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-500 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="border-t border-slate-200 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
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

      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />
    </>
  );
};
