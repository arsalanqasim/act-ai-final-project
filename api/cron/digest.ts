import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

function send(res: ServerResponse, status: number, body: unknown) { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); }
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return send(res, 401, { error: 'Unauthorized' });
  const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; const resend = process.env.RESEND_API_KEY; const from = process.env.EMAIL_FROM;
  if (!url || !key || !resend || !from) return send(res, 503, { error: 'Notification service is not configured' });
  const admin = createClient(url, key);
  const { data: prefs, error } = await admin.from('notification_preferences').select('*').eq('enabled', true);
  if (error) return send(res, 500, { error: 'Could not load preferences' });
  let sent = 0;
  for (const preference of prefs ?? []) {
    const { data: profile } = await admin.from('profiles').select('email,name').eq('id', preference.user_id).maybeSingle();
    const { data: opportunities } = await admin.from('custom_opportunities').select('*').eq('user_id', preference.user_id).limit(5);
    if (!profile?.email || !opportunities?.length) continue;
    const window = new Date().toISOString().slice(0, preference.frequency === 'weekly' ? 7 : 10);
    const { data: alreadySent } = await admin.from('notification_deliveries').select('opportunity_id').eq('user_id', preference.user_id).eq('delivery_window', window).in('opportunity_id', opportunities.map(opp => opp.id));
    const fresh = opportunities.filter(opp => !alreadySent?.some(row => row.opportunity_id === opp.id));
    if (!fresh.length) continue;
    const text = fresh.map(opp => `${opp.title} — ${opp.organization}\nDeadline: ${opp.deadline}\nApply: ${opp.apply_url}`).join('\n\n');
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [profile.email], subject: 'Your OpportunityPulse opportunity digest', text }) });
    if (!response.ok) { await admin.from('notification_deliveries').upsert(fresh.map(opp => ({ user_id: preference.user_id, opportunity_id: opp.id, delivery_window: window, status: 'failed' })), { onConflict: 'user_id,opportunity_id,delivery_window' }); continue; }
    await admin.from('notification_deliveries').upsert(fresh.map(opp => ({ user_id: preference.user_id, opportunity_id: opp.id, delivery_window: window, status: 'sent', sent_at: new Date().toISOString(), metadata: { source: 'cron' } })), { onConflict: 'user_id,opportunity_id,delivery_window' });
    sent += fresh.length;
  }
  return send(res, 200, { ok: true, sent });
}
