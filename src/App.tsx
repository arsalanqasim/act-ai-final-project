import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { StatsOverview } from './components/StatsOverview';
import { OpportunityFeed } from './components/OpportunityFeed';
import { ProfileModal } from './components/ProfileModal';
import { LinkIngesterModal } from './components/LinkIngesterModal';
import { CopilotModal } from './components/CopilotModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { ApplicationWorkspaceModal } from './components/ApplicationWorkspaceModal';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { Zap, Github, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const isOnline = useNetworkStatus();
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      <div>
        {!isOnline && <div role="status" className="bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-slate-950">You are offline. New changes will not sync until your connection returns.</div>}
        {/* Navigation Bar */}
        <Navbar />

        {/* Hero Header */}
        <HeroHeader />

        {/* Stats Overview */}
        <StatsOverview />

        {/* Main Opportunity Feed & Filters */}
        <OpportunityFeed />
      </div>

      {/* Modals & Wizards */}
      <ProfileModal />
      <LinkIngesterModal />
      <CopilotModal />
      <SettingsModal />
      <AuthModal />
      <OnboardingWizard />

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

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ApplicationProvider>
          <AppContent />
          <ApplicationWorkspaceModal />
        </ApplicationProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
