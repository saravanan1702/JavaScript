import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Images, LoaderCircle, Megaphone, Pencil, Plus, TriangleAlert } from 'lucide-react';
import { api } from '../api/client.js';
import { Badge, EmptyState, PageHeader, Toggle, timeAgo } from '../components/ui.jsx';

function ReelThumbs({ campaign }) {
  if (campaign.appliesToAllMedia) {
    return (
      <Badge tone="blue">
        <Images className="h-3 w-3" /> All Reels
      </Badge>
    );
  }
  const shown = campaign.media.slice(0, 4);
  return (
    <div className="flex items-center gap-1.5">
      {shown.map((m) => (
        <div key={m.igMediaId} className="flex h-10 w-8 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-400" title={m.caption ?? ''}>
          {m.thumbnailUrl ? <img src={m.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <Film className="h-3.5 w-3.5" />}
        </div>
      ))}
      {campaign.media.length > shown.length && <span className="text-xs text-slate-500">+{campaign.media.length - shown.length}</span>}
      <span className="ml-1 text-xs text-slate-500">{campaign.media.length} Reel{campaign.media.length === 1 ? '' : 's'}</span>
    </div>
  );
}

function Stat({ label, value, tone = 'text-slate-900' }) {
  return (
    <div>
      <p className={`text-lg font-semibold ${tone}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function Campaigns() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => api.get('/campaigns').then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);

  async function toggle(c) {
    setBusyId(c.id);
    try {
      await api.patch(`/campaigns/${c.id}/status`, { isActive: !c.isActive });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns" subtitle="Each campaign watches Reels for keywords, replies publicly and sends a DM.">
        <Link to="/campaigns/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New campaign
        </Link>
      </PageHeader>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {data?.warnings?.map((w) => (
        <div key={w.campaignIds.join('-')} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{w.message}</p>
        </div>
      ))}

      {!data && !error && <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />}

      {data && data.campaigns.length === 0 && (
        <div className="card">
          <EmptyState icon={Megaphone} title="No campaigns yet">
            Create your first campaign: pick a Reel, add keywords like “price” or “link”, and write the reply and DM.
            <div className="mt-5">
              <Link to="/campaigns/new" className="btn-primary">
                <Plus className="h-4 w-4" /> Create campaign
              </Link>
            </div>
          </EmptyState>
        </div>
      )}

      {data && data.campaigns.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.campaigns.map((c) => (
            <article key={c.id} className={`card flex min-w-0 flex-col gap-4 ${c.isActive ? '' : 'opacity-70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-slate-900">{c.name}</h2>
                    {c.isActive ? <Badge tone="green">Active</Badge> : <Badge>Paused</Badge>}
                    {c.priority !== 0 && <Badge tone="violet">Priority {c.priority}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.stats.lastMatchedAt ? `Last match ${timeAgo(c.stats.lastMatchedAt)}` : 'No matches yet'}
                    {' · '}
                    {c.matchMode === 'exact' ? 'Exact match' : 'Contains keyword'}
                  </p>
                </div>
                <Toggle checked={c.isActive} onChange={() => toggle(c)} disabled={busyId === c.id} label={c.isActive ? 'Pause campaign' : 'Resume campaign'} />
              </div>

              <ReelThumbs campaign={c} />

              <div className="flex flex-wrap gap-1.5">
                {c.keywords.map((k) => (
                  <Badge key={k} tone="violet">{k}</Badge>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3">
                <Stat label="Matched" value={c.stats.matched} />
                <Stat label="Replies" value={c.stats.replies} tone="text-emerald-700" />
                <Stat label="DMs" value={c.stats.dms} tone="text-emerald-700" />
                <Stat label="Issues" value={c.stats.failed} tone={c.stats.failed ? 'text-red-600' : 'text-slate-900'} />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  {c.publicReplies.length} reply variant{c.publicReplies.length === 1 ? '' : 's'} · {c.sendDm ? 'DM on' : 'DM off'}
                </span>
                <Link to={`/campaigns/${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
