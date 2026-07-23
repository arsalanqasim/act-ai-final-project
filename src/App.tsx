import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { ActionTaskProvider } from './context/ActionTaskContext';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { StatsOverview } from './components/StatsOverview';
import { OpportunityFeed } from './components/OpportunityFeed';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useApp } from './context/AppContext';
import { useApplications } from './context/ApplicationContext';
import { LoadingFallback } from './components/LoadingFallback';
import { applyServiceWorkerUpdate, subscribeToServiceWorkerUpdates } from './pwa';
import { Zap, Github, Heart, RefreshCcw, WifiOff } from 'lucide-react';

const ProfileModal = lazy(() => import('./components/ProfileModal').then(module => ({ default: module.ProfileModal })));
const LinkIngesterModal = lazy(() => import('./components/LinkIngesterModal').then(module => ({ default: module.LinkIngesterModal })));
const CopilotModal = lazy(() => import('./components/CopilotModal').then(module => ({ default: module.CopilotModal })));
const ApplicationWorkspaceModal = lazy(() => import('./components/ApplicationWorkspaceModal').then(module => ({ default: module.ApplicationWorkspaceModal })));
const CareerCommandCenterModal = lazy(() => import('./components/CareerCommandCenterModal').then(module => ({ default: module.CareerCommandCenterModal })));

const DeferredModal: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => (
  <Suspense fallback={<div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><LoadingFallback label={label} /></div>}>
    {children}
  </Suspense>
);

const UpdateAvailablePrompt: React.FC = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  useEffect(() => subscribeToServiceWorkerUpdates(() => setIsUpdateAvailable(true)), []);
  if (!isUpdateAvailable) return null;
  return (
    <div id="pwa-update-prompt" role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 z-[60] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-cyan-400/40 bg-slate-950/95 p-4 text-sm text-slate-100 shadow-2xl sm:left-auto sm:right-6">
      <span>A newer OpportunityPulse version is ready.</span>
      <button id="btn-refresh-pwa-update" type="button" onClick={applyServiceWorkerUpdate} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300">
        <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh
      </button>
    </div>
  );
};

const AppContent: React.FC = () => {
  const isOnline = useNetworkStatus();
  const { isProfileOpen, isIngesterOpen, copilotOpp, dataError, retryDataLoad } = useApp();
  const { activeModalOpp } = useApplications();
  const [isCareerCenterOpen, setIsCareerCenterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      <div>
        {!isOnline && <div id="offline-status-banner" role="status" aria-live="polite" className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-slate-950"><WifiOff className="h-3.5 w-3.5" aria-hidden="true" />You are offline. New changes will stay local until your connection returns.</div>}
        {dataError && <div id="data-sync-error-banner" role="alert" aria-live="assertive" className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200"><span>{dataError}</span><button id="btn-retry-data-sync" type="button" onClick={() => void retryDataLoad()} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-300"><RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />Retry sync</button></div>}
        {/* Navigation Bar */}
        <Navbar onOpenCareerCenter={() => setIsCareerCenterOpen(true)} />

        {/* Hero Header */}
        <HeroHeader />

        {/* Stats Overview */}
        <StatsOverview />

        {/* Main Opportunity Feed & Filters */}
        <OpportunityFeed />
      </div>

      {/* Modals & Wizards */}
      {isProfileOpen && <DeferredModal label="Loading profile editor…"><ProfileModal /></DeferredModal>}
      {isIngesterOpen && <DeferredModal label="Loading opportunity ingester…"><LinkIngesterModal /></DeferredModal>}
      {copilotOpp && <DeferredModal label="Loading application copilot…"><CopilotModal /></DeferredModal>}
      <SettingsModal />
      <AuthModal />
      <OnboardingWizard />

      {/* Phase 4: Career Command Center */}
      {isCareerCenterOpen && <DeferredModal label="Loading career workspace…"><CareerCommandCenterModal isOpen onClose={() => setIsCareerCenterOpen(false)} /></DeferredModal>}
      {activeModalOpp && <DeferredModal label="Loading application workspace…"><ApplicationWorkspaceModal /></DeferredModal>}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 mt-16">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[10px]">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="font-['Outfit'] font-bold text-slate-200">OpportunityPulse AI</span>
            <span>— HEC ACT-AI Skill Bridge Gap Final Project</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              id="link-github-repo-footer"
              href="https://github.com/arsalanqasim/act-ai-final-project"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" /> GitHub Repository
            </a>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-slate-400">
              Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for Pakistani Youth
            </span>
          </div>

        </div>
      </footer>
      <UpdateAvailablePrompt />

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ApplicationProvider>
          <ActionTaskProvider>
            <AppContent />
          </ActionTaskProvider>
        </ApplicationProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
