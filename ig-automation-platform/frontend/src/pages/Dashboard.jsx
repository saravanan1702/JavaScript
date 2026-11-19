import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, CircleAlert, CircleCheck, CircleX, Clock, LoaderCircle, MessageCircle, MinusCircle, TriangleAlert, UserRound } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge, FilterTabs, timeAgo } from '../components/ui.jsx';
import { ChartCard, LineChart, RankedBars, SegmentedBar, StatTile, fmt } from '../components/charts.jsx';
import SystemStatus from '../components/SystemStatus.jsx';

const RANGES = [
  { value: 1, label: 'Today' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const SERIES = [
  { key: 'comments', label: 'Comments', short: 'comments', color: 'var(--chart-series-1)' },
  { key: 'replies', label: 'Public replies', short: 'replies', color: 'var(--chart-series-2)' },
  { key: 'dms', label: 'DMs sent', short: 'DMs', color: 'var(--chart-series-3)' },
];

function readRange() {
  try {
    const v = Number(localStorage.getItem('dashboard.range'));
    return RANGES.some((r) => r.value === v) ? v : 7;
  } catch {
    return 7;
  }
}

export default function Dashboard() {
  const { admin } = useAuth();
  const [days, setDays] = useState(readRange);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([api.get(`/dashboard?days=${days}`), api.get('/health/status')]);
      setData(d);
      setStatus(s);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  function changeRange(v) {
    setDays(v);
    try {
      localStorage.setItem('dashboard.range', String(v));
    } catch {
      /* private mode: the choice just isn't remembered */
    }
  }

  if (!data && !error) return <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />;
  if (!data) return <p className="text-sm text-red-600">{error}</p>;

  const t = data.totals;
  const c = data.change;
  const rangeText = days === 1 ? 'today' : `the last ${days} days`;
  const funnelTop = data.funnel[0].value || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Hi {admin?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Here’s how your Reels automation performed {rangeText}.</p>
        </div>
        {/* One filter row above everything it scopes */}
        <FilterTabs options={RANGES} value={days} onChange={changeRange} />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Couldn’t refresh: {error}</p>}

      {(data.attention.conversationsNeedingYou > 0 || data.attention.failedWebhooksTotal > 0 || (status && !status.instagram?.connected)) && (
        <div className="flex flex-wrap gap-3">
          {data.attention.conversationsNeedingYou > 0 && (
            <Link to="/inbox" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 hover:bg-amber-100">
              <UserRound className="h-4 w-4" /> <strong>{data.attention.conversationsNeedingYou}</strong> conversation{data.attention.conversationsNeedingYou === 1 ? '' : 's'} need you
            </Link>
          )}
          {data.attention.failedWebhooksTotal > 0 && (
            <Link to="/logs" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 hover:bg-red-100">
              <TriangleAlert className="h-4 w-4" /> <strong>{data.attention.failedWebhooksTotal}</strong> failed webhook event{data.attention.failedWebhooksTotal === 1 ? '' : 's'}
            </Link>
          )}
          {status && !status.instagram?.connected && (
            <Link to="/settings" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 hover:bg-red-100">
              <CircleAlert className="h-4 w-4" /> Instagram {status.instagram?.needsReconnect ? 'needs reconnecting' : 'is not connected'}
            </Link>
          )}
        </div>
      )}

      <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Comments received" value={t.comments} delta={c.comments} previous={data.previous.comments} />
          <StatTile label="Automatic DMs sent" value={t.dmsSent} delta={c.dmsSent} previous={data.previous.dmsSent} />
          <StatTile label="Customer enquiries" value={t.enquiries} delta={c.enquiries} previous={data.previous.enquiries} />
          <StatTile label="Successful automations" value={t.successful} delta={c.successful} previous={data.previous.successful} />
          <StatTile label="Keyword matches" value={t.matched} delta={c.matched} previous={data.previous.matched} />
          <StatTile label="Public replies" value={t.publicReplies} delta={c.publicReplies} previous={data.previous.publicReplies} />
          <StatTile label="Active campaigns" value={t.activeCampaigns} hint={<Link to="/campaigns" className="text-brand-600 hover:underline">Manage campaigns</Link>} />
          <StatTile label="Failed webhook events" value={t.failedWebhooks} delta={c.failedWebhooks} previous={data.previous.failedWebhooks} goodWhenUp={false} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="Activity"
            subtitle={`Per day, ${data.range.timeZone.replace('_', ' ')} time`}
            table={{
              columns: ['Day', 'Comments', 'Public replies', 'DMs sent'],
              rows: data.series.map((d) => [new Date(`${d.day}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), d.comments, d.replies, d.dms]),
            }}
          >
            <LineChart data={data.series} series={SERIES} />
          </ChartCard>

          <ChartCard
            title="Automation funnel"
            subtitle="From comment to DM"
            table={{ columns: ['Stage', 'Count', 'Of comments'], rows: data.funnel.map((f) => [f.stage, f.value, `${Math.round((f.value / funnelTop) * 100)}%`]) }}
          >
            <RankedBars items={data.funnel.map((f, i) => ({ label: f.stage, value: f.value, sub: i ? `${Math.round((f.value / funnelTop) * 100)}% of comments` : '' }))} emptyText="No comments in this period" />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ChartCard
            title="Automation outcomes"
            subtitle={t.successRate == null ? 'Matched comments' : `${t.successRate}% fully successful`}
            table={{ columns: ['Outcome', 'Comments'], rows: [['Done', data.outcomes.completed], ['Partly sent', data.outcomes.partial], ['Failed', data.outcomes.failed], ['Skipped', data.outcomes.skipped], ['Waiting', data.outcomes.queued]] }}
          >
            <SegmentedBar
              parts={[
                { label: 'Done', value: data.outcomes.completed, color: 'var(--status-good)', icon: CircleCheck },
                { label: 'Partly sent', value: data.outcomes.partial, color: 'var(--status-warning)', ink: '#0b0b0b', icon: CircleAlert },
                { label: 'Failed', value: data.outcomes.failed, color: 'var(--status-critical)', icon: CircleX },
                { label: 'Skipped', value: data.outcomes.skipped, color: 'var(--status-neutral)', ink: '#0b0b0b', icon: MinusCircle },
                { label: 'Waiting', value: data.outcomes.queued, color: '#86b6ef', ink: '#0b0b0b', icon: Clock },
              ]}
            />
            <p className="mt-4 text-xs text-slate-500">“Partly sent” is usually a DM Meta didn’t allow (privacy settings or older than 7 days).</p>
          </ChartCard>

          <ChartCard
            title="Top campaigns"
            subtitle="Keyword matches"
            table={{ columns: ['Campaign', 'Matches', 'DMs'], rows: data.topCampaigns.map((x) => [x.name, x.matched, x.dms]) }}
          >
            <RankedBars items={data.topCampaigns.map((x) => ({ label: x.name, value: x.matched, sub: `${fmt(x.dms)} DMs` }))} emptyText="No matches in this period" />
          </ChartCard>

          <ChartCard
            title="Top keywords"
            subtitle="What customers ask for"
            table={{ columns: ['Keyword', 'Comments'], rows: data.topKeywords.map((k) => [k.keyword, k.count]) }}
          >
            <RankedBars items={data.topKeywords.map((k) => ({ label: `“${k.keyword}”`, value: k.count }))} emptyText="No keyword matches yet" />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="card min-w-0 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Recent conversations</h2>
              <Link to="/inbox" className="text-sm font-medium text-brand-600 hover:text-brand-700">Open inbox →</Link>
            </div>
            {data.recentConversations.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No DM conversations yet</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentConversations.map((cv) => (
                  <li key={cv.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-brand via-brand-500 to-accent-500 text-sm font-semibold text-white">
                      {(cv.username ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm">
                        <span className="truncate font-medium text-slate-900">@{cv.username ?? 'customer'}</span>
                        {cv.needsAttention && <Badge tone="amber">Needs you</Badge>}
                        {!cv.needsAttention && cv.aiPaused && <Badge>AI paused</Badge>}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                        {cv.lastMessage.direction === 'outbound' && (cv.lastMessage.source === 'ai' ? <Bot className="h-3 w-3 shrink-0" /> : <MessageCircle className="h-3 w-3 shrink-0" />)}
                        <span className="truncate">{cv.lastMessage.text ?? '[attachment]'}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{timeAgo(cv.lastMessage.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-6">
            <section className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">AI assistant</h2>
                <Link to="/knowledge" className="text-sm font-medium text-brand-600 hover:text-brand-700">Settings →</Link>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Replies</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{fmt(data.ai.replies)}</dd></div>
                <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Handed to you</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{fmt(data.ai.handoffs)}</dd></div>
                <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Tokens</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{fmt(data.ai.inputTokens + data.ai.outputTokens)}</dd></div>
              </dl>
              {data.ai.inputTokens > 0 && (
                <p className="mt-2 text-xs text-slate-500">{Math.round((data.ai.cacheReadTokens / data.ai.inputTokens) * 100)}% of prompt tokens served from cache (cheaper).</p>
              )}
            </section>
            {status && (
              <section className="card">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">System health</h2>
                  <Link to="/settings?tab=system" className="text-sm font-medium text-brand-600 hover:text-brand-700">Details →</Link>
                </div>
                <SystemStatus status={status} />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
