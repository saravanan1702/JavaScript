import { useCallback, useEffect, useState } from 'react';
import { Film, LoaderCircle, MessageSquareText, Search } from 'lucide-react';
import { api } from '../api/client.js';
import { Badge, EmptyState, FilterTabs, PageHeader, Pagination, timeAgo } from '../components/ui.jsx';

const STATUS = {
  received: { label: 'Processing', tone: 'blue' },
  matched: { label: 'Matched', tone: 'violet' },
  queued: { label: 'Queued', tone: 'blue' },
  completed: { label: 'Replied', tone: 'green' },
  partial: { label: 'Partly sent', tone: 'amber' },
  failed: { label: 'Failed', tone: 'red' },
  no_match: { label: 'No keyword', tone: 'slate' },
  skipped: { label: 'Skipped', tone: 'amber' },
};

const TABS = ['', 'matched', 'no_match', 'skipped', 'failed'];

function Thumb({ media }) {
  const [broken, setBroken] = useState(false);
  return (
    <a
      href={media.permalink || undefined}
      target="_blank"
      rel="noreferrer noopener"
      className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400"
      title={media.caption || 'Reel'}
    >
      {media.thumbnailUrl && !broken ? (
        <img src={media.thumbnailUrl} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <Film className="h-5 w-5" />
      )}
    </a>
  );
}

export default function Comments() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: '25' });
    if (status) params.set('status', status);
    if (search) params.set('q', search);
    try {
      setData(await api.get(`/comments?${params}`));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [status, search, page]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000); // live-ish updates
    return () => clearInterval(t);
  }, [load]);

  const total = data ? Object.values(data.stats).reduce((a, b) => a + b, 0) : null;
  const tabs = TABS.map((s) => ({
    value: s,
    label: s ? STATUS[s].label : 'All',
    count: data ? (s ? data.stats[s] ?? 0 : total) : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Comments" subtitle="Every comment on your Reels, and what the automation decided. Updates every 10 seconds." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs options={tabs} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }}
          className="relative w-full sm:w-64"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search text or @user" className="input pl-9" />
        </form>
      </div>

      <section className="card p-0">
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}
        {!data && !error && <LoaderCircle className="m-6 h-6 w-6 animate-spin text-brand-500" />}
        {data && data.comments.length === 0 && (
          <EmptyState icon={MessageSquareText} title="No comments yet">
            Comments appear here as soon as Meta delivers them to your webhook. To test without Instagram, run{' '}
            <code className="font-mono text-xs">npm run webhook:simulate -- "Price?"</code> in <code className="font-mono text-xs">backend/</code>.
          </EmptyState>
        )}
        {data && data.comments.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {data.comments.map((c) => {
              const s = STATUS[c.status] ?? { label: c.status, tone: 'slate' };
              return (
                <li key={c.id} className="flex gap-4 px-4 py-4 sm:px-6">
                  <Thumb media={c.media} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-slate-900">@{c.username ?? 'unknown'}</span>
                      {c.isReply && <Badge>reply</Badge>}
                      <span className="text-xs text-slate-400">{timeAgo(c.commentedAt)}</span>
                    </div>
                    <p className="mt-0.5 break-words text-sm text-slate-700">{c.text || <em className="text-slate-400">(no text)</em>}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={s.tone}>{s.label}</Badge>
                      {c.matchedKeyword && <Badge tone="violet">“{c.matchedKeyword}”</Badge>}
                      {c.campaignName && <span className="text-xs text-slate-500">→ {c.campaignName}</span>}
                      {c.skipReasonText && <span className="text-xs text-slate-500">{c.skipReasonText}</span>}
                      {c.lastError && <span className="text-xs text-red-600">{c.lastError}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
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
