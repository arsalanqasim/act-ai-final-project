import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseResumeWithGemini } from '../services/geminiService';
import { X, FileText, Upload, Loader2, CheckCircle2, UserCheck } from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ isOpen, onClose }) => {
  const { setUserProfile, userProfile } = useApp();
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSuccess, setExtractedSuccess] = useState(false);

  if (!isOpen) return null;

  // File Upload Reader Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setResumeText(content);
      }
    };

    reader.readAsText(file);
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setIsExtracting(true);
    setExtractedSuccess(false);

    try {
      const extracted = await parseResumeWithGemini(resumeText);
      setUserProfile({
        ...userProfile,
        name: extracted.name || userProfile.name,
        email: extracted.email || userProfile.email,
        major: extracted.major || userProfile.major,
        academicLevel: extracted.academicLevel || userProfile.academicLevel,
        skills: extracted.skills.length > 0 ? extracted.skills : userProfile.skills,
        targetCategories: extracted.targetCategories.length > 0 ? extracted.targetCategories : userProfile.targetCategories,
        preferredLocation: extracted.preferredLocation || userProfile.preferredLocation,
        bio: extracted.bio || userProfile.bio,
        isOnboarded: true
      });

      setExtractedSuccess(true);
      setTimeout(() => {
        setExtractedSuccess(false);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to parse resume:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const sampleResumeText = `Arsalan Qasim
Senior Full-Stack Engineer & AI Developer
Email: arsalan.dev@example.com
Location: Remote / Pakistan

SUMMARY:
Experienced software developer with 4+ years of expertise in building scalable React, TypeScript, Python, and Node.js applications. Passionate about Generative AI, agentic workflows, and cloud architecture.

TECHNICAL SKILLS:
- Languages & Frameworks: Python, JavaScript, TypeScript, React, Node.js, FastAPI, SQL, Tailwind CSS
- AI & Machine Learning: Gemini API, OpenAI API, LangChain, PyTorch, Vector Databases
- Tools & Cloud: Git, Docker, PostgreSQL, MongoDB, Vercel, AWS`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel relative w-full max-w-xl rounded-3xl p-6 sm:p-8 border-slate-700 shadow-2xl">
        
        {/* Close Button */}
        <button
          id="btn-close-resume-modal"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-xl font-bold text-white">CV / Resume Extractor Agent</h2>
            <p className="text-xs text-slate-400">Upload your CV to automatically set up your skills, title & goals in 1-click.</p>
          </div>
        </div>

        <form onSubmit={handleExtract} className="mt-6 space-y-4">
          
          {/* File Drag & Drop Upload Zone */}
          <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-5 text-center hover:border-cyan-500/50 transition-colors">
            <Upload className="mx-auto h-8 w-8 text-cyan-400" />
            <p className="mt-2 text-xs font-semibold text-slate-200">
              {fileName ? `File Selected: ${fileName}` : 'Upload a plain-text CV / Resume file (.txt)'}
            </p>
            <label className="mt-3 inline-block cursor-pointer rounded-xl bg-slate-800 border border-slate-700 px-4 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-slate-700">
              Choose File
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase">Or Paste CV Text</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Textarea Paste */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Resume / CV Content</label>
              <button
                type="button"
                onClick={() => setResumeText(sampleResumeText)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Paste Sample CV
              </button>
            </div>
            <textarea
              id="textarea-resume-text-input"
              rows={6}
              placeholder="Paste your CV text, LinkedIn summary, or bio here..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              className="glass-input w-full rounded-2xl p-4 text-xs sm:text-sm font-mono leading-relaxed"
              required
            />
          </div>

          {/* Status Message */}
          {extractedSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Success! Your profile, skills & preferences have been updated from your CV!</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="border-t border-slate-800 pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              id="btn-run-resume-extract"
              type="submit"
              disabled={isExtracting || !resumeText.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Extracting Profile...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" /> Extract Profile & Auto-Fill
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
