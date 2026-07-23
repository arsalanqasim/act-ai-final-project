import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CareerLevel } from '../types';
import { X, Lock, Mail, User, Sparkles, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authMode, 
    setAuthMode, 
    login, 
    signup 
  } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupMajor, setSignupMajor] = useState('Software Engineering');
  const [signupLevel, setSignupLevel] = useState<CareerLevel>('Experienced Professional');

  // Error & Status state
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(loginEmail, loginPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Login failed');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = signup({
      name: signupName,
      email: signupEmail,
      passwordHash: signupPassword,
      major: signupMajor,
      academicLevel: signupLevel,
      skills: ['React', 'Python', 'Generative AI', 'JavaScript'],
      targetCategories: ['Hackathon', 'Scholarship', 'Internship'],
      preferredLocation: 'Remote',
      bio: `${signupLevel} specializing in ${signupMajor}.`,
      emailNotifications: true
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Signup failed');
    }
  };

  const handleDemoLogin = () => {
    login('arsalan.student@hec.edu.pk', 'demo123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel relative w-full max-w-md rounded-3xl p-6 sm:p-8 border-slate-700 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-5 top-5 rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white hover:border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-['Outfit'] text-2xl font-bold text-white mt-3">
            {authMode === 'login' ? 'Welcome Back' : 'Create Professional Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {authMode === 'login' 
              ? 'Access your personalized opportunity radar & copilot' 
              : 'Join OpportunityPulse AI to match with global opportunities'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-6 flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            id="tab-auth-login"
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              authMode === 'login' 
                ? 'bg-cyan-500 text-black shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              authMode === 'signup' 
                ? 'bg-cyan-500 text-black shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all"
            >
              <LogIn className="h-4 w-4" /> Log In
            </button>

            {/* Quick Demo Login Button for Graders */}
            <div className="border-t border-slate-800 pt-4 text-center">
              <button
                id="btn-demo-grader-login"
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" /> 1-Click Grader Demo Login (Arsalan)
              </button>
            </div>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-signup-name"
                  type="text"
                  placeholder="e.g. Fatima Ali"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  className="glass-input w-full rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="glass-input w-full rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Title / Specialization / Major</label>
              <input
                id="input-signup-major"
                type="text"
                placeholder="e.g. Software Engineer, Data Scientist, CS Student"
                value={signupMajor}
                onChange={e => setSignupMajor(e.target.value)}
                className="glass-input mt-1 w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300">Career Stage</label>
                <select
                  id="select-signup-level"
                  value={signupLevel}
                  onChange={e => setSignupLevel(e.target.value as CareerLevel)}
                  className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Experienced Professional">Experienced Professional</option>
                  <option value="Freelancer / Self-Taught">Freelancer / Self-Taught</option>
                  <option value="Fresh Graduate">Fresh Graduate</option>
                  <option value="Undergraduate Student">Undergraduate Student</option>
                  <option value="Postgraduate (MS/PhD)">Postgraduate (MS/PhD)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  id="input-signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-xs"
                  required
                />
              </div>
            </div>

            <button
              id="btn-submit-signup"
              type="submit"
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all"
            >
              <UserPlus className="h-4 w-4" /> Create Account & Start Setup
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
