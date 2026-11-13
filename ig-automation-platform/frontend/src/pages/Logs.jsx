import { useCallback, useEffect, useState } from 'react';
import { Activity, LoaderCircle, RotateCcw, Webhook, X } from 'lucide-react';
import { api } from '../api/client.js';
import { Badge, EmptyState, FilterTabs, PageHeader, Pagination, timeAgo } from '../components/ui.jsx';

const EVENT_TONE = { received: 'blue', processing: 'blue', processed: 'green', ignored: 'slate', failed: 'red' };
const LEVEL_TONE = { debug: 'slate', info: 'blue', warn: 'amber', error: 'red' };

function EventModal({ id, onClose, onRetried }) {
  const [event, setEvent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/webhook-events/${id}`).then((d) => setEvent(d.event)).catch((e) => setError(e.message));
  }, [id]);

  async function retry() {
    setBusy(true);
    try {
      await api.post(`/webhook-events/${id}/retry`);
      onRetried();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Webhook event #{id}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!event && !error && <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />}
          {event && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge tone={EVENT_TONE[event.status]}>{event.status}</Badge>
                <Badge>{event.field}</Badge>
                <span className="text-slate-500">received {new Date(event.receivedAt).toLocaleString()}</span>
                <span className="text-slate-500">· {event.attempts} attempt(s)</span>
              </div>
              {event.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{event.error}</p>}
              <pre className="overflow-x-auto rounded-xl bg-ink-900 p-4 text-xs leading-relaxed text-slate-100">{JSON.stringify(event.payload, null, 2)}</pre>
            </>
          )}
        </div>
        {event && ['failed', 'received'].includes(event.status) && (
          <div className="flex justify-end border-t border-slate-100 px-5 py-3">
            <button type="button" onClick={retry} disabled={busy} className="btn-primary">
              <RotateCcw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Process again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WebhookEvents() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    setData(await api.get(`/webhook-events?${params}`).catch(() => null));
  }, [status, page]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  const tabs = ['', 'processed', 'ignored', 'failed'].map((s) => ({
    value: s,
    label: s ? s[0].toUpperCase() + s.slice(1) : 'All',
    count: data ? (s ? data.stats[s] ?? 0 : Object.values(data.stats).reduce((a, b) => a + b, 0)) : null,
  }));

  return (
    <div className="space-y-4">
      <FilterTabs options={tabs} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      <section className="card p-0">
        {!data && <LoaderCircle className="m-6 h-6 w-6 animate-spin text-brand-500" />}
        {data?.events.length === 0 && (
          <EmptyState icon={Webhook} title="No webhook events">
            Events from Meta (comments, DMs) are listed here with their processing status.
          </EmptyState>
        )}
        {data?.events.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {data.events.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setOpenId(e.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 sm:px-6">
                  <Badge tone={EVENT_TONE[e.status]} className="w-20 justify-center">{e.status}</Badge>
                  <span className="hidden w-24 shrink-0 text-xs text-slate-500 sm:block">{e.field}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-800">{e.summary}</span>
                    {e.error && <span className="block truncate text-xs text-red-600">{e.error}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(e.receivedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {data && (
          <div className="px-4 pb-4 sm:px-6">
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
          </div>
        )}
      </section>
      {openId && <EventModal id={openId} onClose={() => setOpenId(null)} onRetried={() => { setOpenId(null); load(); }} />}
    </div>
  );
}

function ActivityLog() {
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (level) params.set('level', level);
    api.get(`/logs?${params}`).then(setData).catch(() => setData(null));
  }, [level, page]);

  return (
    <div className="space-y-4">
      <FilterTabs
        options={['', 'info', 'warn', 'error'].map((l) => ({ value: l, label: l ? l[0].toUpperCase() + l.slice(1) : 'All' }))}
        value={level}
        onChange={(v) => { setLevel(v); setPage(1); }}
      />
      <section className="card p-0">
        {!data && <LoaderCircle className="m-6 h-6 w-6 animate-spin text-brand-500" />}
        {data?.logs.length === 0 && <EmptyState icon={Activity} title="Nothing logged yet" />}
        {data?.logs.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {data.logs.map((l) => (
              <li key={l.id} className="px-4 py-3 sm:px-6">
                <button type="button" onClick={() => setExpanded(expanded === l.id ? null : l.id)} className="flex w-full items-start gap-3 text-left">
                  <Badge tone={LEVEL_TONE[l.level]} className="mt-0.5 w-14 justify-center">{l.level}</Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm text-slate-800">{l.message}</span>
                    <span className="text-xs text-slate-400">{l.scope} · {timeAgo(l.createdAt)}</span>
                  </span>
                </button>
                {expanded === l.id && l.context && (
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(l.context, null, 2)}</pre>
                )}
              </li>
            ))}
          </ul>
        )}
        {data && (
          <div className="px-4 pb-4 sm:px-6">
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
          </div>
        )}
      </section>
    </div>
  );
}

export default function Logs() {
  const [tab, setTab] = useState('events');
  return (
    <div className="space-y-6">
      <PageHeader title="Logs" subtitle="Webhook deliveries from Meta and everything the platform did." />
      <FilterTabs
        options={[{ value: 'events', label: 'Webhook events' }, { value: 'activity', label: 'Activity & errors' }]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'events' ? <WebhookEvents /> : <ActivityLog />}
    </div>
  );
}
