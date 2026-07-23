import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

type Frequency = 'immediate' | 'daily' | 'weekly';
interface Props { isOpen: boolean; onClose: () => void; }

export const NotificationPreferencesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isAuthenticated, supabaseUser, setIsAuthModalOpen, setAuthMode } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [minimumScore, setMinimumScore] = useState(70);
  const [hour, setHour] = useState(9);
  const [message, setMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useAccessibleModal(isOpen, dialogRef, onClose);
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !supabaseUser || !isSupabaseConfigured) return;
    supabase.from('notification_preferences').select('*').eq('user_id', supabaseUser.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) setMessage('Could not load your preferences.');
        if (data) { setEnabled(data.enabled); setFrequency(data.frequency as Frequency); setMinimumScore(data.minimum_match_score); setHour(data.digest_hour); }
      });
  }, [isOpen, isAuthenticated, supabaseUser]);
  if (!isOpen) return null;
  if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
    return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="presentation">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="notification-preferences-title" className="glass-panel w-full max-w-lg rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 id="notification-preferences-title" className="font-['Outfit'] text-xl font-bold text-white">Email alerts</h2><p className="mt-1 text-xs text-slate-400">Account-only settings for secure email delivery.</p></div><button id="btn-close-notification-preferences" aria-label="Close notification preferences" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X /></button></div>
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"><p className="font-semibold">Sign in required</p><p className="mt-1 text-xs text-amber-300/80">Email alert preferences are not available in guest mode. Sign in to securely save them to your account.</p></div>
        <div className="mt-6 flex justify-end gap-3"><button id="btn-cancel-notification-preferences" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-300">Close</button><button id="btn-sign-in-notification-preferences" onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); onClose(); }} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Sign in</button></div>
      </section>
    </div>;
  }
  const save = async () => {
    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      setAuthMode('login'); setIsAuthModalOpen(true); return;
    }
    const { error } = await supabase.from('notification_preferences').upsert({
      user_id: supabaseUser.id, enabled, frequency, minimum_match_score: minimumScore,
      digest_hour: hour, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, categories: []
    });
    setMessage(error ? 'Could not save notification preferences.' : 'Preferences saved. Your next eligible digest will be sent securely.');
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="presentation">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="notification-preferences-title" className="glass-panel w-full max-w-lg rounded-3xl p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 id="notification-preferences-title" className="font-['Outfit'] text-xl font-bold text-white">Email alerts</h2><p className="mt-1 text-xs text-slate-400">Relevant, deduplicated opportunities only. No browser API keys.</p></div><button id="btn-close-notification-preferences" aria-label="Close notification preferences" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X /></button></div>
      <div className="mt-6 space-y-5 text-sm text-slate-300">
        <label className="flex items-center justify-between"><span><strong>Enable email alerts</strong><small className="mt-1 block text-xs text-slate-500">You can turn these off at any time.</small></span><input id="input-notification-enabled" type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="h-5 w-5" /></label>
        <label className="block">Frequency<select id="select-notification-frequency" value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} className="glass-input mt-1 w-full rounded-xl p-2"><option value="immediate">Immediate</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option></select></label>
        <label className="block">Minimum match score: <strong>{minimumScore}%</strong><input id="input-notification-score" type="range" min="40" max="95" value={minimumScore} onChange={e => setMinimumScore(Number(e.target.value))} className="mt-2 w-full" /></label>
        <label className="block">Digest hour (local time)<input id="input-notification-hour" type="number" min="0" max="23" value={hour} onChange={e => setHour(Number(e.target.value))} className="glass-input mt-1 w-full rounded-xl p-2" /></label>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl bg-slate-900 p-3 text-xs text-cyan-200">{message}</p>}
      <div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-300">Cancel</button><button id="btn-save-notification-preferences" onClick={save} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Save preferences</button></div>
    </section>
  </div>;
};
