import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Camera, CircleCheck, CircleX, Database, LoaderCircle, Webhook } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROADMAP = [
  { phase: 1, title: 'Architecture, database & admin login', done: true },
  { phase: 2, title: 'Meta app setup & Instagram account connection', done: true },
  { phase: 3, title: 'Webhooks & comment detection' },
  { phase: 4, title: 'Public comment replies & private DMs' },
  { phase: 5, title: 'Claude AI chatbot & knowledge base' },
  { phase: 6, title: 'Admin dashboard & settings' },
  { phase: 7, title: 'Customer inbox & analytics' },
  { phase: 8, title: 'Deployment & 24/7 operation' },
];

function StatusRow({ icon: Icon, label, ok, hint, okLabel = 'Ready', badLabel = 'Not set' }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 sm:gap-4 sm:p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="truncate text-xs text-slate-500">{hint}</p>
      </div>
      {ok ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <CircleCheck className="h-3.5 w-3.5" /> {okLabel}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          <CircleX className="h-3.5 w-3.5" /> {badLabel}
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { admin } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/health/status').then(setStatus).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Hi {admin?.name?.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your Instagram automation platform is set up. Live stats appear here once Instagram is connected.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="card min-w-0 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">System status</h2>
            <Link to="/settings" className="text-sm font-medium text-brand-600 hover:text-brand-700">Settings →</Link>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {!status && !error && <LoaderCircle className="mt-6 h-6 w-6 animate-spin text-brand-500" />}
          {status && (
            <div className="mt-4 space-y-3">
              <StatusRow icon={Database} label="MySQL database" ok={status.db} hint="Stores campaigns, comments, conversations" />
              <StatusRow
                icon={Webhook}
                label="Instagram app credentials"
                ok={status.integrations.instagramAppConfigured}
                hint="INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET"
              />
              <StatusRow
                icon={Camera}
                label="Instagram account"
                ok={status.instagram.connected}
                okLabel="Connected"
                badLabel={status.instagram.needsReconnect ? 'Reconnect' : 'Not connected'}
                hint={
                  status.instagram.connected
                    ? `@${status.instagram.username} · token ${status.instagram.tokenDaysLeft} days left`
                    : 'Connect it in Settings'
                }
              />
              <StatusRow
                icon={Bot}
                label="Claude API key"
                ok={status.integrations.claudeConfigured}
                hint="ANTHROPIC_API_KEY — Phase 5"
              />
            </div>
          )}
        </section>

        <section className="card min-w-0 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Build roadmap</h2>
          <ol className="mt-4 space-y-3">
            {ROADMAP.map((item) => (
              <li key={item.phase} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    item.done
                      ? 'bg-gradient-to-br from-violet-brand via-brand-500 to-accent-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.phase}
                </span>
                <span className={`text-sm ${item.done ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                  {item.title}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
