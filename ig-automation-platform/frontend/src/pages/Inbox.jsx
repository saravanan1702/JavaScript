import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bot, CircleCheck, Clock, ExternalLink, Film, Inbox as InboxIcon, LoaderCircle, MessageSquareText, Search, SendHorizontal, UserRound,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Badge, EmptyState, FilterTabs, Toggle, timeAgo } from '../components/ui.jsx';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'needs_attention', label: 'Needs you', countKey: 'needsAttention' },
  { value: 'unread', label: 'Unread', countKey: 'unread' },
  { value: 'ai_paused', label: 'AI paused', countKey: 'aiPaused' },
  { value: 'open_window', label: 'Can reply' },
];

const PAUSE_REASON = {
  handoff: 'paused after handing over to you',
  manual_reply: 'paused because you replied',
  manual: 'paused by you',
};

/** Polls `fn` every `ms` while the browser tab is visible. */
function usePolling(fn, ms) {
  useEffect(() => {
    fn();
    const t = setInterval(() => document.visibilityState === 'visible' && fn(), ms);
    return () => clearInterval(t);
  }, [fn, ms]);
}

function Avatar({ c, size = 'h-10 w-10' }) {
  const [broken, setBroken] = useState(false);
  if (c.profilePicUrl && !broken) {
    return <img src={c.profilePicUrl} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-brand via-brand-500 to-accent-500 text-sm font-semibold text-white`}>
      {(c.username ?? c.name ?? '?')[0].toUpperCase()}
    </div>
  );
}

function windowText(w) {
  if (!w.open) return 'Reply window closed';
  const h = Math.floor(w.minutesLeft / 60);
  const m = w.minutesLeft % 60;
  return `You can reply for ${h ? `${h}h ` : ''}${m}m`;
}

// ───────────────────────── Conversation list ─────────────────────────

function ConversationList({ selectedId, onSelect, refreshKey }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ filter, pageSize: '50' });
    if (search) params.set('q', search);
    try {
      setData(await api.get(`/inbox/conversations?${params}`));
    } catch {
      /* keep the previous list on a failed poll */
    }
    // refreshKey forces a reload after sending/updating
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, refreshKey]);
  usePolling(load, 8000);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-slate-100 p-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); }} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search @username" className="input pl-9" aria-label="Search conversations" />
        </form>
        <FilterTabs
          options={FILTERS.map((f) => ({ value: f.value, label: f.label, count: f.countKey && data ? data.counts[f.countKey] : undefined }))}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!data && <LoaderCircle className="m-6 h-6 w-6 animate-spin text-brand-500" />}
        {data?.conversations.length === 0 && (
          <EmptyState icon={InboxIcon} title="No conversations here">
            {filter === 'all' ? 'DM conversations appear here when customers reply to your automatic DMs or message you.' : 'Nothing matches this filter.'}
          </EmptyState>
        )}
        <ul>
          {data?.conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={selectedId === c.id ? 'true' : undefined}
                className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition ${selectedId === c.id ? 'bg-brand-50/70' : 'hover:bg-slate-50'}`}
              >
                <Avatar c={c} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`truncate text-sm ${c.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>@{c.username ?? 'customer'}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-slate-400">{timeAgo(c.lastMessage.at)}</span>
                  </div>
                  <p className={`mt-0.5 flex items-center gap-1 truncate text-xs ${c.unread ? 'text-slate-800' : 'text-slate-500'}`}>
                    {c.lastMessage.direction === 'outbound' && (c.lastMessage.source === 'ai' ? <Bot className="h-3 w-3 shrink-0" aria-label="AI" /> : <span className="shrink-0">You:</span>)}
                    <span className="truncate">{c.lastMessage.text || '[attachment]'}</span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {c.needsAttention && <Badge tone="amber">Needs you</Badge>}
                    {!c.needsAttention && c.aiPaused && <Badge>AI paused</Badge>}
                    {c.window.open && <Badge tone="green"><Clock className="h-3 w-3" /> {Math.floor(c.window.minutesLeft / 60)}h left</Badge>}
                    {c.unread > 0 && <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold text-white">{c.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ───────────────────────── Thread ─────────────────────────

const SOURCE_LABEL = { ai: 'AI', private_reply: 'Auto DM', manual: 'You', automation: 'Automation' };

function Bubble({ m }) {
  const out = m.direction === 'outbound';
  const style = !out
    ? 'rounded-bl-md bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
    : m.source === 'ai'
      ? 'rounded-br-md bg-gradient-to-r from-violet-brand to-brand-500 text-white'
      : m.source === 'manual'
        ? 'rounded-br-md bg-ink-800 text-white'
        : 'rounded-br-md bg-brand-100 text-brand-700';
  return (
    <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${out ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${style}`}>
          {m.text || (m.attachments?.length ? (
            <span className="italic opacity-80">
              📎 {m.attachments.map((a) => a.type).join(', ')}{' '}
              {m.attachments[0]?.url && <a href={m.attachments[0].url} target="_blank" rel="noreferrer noopener" className="underline">open</a>}
            </span>
          ) : <span className="italic opacity-70">[empty]</span>)}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
          {out && <span className="font-medium text-slate-500">{SOURCE_LABEL[m.source] ?? m.source}</span>}
          {m.ai?.intent && <span>· {m.ai.intent}</span>}
          <span>· {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {m.status === 'failed' && <span className="text-red-600">· not delivered</span>}
          {m.ai?.needsHuman && <Badge tone="amber">Handed over: {m.ai.handoffReason || 'needs you'}</Badge>}
        </p>
      </div>
    </div>
  );
}

