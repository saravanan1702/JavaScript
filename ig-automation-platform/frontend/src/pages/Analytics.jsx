import { useCallback, useEffect, useState } from 'react';
import { Film, LoaderCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { Badge, FilterTabs, PageHeader } from '../components/ui.jsx';
import { ChartCard, Heatmap, Meter, RankedBars, StatTile, fmt } from '../components/charts.jsx';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourLabel = (h) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`);
const INTENT_LABEL = {
  price: 'Price', availability: 'Availability', order: 'How to order', shipping: 'Shipping / delivery', payment: 'Payment',
  cod: 'Cash on delivery', returns: 'Returns', complaint: 'Complaint', greeting: 'Greeting', other: 'Other',
};

function duration(s) {
  if (s == null) return null;
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${(s / 3600).toFixed(1)} h`;
}

function Thumb({ r }) {
  const [broken, setBroken] = useState(false);
  return (
    <a href={r.permalink || undefined} target="_blank" rel="noreferrer noopener" className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-400">
      {r.thumbnailUrl && !broken ? <img src={r.thumbnailUrl} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="h-full w-full object-cover" /> : <Film className="h-4 w-4" />}
    </a>
  );
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get(`/analytics?days=${days}`));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);
  useEffect(() => {
    load();
  }, [load]);

  if (!data && !error) return <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />;
  if (!data) return <p className="text-sm text-red-600">{error}</p>;

  const heatTotal = data.heatmap.flat().reduce((a, b) => a + b, 0);
  let peak = null;
  data.heatmap.forEach((row, r) => row.forEach((v, h) => { if (!peak || v > peak.v) peak = { v, r, h }; }));
  const bestReel = [...data.byReel].filter((r) => r.comments >= 5).sort((a, b) => b.conversion - a.conversion)[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle={`What works, and when your customers are active (${data.range.timeZone.replace('_', ' ')} time).`}>
        <FilterTabs options={RANGES} value={days} onChange={setDays} />
      </PageHeader>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Couldn’t refresh: {error}</p>}

      <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Median time to public reply" value={duration(data.responseTimes.publicReplyMedianSeconds)} hint="includes your random reply delay" />
          <StatTile label="Median AI reply time" value={duration(data.responseTimes.aiReplyMedianSeconds)} hint="from customer message to AI answer" />
          <StatTile label="DM delivery rate" value={data.dmDelivery.rate} suffix="%" hint={`${fmt(data.dmDelivery.notAllowed)} not allowed by Meta`} />
          <StatTile label="Best-converting Reel" value={bestReel?.conversion ?? null} suffix="%" hint={bestReel ? 'of commenters got a DM' : 'Needs 5+ comments on a Reel'} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="When customers comment"
            subtitle={peak && peak.v > 0 ? `Busiest: ${DAYS[peak.r]} around ${hourLabel(peak.h)} · post Reels a little before your busy hours` : 'Comments by weekday and hour'}
            table={{ columns: ['Day', ...Array.from({ length: 24 }, (_, h) => hourLabel(h))], rows: data.heatmap.map((row, r) => [DAYS[r], ...row]) }}
          >
            {heatTotal ? <Heatmap grid={data.heatmap} rowLabels={DAYS} colLabel={hourLabel} /> : <p className="py-10 text-center text-sm text-slate-500">No comments in this period</p>}
          </ChartCard>

          <ChartCard
            title="What customers ask the AI"
            subtitle="Topics of AI-answered DMs"
            table={{ columns: ['Topic', 'Messages'], rows: data.intents.map((i) => [INTENT_LABEL[i.intent] ?? i.intent, i.count]) }}
          >
            <RankedBars items={data.intents.map((i) => ({ label: INTENT_LABEL[i.intent] ?? i.intent, value: i.count }))} emptyText="No AI conversations yet" />
          </ChartCard>
        </div>

        <section className="card min-w-0 p-0">
          <div className="px-6 pb-2 pt-5">
            <h2 className="text-base font-semibold text-slate-900">Performance by Reel</h2>
            <p className="text-xs text-slate-500">Conversion = share of commenters who received a DM</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-6 py-2 font-medium">Reel</th>
                  <th className="px-3 py-2 text-right font-medium">Comments</th>
                  <th className="px-3 py-2 text-right font-medium">Keyword matches</th>
                  <th className="px-3 py-2 text-right font-medium">Replies</th>
                  <th className="px-3 py-2 text-right font-medium">DMs</th>
                  <th className="px-6 py-2 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data.byReel.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No comments in this period</td></tr>}
                {data.byReel.map((r) => (
                  <tr key={r.igMediaId} className="border-b border-slate-50">
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-3">
                        <Thumb r={r} />
                        <span className="line-clamp-2 max-w-xs text-slate-700">{r.caption || <span className="text-slate-400">{r.igMediaId}</span>}</span>
                      </div>
                    </td>
                    <td className="px-3 text-right text-slate-900">{fmt(r.comments)}</td>
                    <td className="px-3 text-right text-slate-900">{fmt(r.matched)}</td>
                    <td className="px-3 text-right text-slate-900">{fmt(r.replies)}</td>
                    <td className="px-3 text-right text-slate-900">{fmt(r.dms)}</td>
                    <td className="px-6"><Meter value={r.conversion} label={`${r.conversion}% conversion`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card min-w-0 p-0">
          <div className="px-6 pb-2 pt-5">
            <h2 className="text-base font-semibold text-slate-900">Campaign performance</h2>
            <p className="text-xs text-slate-500">“DM not allowed” = Meta refused the private reply (privacy settings, or comment older than 7 days)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-6 py-2 font-medium">Campaign</th>
                  <th className="px-3 py-2 text-right font-medium">Matches</th>
                  <th className="px-3 py-2 text-right font-medium">Replies</th>
                  <th className="px-3 py-2 text-right font-medium">DMs</th>
                  <th className="px-3 py-2 text-right font-medium">DM not allowed</th>
                  <th className="px-3 py-2 text-right font-medium">Issues</th>
                  <th className="px-6 py-2 font-medium">DM rate</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data.campaigns.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No campaign activity in this period</td></tr>}
                {data.campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="px-6 py-2.5 text-slate-800">{c.name} {!c.isActive && <Badge className="ml-1">Paused</Badge>}</td>
                    <td className="px-3 text-right text-slate-900">{fmt(c.matched)}</td>
                    <td className="px-3 text-right text-slate-900">{fmt(c.replies)}</td>
                    <td className="px-3 text-right text-slate-900">{fmt(c.dms)}</td>
                    <td className="px-3 text-right text-slate-600">{fmt(c.dmNotAllowed)}</td>
                    <td className={`px-3 text-right ${c.issues ? 'text-red-700' : 'text-slate-600'}`}>{fmt(c.issues)}</td>
                    <td className="px-6"><Meter value={c.dmRate} label={`${c.dmRate}% DM rate`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
