import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { NotificationDeliveryRow } from '../types';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCcw,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  NotificationDeliveryRow['status'],
  { icon: React.ReactNode; color: string; label: string }
> = {
  sent: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: 'text-emerald-400',
    label: 'Sent',
  },
  queued: {
    icon: <Clock className="h-3.5 w-3.5" />,
    color: 'text-cyan-400',
    label: 'Queued',
  },
  failed: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-red-400',
    label: 'Failed',
  },
  suppressed: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'text-amber-400',
    label: 'Suppressed',
  },
};

export const NotificationHistoryPanel: React.FC = () => {
  const { isAuthenticated, supabaseUser } = useAuth();
  const [deliveries, setDeliveries] = useState<NotificationDeliveryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadHistory = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !supabaseUser || !isSupabaseConfigured) {
      setDeliveries([]);
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    try {
        const { data, error } = await supabase
          .from('notification_deliveries')
          .select('*')
          .eq('user_id', supabaseUser.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          setFetchError('Could not load notification history. Please retry.');
        } else {
          setDeliveries((data ?? []) as NotificationDeliveryRow[]);
        }
      } catch {
        setFetchError('Could not load notification history. Please retry.');
      } finally {
        setIsLoading(false);
      }
  }, [isAuthenticated, supabaseUser]);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
        <Lock className="h-8 w-8 text-slate-600" />
        <p className="text-sm font-medium">Sign in to view notification history</p>
        <p className="text-xs text-slate-500">
          Notification delivery records are only available for authenticated users.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading notification history…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Failed to load notification history</p>
          <p className="text-red-400/80 mt-0.5">{fetchError}</p>
        </div>
        <button id="btn-retry-notification-history" type="button" onClick={() => void loadHistory()} className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 px-2.5 py-1.5 font-semibold hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-300"><RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> Retry</button>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
        <Bell className="h-8 w-8 text-slate-600" />
        <p className="text-sm font-medium">No notifications sent yet</p>
        <p className="text-xs text-slate-500">
          When alert emails are dispatched for your matched opportunities, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      id="notification-history-panel"
      aria-label="Notification history"
      className="space-y-2"
    >
      <p className="text-xs text-slate-500 mb-3">
        Showing last {deliveries.length} notification event{deliveries.length === 1 ? '' : 's'}.
        This is a read-only audit log.
      </p>

      {deliveries.map((delivery) => {
        const cfg = STATUS_CONFIG[delivery.status];
        const createdAt = new Date(delivery.created_at);
        const formattedDate = createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={delivery.id}
            id={`notification-delivery-${delivery.id}`}
            className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 transition-colors hover:border-slate-700"
          >
            <span className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  Opportunity: <span className="font-mono text-slate-400">{delivery.opportunity_id}</span>
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    delivery.status === 'sent'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : delivery.status === 'failed'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : delivery.status === 'suppressed'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Window: {delivery.delivery_window} · {formattedDate}
              </p>
              {delivery.provider_message_id && (
                <p className="text-[10px] text-slate-600 mt-0.5 font-mono truncate">
                  Msg ID: {delivery.provider_message_id}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
