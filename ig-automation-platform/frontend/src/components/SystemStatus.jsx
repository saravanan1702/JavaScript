import { Bot, Camera, CircleCheck, CircleX, Database, Webhook } from 'lucide-react';

function StatusRow({ icon: Icon, label, ok, hint, okLabel = 'Ready', badLabel = 'Not set' }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="truncate text-xs text-slate-500">{hint}</p>
      </div>
      {ok ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <CircleCheck className="h-3.5 w-3.5" /> {okLabel}
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          <CircleX className="h-3.5 w-3.5" /> {badLabel}
        </span>
      )}
    </div>
  );
}

/** API connection status rows, shared by the Dashboard and Settings → System status. */
export default function SystemStatus({ status }) {
  const ig = status.instagram ?? {};
  return (
    <div className="space-y-2.5">
      <StatusRow icon={Database} label="Database" ok={status.db} badLabel="Down" hint="MySQL: campaigns, comments, conversations" />
      <StatusRow
        icon={Camera}
        label="Instagram account"
        ok={ig.connected}
        okLabel="Connected"
        badLabel={ig.needsReconnect ? 'Reconnect' : 'Not connected'}
        hint={ig.connected ? `@${ig.username} · token renews automatically (${ig.tokenDaysLeft} days left)` : 'Connect it in Settings'}
      />
      <StatusRow
        icon={Webhook}
        label="Webhooks"
        ok={status.integrations.webhooksConfigured && ig.webhooksSubscribed}
        okLabel="Receiving"
        badLabel={status.integrations.webhooksConfigured ? 'Not subscribed' : 'Not set'}
        hint={
          status.lastWebhookAt
            ? `Last event ${new Date(status.lastWebhookAt).toLocaleString()}`
            : 'Comments + DMs are delivered in real time once set up'
        }
      />
      <StatusRow
        icon={Bot}
        label="Claude AI"
        ok={status.integrations.claudeConfigured}
        okLabel={status.ai?.enabled ? 'On' : 'Ready (off)'}
        hint={status.integrations.claudeConfigured ? `Model ${status.ai?.model ?? ''}` : 'ANTHROPIC_API_KEY not set'}
      />
    </div>
  );
}
