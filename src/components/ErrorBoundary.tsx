import React from 'react';
import { reportClientError } from '../services/errorReporting';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-[#0B0F19] p-6 text-center text-slate-100">
          <section className="glass-panel max-w-md rounded-3xl p-8">
            <h1 className="font-['Outfit'] text-2xl font-bold">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-400">Your saved data has not been intentionally removed. Reload to restore the radar.</p>
            <button id="btn-recover-from-app-error" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Reload OpportunityPulse</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }

  public componentDidCatch(error: Error): void {
    reportClientError(error, { area: 'render', feature: 'application-shell', operation: 'render-boundary' });
  }
}
