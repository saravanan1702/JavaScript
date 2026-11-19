import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CircleAlert, CircleCheck, Copy, ExternalLink, Film, KeyRound, LoaderCircle, MessageCircle, RefreshCw, Unplug, Link2, Webhook,
} from 'lucide-react';
import { api } from '../api/client.js';
import { FilterTabs, PageHeader, Toggle } from '../components/ui.jsx';
import SystemStatus from '../components/SystemStatus.jsx';

const RESULT_MESSAGES = {
  connected: { tone: 'success', text: 'Instagram connected! Your Reels are being synced.' },
  partial: {
    tone: 'warn',
    text: 'Instagram connected, but some permissions were not granted. Comment replies or DMs may not work — reconnect and allow all permissions.',
  },
  error: {
    denied: 'You cancelled the Instagram login. Nothing was connected.',
    state_invalid: 'The connection link expired or was opened in a different browser. Please click “Connect Instagram” again.',
    missing_code: 'Instagram did not return an authorization code. Please try again.',
    oauth_error: 'Instagram returned an error. Please try again.',
    connect_failed: 'Could not finish connecting. Check the Logs page and that your app ID/secret and redirect URI are correct.',
  },
};

const SCOPE_LABELS = {
  instagram_business_basic: 'Profile & Reels',
  instagram_business_manage_comments: 'Reply to comments',
  instagram_business_manage_messages: 'Send DMs',
};

