import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CareerLevel } from '../types';
import { X, Lock, Mail, User, Sparkles, LogIn, UserPlus, AlertCircle, CheckCircle2, Loader2, ArrowRight, Shield } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authMode, 
    setAuthMode, 
    login, 
    signup,
    continueAsGuest,
    isSupabaseConfigured
  } = useAuth();

  // Form inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupMajor, setSignupMajor] = useState('Software Engineering');
  const [signupLevel, setSignupLevel] = useState<CareerLevel>('Experienced Professional');

  // Async state & notices
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const res = await login(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Login failed.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const res = await signup({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      major: signupMajor,
      academicLevel: signupLevel,
      skills: ['React', 'Python', 'Generative AI', 'JavaScript'],
      targetCategories: ['Hackathon', 'Scholarship', 'Internship'],
      preferredLocation: 'Remote',
      bio: `${signupLevel} specializing in ${signupMajor}.`
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Signup failed.');
    } else if (res.requiresConfirmation) {
      setSuccessMsg(res.message || 'Account created! Please check your email inbox to confirm your account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white relative w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-5 top-5 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-['Outfit'] text-2xl font-bold text-slate-900 mt-3">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {authMode === 'login' 
              ? 'Access your personalized opportunity radar & copilot' 
              : 'Join OpportunityPulse AI for persistent tracking'}
          </p>

          {/* Backend configuration status badge */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px]">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 font-medium text-emerald-400">
                <Shield className="h-3 w-3" /> Supabase Postgres Auth Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 font-medium text-amber-400">
                <Shield className="h-3 w-3" /> Local Guest Preview Mode Active
              </span>
            )}
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-5 flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            id="tab-auth-login"
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              authMode === 'login' 
                ? 'bg-cyan-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Log In
          </button>
          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              authMode === 'signup' 
                ? 'bg-cyan-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm shadow-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm shadow-sm"
                  required
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Log In
                </>
              )}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <div className="relative mt-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-signup-name"
                  type="text"
                  placeholder="e.g. Fatima Ali"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none w-full rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm shadow-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none w-full rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm shadow-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Title / Specialization / Major</label>
              <input
                id="input-signup-major"
                type="text"
                placeholder="e.g. Software Engineer, Data Scientist, CS Student"
                value={signupMajor}
                onChange={e => setSignupMajor(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none mt-1 w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm shadow-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Career Stage</label>
                <select
                  id="select-signup-level"
                  value={signupLevel}
                  onChange={e => setSignupLevel(e.target.value as CareerLevel)}
                  className="bg-white border border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none mt-1 w-full rounded-xl px-3 py-2 text-xs shadow-sm"
                >
                  <option value="Experienced Professional">Experienced Professional</option>
                  <option value="Freelancer / Self-Taught">Freelancer / Self-Taught</option>
                  <option value="Fresh Graduate">Fresh Graduate</option>
                  <option value="Undergraduate Student">Undergraduate Student</option>
                  <option value="Postgraduate (MS/PhD)">Postgraduate (MS/PhD)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <input
                  id="input-signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none mt-1 w-full rounded-xl px-3 py-2 text-xs shadow-sm"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              id="btn-submit-signup"
              type="submit"
              disabled={isSubmitting}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Create Account & Start Setup
                </>
              )}
            </button>
          </form>
        )}

        {/* Guest Preview Action */}
        <div className="border-t border-slate-200 mt-5 pt-4 text-center">
          <button
            id="btn-continue-guest-preview"
            type="button"
            onClick={continueAsGuest}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-sm"
          >
            <span>Continue as Guest (Local Heuristic Preview)</span>
            <ArrowRight className="h-3.5 w-3.5 text-cyan-600" />
          </button>
        </div>

      </div>
    </div>
  );
};