function Thread({ id, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);
  const bottom = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const d = await api.get(`/inbox/conversations/${id}`);
      setData(d);
      setError('');
      setNotes((n) => (notesSaved ? d.contact.notes : n));
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  usePolling(load, 5000);

  useEffect(() => {
    if (data && data.messages.length !== lastCount.current) {
      lastCount.current = data.messages.length;
      bottom.current?.scrollIntoView({ block: 'end' });
    }
  }, [data]);

  async function patch(body) {
    try {
      const { contact } = await api.patch(`/inbox/conversations/${id}`, body);
      setData((d) => ({ ...d, contact }));
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function send(e) {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/inbox/conversations/${id}/messages`, { text: msg });
      setText('');
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!data) {
    return error ? <p className="p-6 text-sm text-red-600">{error}</p> : <LoaderCircle className="m-6 h-6 w-6 animate-spin text-brand-500" />;
  }
  const c = data.contact;
  const commentsById = new Map(data.history.comments.map((x) => [x.id, x]));
  let lastDay = '';

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
          <button type="button" onClick={onBack} aria-label="Back to conversations" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Avatar c={c} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900">
              @{c.username ?? 'customer'}
              {c.username && (
                <a href={`https://instagram.com/${encodeURIComponent(c.username)}`} target="_blank" rel="noreferrer noopener" aria-label="Open Instagram profile" className="text-slate-400 hover:text-brand-600">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </p>
            <p className={`flex items-center gap-1 text-xs ${c.window.open ? 'text-emerald-700' : 'text-slate-500'}`}>
              <Clock className="h-3 w-3" /> {windowText(c.window)}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-right">
              <span className="block font-medium text-slate-800">AI replies</span>
              <span className="block text-[11px] text-slate-500">{c.aiPaused ? PAUSE_REASON[c.aiPausedReason] ?? 'paused' : 'active'}</span>
            </span>
            <Toggle checked={!c.aiPaused} onChange={(on) => patch({ aiPaused: !on })} label="AI replies for this customer" />
          </label>
        </div>

        {c.needsAttention && (
          <div className="flex flex-wrap items-center gap-3 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            <UserRound className="h-4 w-4 shrink-0" />
            <span className="flex-1"><strong>Needs you:</strong> {c.attentionReason || 'the AI handed this conversation over'}</span>
            <button type="button" onClick={() => patch({ needsAttention: false })} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
              <CircleCheck className="h-3.5 w-3.5" /> Mark resolved
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
          {data.messages.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No messages yet</p>}
          {data.messages.map((m) => {
            const day = new Date(m.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
            const showDay = day !== lastDay;
            lastDay = day;
            const origin = m.commentId ? commentsById.get(m.commentId) : null;
            return (
              <div key={m.id} className="space-y-3">
                {showDay && <p className="text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">{day}</p>}
                {origin && (
                  <div className="mx-auto flex max-w-md items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100">
                    <MessageSquareText className="h-4 w-4 shrink-0 text-brand-500" />
                    <span className="min-w-0">
                      Commented <strong className="text-slate-800">“{origin.text}”</strong> on a Reel
                      {origin.campaign && <> → campaign <strong className="text-slate-800">{origin.campaign}</strong></>}
                    </span>
                  </div>
                )}
                <Bubble m={m} />
              </div>
            );
          })}
          <div ref={bottom} />
        </div>

        {/* Composer */}
        <form onSubmit={send} className="border-t border-slate-100 bg-white p-3">
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          {c.window.open ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={text}
                  rows={2}
                  maxLength={1000}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Write a reply… (Enter to send, Shift+Enter for a new line)"
                  className="input resize-none"
                  aria-label="Reply"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {text.length}/1000{!c.aiPaused && ' · Sending a reply pauses the AI for this customer'}
                </p>
              </div>
              <button type="submit" disabled={sending || !text.trim()} className="btn-primary mb-5" aria-label="Send">
                {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Meta only allows replies within 24 hours of the customer’s last message. When they write again, you (and the AI) can reply.
            </p>
          )}
        </form>
      </div>

      {/* Customer panel */}
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-100 p-4 xl:block">
        <h3 className="text-sm font-semibold text-slate-900">Customer</h3>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 p-2.5"><dt className="text-[11px] text-slate-500">Messages from them</dt><dd className="text-lg font-semibold text-slate-900">{data.history.enquiries}</dd></div>
          <div className="rounded-xl bg-slate-50 p-2.5"><dt className="text-[11px] text-slate-500">AI replies</dt><dd className="text-lg font-semibold text-slate-900">{data.history.aiReplies}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-slate-500">First seen {new Date(c.firstSeenAt).toLocaleDateString()}</p>

        <label htmlFor="notes" className="mt-5 block text-sm font-semibold text-slate-900">Notes</label>
        <textarea
          id="notes"
          rows={4}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
          onBlur={async () => { if (!notesSaved) { await patch({ notes }); setNotesSaved(true); } }}
          placeholder="Size, address, order status… (only you see this)"
          className="input mt-2 resize-y text-xs"
        />
        <p className="mt-1 text-[11px] text-slate-400">{notesSaved ? 'Saved' : 'Saves when you click outside'}</p>

        <h3 className="mt-5 text-sm font-semibold text-slate-900">Comments on your Reels</h3>
        {data.history.comments.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No comments from this customer.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.history.comments.map((x) => (
              <li key={x.id} className="flex gap-2 rounded-xl bg-slate-50 p-2">
                <a href={x.media.permalink || undefined} target="_blank" rel="noreferrer noopener" className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-200 text-slate-400">
                  {x.media.thumbnailUrl ? <img src={x.media.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <Film className="h-4 w-4" />}
                </a>
                <div className="min-w-0 text-xs">
                  <p className="truncate text-slate-800">“{x.text}”</p>
                  <p className="text-slate-500">{x.campaign ?? 'No campaign'} · {timeAgo(x.at)}</p>
                  {x.skipReason && <p className="text-slate-400">{x.skipReason}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

// ───────────────────────── Page ─────────────────────────

export default function Inbox() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedId = id ? Number(id) : null;
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-10">
      <div className="flex h-[calc(100dvh-4rem)] bg-white lg:h-dvh">
        <div className={`${selectedId ? 'hidden lg:flex' : 'flex'} w-full min-w-0 flex-col border-r border-slate-100 lg:w-96 lg:shrink-0`}>
          <div className="flex items-center justify-between px-4 pb-1 pt-5">
            <h1 className="text-xl font-semibold text-slate-900">Inbox</h1>
            <Link to="/knowledge" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"><Bot className="h-3.5 w-3.5" /> AI settings</Link>
          </div>
          <ConversationList selectedId={selectedId} onSelect={(cid) => navigate(`/inbox/${cid}`)} refreshKey={refreshKey} />
        </div>
        <div className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col`}>
          {selectedId ? (
            <Thread key={selectedId} id={selectedId} onBack={() => navigate('/inbox')} onChanged={() => setRefreshKey((k) => k + 1)} />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-slate-50">
              <EmptyState icon={MessageSquareText} title="Select a conversation">Read the chat, see what the AI replied, and reply yourself.</EmptyState>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