function Banner({ tone, children, onClose }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  }[tone];
  const Icon = tone === 'success' ? CircleCheck : CircleAlert;
  return (
    <div role="status" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{children}</p>
      {onClose && (
        <button type="button" onClick={onClose} className="text-xs font-medium opacity-70 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    active: ['Connected', 'bg-emerald-50 text-emerald-700'],
    token_expired: ['Reconnect needed', 'bg-red-50 text-red-700'],
    disconnected: ['Disconnected', 'bg-slate-100 text-slate-600'],
    error: ['Error', 'bg-red-50 text-red-700'],
  };
  const [label, cls] = map[status] ?? [status, 'bg-slate-100 text-slate-600'];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}

function Avatar({ account }) {
  const [broken, setBroken] = useState(false);
  if (account.profilePictureUrl && !broken) {
    return (
      <img
        src={account.profilePictureUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-100"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-brand via-brand-500 to-accent-500 text-lg font-semibold text-white">
      {account.username?.[0]?.toUpperCase()}
    </div>
  );
}

function ReelCard({ reel }) {
  const [broken, setBroken] = useState(false);
  return (
    <a
      href={reel.permalink || '#'}
      target="_blank"
      rel="noreferrer noopener"
      className="group overflow-hidden rounded-xl border border-slate-200/70 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[9/16] bg-slate-100">
        {reel.thumbnailUrl && !broken ? (
          <img
            src={reel.thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Film className="h-8 w-8" />
          </div>
        )}
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
          <MessageCircle className="h-3 w-3" /> {reel.commentsCount ?? 0}
        </span>
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs text-slate-700">{reel.caption || <span className="text-slate-400">No caption</span>}</p>
        {reel.postedAt && <p className="mt-1 text-[11px] text-slate-400">{new Date(reel.postedAt).toLocaleDateString()}</p>}
      </div>
    </a>
  );
}

function InstagramSettings() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(''); // which action is running
  const [notice, setNotice] = useState(null);
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  // Show the result of the Instagram redirect once, then clean the URL.
  useEffect(() => {
    const result = params.get('instagram');
    if (!result) return;
    if (result === 'error') {
      setNotice({ tone: 'error', text: RESULT_MESSAGES.error[params.get('reason')] ?? 'Connection failed.' });
    } else if (RESULT_MESSAGES[result]) {
      setNotice(RESULT_MESSAGES[result]);
    }
    setParams({}, { replace: true });
  }, [params, setParams]);

  const account = accounts.find((a) => a.status !== 'disconnected') ?? null;

  const load = useCallback(async () => {
    try {
      const [s, a, w] = await Promise.all([api.get('/health/status'), api.get('/instagram/accounts'), api.get('/instagram/webhook-info')]);
      setStatus(s);
      setWebhookInfo(w);
      setAccounts(a.accounts);
      const current = a.accounts.find((x) => x.status !== 'disconnected');
      setReels(current ? (await api.get(`/instagram/accounts/${current.id}/media?reelsOnly=true&limit=24`)).media : []);
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The first media sync runs in the background right after connecting — poll briefly for it.
  useEffect(() => {
    if (!account || account.mediaSyncedAt || account.status !== 'active') return undefined;
    const t = setTimeout(load, 3000);
    return () => clearTimeout(t);
  }, [account, load]);

  async function run(action, fn, successText) {
    setBusy(action);
    setNotice(null);
    try {
      await fn();
      if (successText) setNotice({ tone: 'success', text: successText });
      await load();
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  }

  async function connect() {
    setBusy('connect');
    try {
      const { url } = await api.get('/instagram/connect');
      window.location.assign(url); // full-page redirect to Instagram's login/consent screen
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
      setBusy('');
    }
  }

  if (loading) return <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />;

  const appConfigured = status?.integrations?.instagramAppConfigured;

  return (
    <div className="space-y-6">
      {notice && <Banner tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Banner>}

      <section className="card">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">Instagram account</h2>
          {account && <StatusPill status={account.status} />}
        </div>

        {!appConfigured && (
          <div className="mt-4">
            <Banner tone="warn">
              Add <code className="font-mono">INSTAGRAM_APP_ID</code> and <code className="font-mono">INSTAGRAM_APP_SECRET</code> to{' '}
              <code className="font-mono">backend/.env</code> and restart the backend. Follow{' '}
              <code className="font-mono">docs/PHASE-2-META-SETUP.md</code>.
            </Banner>
          </div>
        )}

        {appConfigured && !account && (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Link2 className="h-6 w-6" />
            </div>
            <p className="mt-4 font-medium text-slate-900">No Instagram account connected</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              You’ll log in on Instagram’s own page and approve access. Your password is never shared with this app.
            </p>
            <button type="button" onClick={connect} disabled={busy === 'connect'} className="btn-primary mt-5">
              {busy === 'connect' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Connect Instagram
            </button>
          </div>
        )}

        {account && (
          <div className="mt-5 space-y-5">
            {account.status === 'token_expired' && (
              <Banner tone="error">
                Instagram access expired or was revoked (e.g. password change). Automations are paused until you reconnect.
              </Banner>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <Avatar account={account} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-slate-900">@{account.username}</p>
                <p className="text-sm text-slate-500">
                  {account.name ? `${account.name} · ` : ''}
                  {account.accountType === 'MEDIA_CREATOR' ? 'Creator' : account.accountType === 'BUSINESS' ? 'Business' : 'Professional'} account
                  {account.mediaCount != null && ` · ${account.mediaCount} posts`}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500"><KeyRound className="h-3.5 w-3.5" /> Access token</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {account.tokenDaysLeft != null ? `${account.tokenDaysLeft} days left` : '—'}
                  <span className="block text-xs font-normal text-slate-500">Auto-renews before expiry</span>
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500"><Film className="h-3.5 w-3.5" /> Reels synced</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {account.mediaSyncedAt ? new Date(account.mediaSyncedAt).toLocaleString() : 'Syncing…'}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Permissions</dt>
                <dd className="mt-1 space-y-0.5">
                  {Object.entries(SCOPE_LABELS).map(([scope, label]) => {
                    const missing = account.missingScopes.includes(scope);
                    return (
                      <p key={scope} className={`flex items-center gap-1.5 text-xs ${missing ? 'text-red-600' : 'text-slate-700'}`}>
                        {missing ? <CircleAlert className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />}
                        {label}
                      </p>
                    );
                  })}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              {account.status === 'active' ? (
                <>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => run('sync', () => api.post(`/instagram/accounts/${account.id}/sync-media`), 'Reels synced.')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${busy === 'sync' ? 'animate-spin' : ''}`} /> Sync Reels
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => run('refresh', () => api.post(`/instagram/accounts/${account.id}/refresh-token`), 'Token renewed.')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" /> Renew token now
                  </button>
                </>
              ) : (
                <button type="button" onClick={connect} disabled={!!busy} className="btn-primary">
                  <Link2 className="h-4 w-4" /> Reconnect Instagram
                </button>
              )}
              <button
                type="button"
                disabled={!!busy}
                onClick={() => {
                  if (window.confirm(`Disconnect @${account.username}? Automations will stop until you reconnect.`)) {
                    run('disconnect', () => api.delete(`/instagram/accounts/${account.id}`), 'Instagram disconnected.');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Unplug className="h-4 w-4" /> Disconnect
              </button>
            </div>
          </div>
        )}
      </section>


      {webhookInfo && (
        <section className="card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Webhook className="h-4 w-4 text-slate-500" /> Webhooks
            </h2>
            {account && (
              account.webhooksSubscribed
                ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Receiving events</span>
                : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Not subscribed</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Meta sends new comments and DMs to this address in real time. Paste it into the Meta App Dashboard
            (see <code className="font-mono text-xs">docs/PHASE-3-WEBHOOKS.md</code>).
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <p className="label">Callback URL</p>
              <div className="flex gap-2">
                <code className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-800">
                  {webhookInfo.callbackUrl}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(webhookInfo.callbackUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    } catch { /* clipboard blocked — the URL is visible to copy by hand */ }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {webhookInfo.callbackUrl.startsWith('http://') && (
                <p className="mt-1.5 text-xs text-amber-700">Meta requires HTTPS — set APP_BASE_URL to your tunnel or domain.</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Verify token</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {webhookInfo.verifyTokenConfigured ? 'Set in backend/.env (META_WEBHOOK_VERIFY_TOKEN)' : 'Not set: add META_WEBHOOK_VERIFY_TOKEN to backend/.env'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Fields to subscribe</p>
                <p className="mt-1 font-mono text-sm text-slate-900">{webhookInfo.fields.join(', ')}</p>
              </div>
            </div>
            {account?.status === 'active' && (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => run('subscribe', () => api.post(`/instagram/accounts/${account.id}/subscribe-webhooks`), 'Account subscribed to webhooks.')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${busy === 'subscribe' ? 'animate-spin' : ''}`} />
                {account.webhooksSubscribed ? 'Re-subscribe account' : 'Subscribe account to webhooks'}
              </button>
            )}
          </div>
        </section>
      )}

      {account && (
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Your Reels</h2>
            <span className="text-xs text-slate-500">Used to target campaigns in Phase 4</span>
          </div>
          {reels.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {reels.map((r) => <ReelCard key={r.id} reel={r} />)}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              {account.mediaSyncedAt ? 'No Reels found on this account yet.' : 'Syncing your Reels…'}
            </p>
          )}
          {account.mediaSyncedAt && (
            <p className="mt-4 flex items-center gap-1 text-xs text-slate-400">
              <ExternalLink className="h-3 w-3" /> Click a Reel to open it on Instagram. Thumbnail links from Instagram expire — “Sync Reels” refreshes them.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

// ───────────────────────── Automation settings ─────────────────────────

const SWITCHES = [
  ['comment_automation_enabled', 'Comment automation', 'Reply publicly to comments that match a campaign keyword. Turn off to pause all campaigns at once.'],
  ['dm_automation_enabled', 'Automatic DMs', 'Send the private reply (DM) after the public reply.'],
  ['ai_chatbot_enabled', 'AI chatbot', 'Claude answers customers’ DMs from your knowledge base (needs ANTHROPIC_API_KEY).'],
  ['one_automation_per_user_per_media', 'Duplicate comment protection', 'Reply to each person only once per Reel, even if they comment several times.'],
  ['reply_to_comment_replies', 'Reply inside comment threads', 'Also react to replies under other comments. Off by default to avoid joining conversations.'],
];

function AutomationSettings() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/settings'), api.get('/ai/status')])
      .then(([s, ai]) => {
        setSettings(s.settings);
        setDraft(s.settings);
        setAiConfigured(ai.configured);
      })
      .catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  async function toggle(key, value) {
    setMsg(null);
    try {
      const { settings: s } = await api.patch('/settings', { [key]: value });
      setSettings(s);
      setDraft((d) => ({ ...d, [key]: s[key] }));
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
  }

  async function saveNumbers(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const { settings: s } = await api.patch('/settings', {
        reply_delay_min_seconds: Number(draft.reply_delay_min_seconds),
        reply_delay_max_seconds: Number(draft.reply_delay_max_seconds),
        max_actions_per_hour: Number(draft.max_actions_per_hour),
      });
      setSettings(s);
      setDraft(s);
      setMsg({ ok: true, text: 'Saved.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (!draft) return msg ? <p className="text-sm text-red-600">{msg.text}</p> : <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />;
  const numbersChanged = ['reply_delay_min_seconds', 'reply_delay_max_seconds', 'max_actions_per_hour'].some((k) => Number(draft[k]) !== settings[k]);

  return (
    <div className="space-y-6">
      <section className="card divide-y divide-slate-100 p-0">
        {SWITCHES.map(([key, label, hint]) => {
          const disabled = key === 'ai_chatbot_enabled' && !aiConfigured;
          return (
            <div key={key} className="flex items-start justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{disabled ? 'Add ANTHROPIC_API_KEY to backend/.env first.' : hint}</p>
              </div>
              <Toggle checked={Boolean(settings[key])} onChange={(v) => toggle(key, v)} disabled={disabled} label={label} />
            </div>
          );
        })}
      </section>

      <form onSubmit={saveNumbers} className="card space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Reply timing & safety</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            A short random delay makes replies look human and keeps the account within Meta’s rate limits. Very fast or very frequent
            replies can be treated as spam.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">Minimum delay (seconds)</span>
            <input type="number" min={0} max={3600} value={draft.reply_delay_min_seconds} onChange={(e) => setDraft({ ...draft, reply_delay_min_seconds: e.target.value })} className="input" />
          </label>
          <label className="block">
            <span className="label">Maximum delay (seconds)</span>
            <input type="number" min={0} max={3600} value={draft.reply_delay_max_seconds} onChange={(e) => setDraft({ ...draft, reply_delay_max_seconds: e.target.value })} className="input" />
          </label>
          <label className="block">
            <span className="label">Max replies + DMs per hour</span>
            <input type="number" min={1} max={1000} value={draft.max_actions_per_hour} onChange={(e) => setDraft({ ...draft, max_actions_per_hour: e.target.value })} className="input" />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Recommended: 20–90 seconds, and at most about 120 actions per hour. Above the hourly limit, replies wait and are sent later. Nothing is lost.
        </p>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving || !numbersChanged} className="btn-primary">
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} Save timing
          </button>
          {msg && <span className={`text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</span>}
        </div>
      </form>
    </div>
  );
}

// ───────────────────────── System status ─────────────────────────

function SystemTab() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const load = () => api.get('/health/status').then(setStatus).catch((e) => setError(e.message));
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!status) return <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />;
  const up = status.uptimeSeconds;
  const uptime = up > 86400 ? `${Math.floor(up / 86400)}d ${Math.floor((up % 86400) / 3600)}h` : up > 3600 ? `${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m` : `${Math.floor(up / 60)}m`;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="card">
        <h2 className="mb-3 text-base font-semibold text-slate-900">API connections</h2>
        <SystemStatus status={status} />
      </section>
      <div className="space-y-6">
        <section className="card">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Background work</h2>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Waiting</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{status.queue?.pending ?? 0}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Running</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{status.queue?.running ?? 0}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Failed (24h)</dt><dd className={`mt-1 text-lg font-semibold ${status.queue?.failedLast24h ? 'text-red-600' : 'text-slate-900'}`}>{status.queue?.failedLast24h ?? 0}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Server running for {uptime} · version {status.version} · time zone {status.timeZone}
          </p>
        </section>
        <section className="card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Error log</h2>
            <Link to="/logs" className="text-sm font-medium text-brand-600 hover:text-brand-700">All logs →</Link>
          </div>
          {status.lastError ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {status.lastError.message}
              <span className="mt-0.5 block text-xs text-red-600">{new Date(status.lastError.at).toLocaleString()}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">No errors recorded. 🎉</p>
          )}
        </section>
      </div>
    </div>
  );
}

// ───────────────────────── Page ─────────────────────────

const TABS = [
  { value: 'automation', label: 'Automation' },
  { value: 'instagram', label: 'Instagram & webhooks' },
  { value: 'system', label: 'System status' },
];

export default function Settings() {
  const [params] = useSearchParams();
  // Coming back from Instagram login (?instagram=…) always lands on the Instagram tab.
  const [tab, setTab] = useState(() => (params.get('instagram') ? 'instagram' : TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'automation'));
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Automation switches, Instagram connection and system health." />
      <FilterTabs options={TABS} value={tab} onChange={setTab} />
      {tab === 'automation' && <AutomationSettings />}
      {tab === 'instagram' && <InstagramSettings />}
      {tab === 'system' && <SystemTab />}
    </div>
  );
}
