// Hand-built SVG charts (no chart library): thin marks, recessive grid, legend + selective
// direct labels, hover/keyboard tooltips, and a table view for every chart.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, Table2 } from 'lucide-react';

export const fmt = (n) => (n == null ? '–' : Math.abs(n) >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}K` : n.toLocaleString('en-IN'));
const dayLabel = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Clean axis maximum + ticks (0, 5, 10… / 0, 20, 40…). */
export function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(6));
}

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// ───────────────────────── Card shell with table toggle ─────────────────────────

export function ChartCard({ title, subtitle, table, children, className = '', action }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <figure className={`card min-w-0 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <figcaption>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </figcaption>
        <div className="flex items-center gap-2">
          {action}
          {table && (
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              aria-pressed={showTable}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Table2 className="h-3.5 w-3.5" /> {showTable ? 'Chart' : 'Table'}
            </button>
          )}
        </div>
      </div>
      {showTable && table ? <DataTable {...table} /> : children}
    </figure>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            {columns.map((c, i) => <th key={c} className={`py-2 font-medium ${i ? 'text-right' : ''}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100">
              {r.map((v, j) => <td key={j} className={`py-1.5 ${j ? 'text-right text-slate-900' : 'text-slate-600'}`}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────── Stat tile ─────────────────────────

export function StatTile({ label, value, delta, previous, goodWhenUp = true, suffix = '', hint }) {
  // A % change on a tiny baseline (e.g. 2 → 95 = +4650%) says nothing useful: show the old number instead.
  const smallBase = previous != null && previous < 10 && delta !== undefined;
  let Icon = Minus;
  let tone = 'text-slate-500';
  if (delta != null && delta !== 0) {
    const up = delta > 0;
    Icon = up ? ArrowUpRight : ArrowDownRight;
    tone = up === goodWhenUp ? 'text-[#006300]' : 'text-red-700';
  }
  return (
    <div className="card min-w-0 p-4 sm:p-5">
      <p className="truncate text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value == null ? '–' : `${fmt(value)}${suffix}`}</p>
      <p className={`mt-1 flex items-center gap-0.5 text-xs ${tone}`}>
        {delta === undefined ? (
          <span className="text-slate-500">{hint}</span>
        ) : smallBase && delta !== null && delta !== 0 ? (
          <>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>from {fmt(previous)} in the previous period</span>
          </>
        ) : delta === null ? (
          <span className="text-slate-500">new this period</span>
        ) : (
          <>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{delta > 0 ? '+' : ''}{delta}% vs previous period</span>
          </>
        )}
      </p>
    </div>
  );
}

// ───────────────────────── Multi-line chart ─────────────────────────

export function LineChart({ data, series, height = 240 }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { top: 12, right: 92, bottom: 26, left: 36 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key])));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const x = (i) => pad.left + (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const y = (v) => pad.top + h - (v / top) * h;
  const everyN = Math.ceil(data.length / Math.max(2, Math.floor(w / 70)));

  // End labels: only when they don't collide (≥14px apart); otherwise the legend carries identity.
  const ends = series.map((s) => ({ ...s, y: y(data[data.length - 1]?.[s.key] ?? 0), v: data[data.length - 1]?.[s.key] ?? 0 })).sort((a, b) => a.y - b.y);
  const endLabelsFit = ends.every((e, i) => i === 0 || e.y - ends[i - 1].y >= 14);

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - pad.left) / w) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }
  function onKey(e) {
    if (e.key === 'ArrowRight') setHover((i) => Math.min(data.length - 1, (i ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setHover((i) => Math.max(0, (i ?? data.length) - 1));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  }

  return (
    <div ref={ref} className="relative">
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Legend">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Line chart: ${series.map((s) => s.label).join(', ')} per day. Use the left and right arrow keys to read values.`}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
        className="block touch-pan-y overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--chart-axis)' : 'var(--chart-grid)'} strokeWidth="1" />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--chart-muted)] text-[11px] tabular-nums">{fmt(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (i % everyN === 0 || i === data.length - 1) && (
          <text key={d.day} x={x(i)} y={height - 6} textAnchor="middle" className="fill-[var(--chart-muted)] text-[11px]">{dayLabel(d.day)}</text>
        ))}
        {series.map((s) => (
          <path
            key={s.key}
            d={data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[s.key]).toFixed(1)}`).join('')}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {data.length > 0 && series.map((s) => (
          <circle key={s.key} cx={x(data.length - 1)} cy={y(data[data.length - 1][s.key])} r="4" fill={s.color} stroke="var(--chart-surface)" strokeWidth="2" />
        ))}
        {endLabelsFit && ends.map((e) => (
          <text key={e.key} x={x(data.length - 1) + 10} y={e.y} dy="0.32em" className="fill-slate-700 text-[11px]">
            <tspan className="font-semibold">{fmt(e.v)}</tspan> {e.short ?? e.label}
          </text>
        ))}
        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + h} stroke="var(--chart-axis)" strokeWidth="1" />
            {series.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(data[hover][s.key])} r="4" fill={s.color} stroke="var(--chart-surface)" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hover != null && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(x(hover) + 12, width - 165), top: 36 }}
        >
          <p className="mb-1 text-slate-500">{dayLabel(data[hover].day)}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              <span className="font-semibold tabular-nums text-slate-900">{fmt(data[hover][s.key])}</span>
              <span className="text-slate-500">{s.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Ranked horizontal bars (one hue) ─────────────────────────

export function RankedBars({ items, color = 'var(--chart-seq)', emptyText = 'No data yet', valueSuffix = '' }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-8 text-center text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li
          key={it.label}
          tabIndex={0}
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          aria-label={`${it.label}: ${it.value}${valueSuffix}${it.sub ? `, ${it.sub}` : ''}`}
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate text-slate-700">{it.label}</span>
            <span className="shrink-0 text-slate-500">{it.sub}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 flex-1">
              <div
                className="h-3 rounded-r transition-[filter]"
                style={{ width: `${Math.max(1.5, (it.value / max) * 100)}%`, background: color, filter: hover === i ? 'brightness(1.12)' : undefined }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-900">{fmt(it.value)}{valueSuffix}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────── Tall segmented bar (one whole, ≤ 6 parts) ─────────────────────────

export function SegmentedBar({ parts }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const total = parts.reduce((a, p) => a + p.value, 0);
  const visible = useMemo(() => parts.filter((p) => p.value > 0), [parts]);
  if (!total) return <p className="py-6 text-center text-sm text-slate-500">No automations in this period yet</p>;
  const gap = 2;
  const usable = width - gap * (visible.length - 1);

  return (
    <div ref={ref} className="relative">
      <div className="flex h-7" style={{ gap }} role="img" aria-label={visible.map((p) => `${p.label}: ${p.value} (${Math.round((p.value / total) * 100)}%)`).join(', ')}>
        {visible.map((p) => {
          const share = p.value / total;
          const px = share * usable;
          const label = `${Math.round(share * 100)}%`;
          const fits = px >= label.length * 7 + 12;
          return (
            <div
              key={p.label}
              tabIndex={0}
              onPointerEnter={() => setHover(p)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(p)}
              onBlur={() => setHover(null)}
              className="flex items-center rounded px-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              style={{ width: px, background: p.color, color: p.ink ?? '#ffffff', filter: hover?.label === p.label ? 'brightness(1.1)' : undefined }}
            >
              {fits && label}
            </div>
          );
        })}
      </div>
      {hover && (
        <div role="status" className="pointer-events-none absolute left-0 top-9 z-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
          <span className="font-semibold tabular-nums text-slate-900">{fmt(hover.value)}</span>{' '}
          <span className="text-slate-500">{hover.label} · {Math.round((hover.value / total) * 100)}%</span>
        </div>
      )}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
        {visible.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} aria-hidden="true" />
            {p.icon && <p.icon className="h-3 w-3 text-slate-500" aria-hidden="true" />}
            {p.label} <span className="font-medium tabular-nums text-slate-900">{fmt(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────────────────────── Heatmap (sequential, one hue) ─────────────────────────

// Validated sequential blue ramp (light → dark). Empty cells use a neutral, not the ramp.
const SEQ_RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];
const EMPTY_CELL = '#f1f0ec';

export function Heatmap({ grid, rowLabels, colLabel = (c) => c, valueLabel = 'comments' }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(0, ...grid.flat());
  const color = (v) => (v <= 0 || max === 0 ? EMPTY_CELL : SEQ_RAMP[Math.min(SEQ_RAMP.length - 1, Math.floor((v / max) * SEQ_RAMP.length - 1e-9))]);
  const cols = grid[0]?.length ?? 0;

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-1">
        <div className="inline-grid min-w-full gap-[2px]" style={{ gridTemplateColumns: `40px repeat(${cols}, minmax(14px, 1fr))` }} role="img" aria-label={`Heatmap of ${valueLabel} by day and hour. Use the table view for exact numbers.`}>
          <div />
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className="text-center text-[10px] text-[var(--chart-muted)]">{c % 3 === 0 ? colLabel(c) : ''}</div>
          ))}
          {grid.map((row, r) => (
            <div key={rowLabels[r]} className="contents">
              <div className="pr-1 text-right text-[11px] leading-[22px] text-[var(--chart-muted)]">{rowLabels[r]}</div>
              {row.map((v, c) => (
                <div
                  key={c}
                  tabIndex={0}
                  onPointerEnter={() => setHover({ r, c, v })}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ r, c, v })}
                  onBlur={() => setHover(null)}
                  aria-label={`${rowLabels[r]} ${colLabel(c)}: ${v} ${valueLabel}`}
                  className="h-[22px] rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                  style={{ background: color(v), outline: hover?.r === r && hover?.c === c ? '2px solid #0b0b0b' : undefined, outlineOffset: -1 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {hover && (
        <div role="status" className="pointer-events-none absolute right-0 top-0 z-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
          <span className="font-semibold tabular-nums text-slate-900">{fmt(hover.v)}</span>{' '}
          <span className="text-slate-500">{valueLabel} · {rowLabels[hover.r]} {colLabel(hover.c)}</span>
        </div>
      )}
      {/* Scale legend */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--chart-muted)]">
        <span>Fewer</span>
        <span className="h-2.5 w-4 rounded-sm" style={{ background: EMPTY_CELL }} />
        {SEQ_RAMP.map((c) => <span key={c} className="h-2.5 w-4 rounded-sm" style={{ background: c }} />)}
        <span>More</span>
      </div>
    </div>
  );
}

/** Thin meter (one ratio against 100%), same-hue track. */
export function Meter({ value, label }) {
  return (
    <div className="flex items-center gap-2" aria-label={label ?? `${value}%`}>
      <div className="h-1.5 w-16 rounded-full bg-[#cde2fb]">
        <div className="h-1.5 rounded-full bg-[var(--chart-seq)]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-slate-700">{value}%</span>
    </div>
  );
}
