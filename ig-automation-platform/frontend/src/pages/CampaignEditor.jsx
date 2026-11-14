import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CornerDownRight, Film, Images, LoaderCircle, Plus, Send, Trash2, X } from 'lucide-react';
import { api } from '../api/client.js';
import { FieldError, Toggle } from '../components/ui.jsx';

const SUGGESTED_KEYWORDS = ['price', 'link', 'buy', 'details', 'available', 'order', 'catalogue', 'how much', 'cost', 'dm'];
const LIMITS = { reply: 500, dm: 1000, replies: 10, keywords: 30 };

const EMPTY = {
  name: '',
  matchMode: 'contains',
  appliesToAllMedia: false,
  mediaIds: [],
  keywords: ['price'],
  publicReplies: ['Thank you {{username}}! Please check your DM ❤️', 'Hi {{username}}, we’ve sent you the details in DM ✨'],
  sendDm: true,
  dmMessage: 'Hi {{username}}! ❤️ Thanks for your interest. Here are the product details and price. Let us know if you need help placing an order.',
  productInfo: '',
  priority: 0,
  isActive: true,
};

function Section({ title, hint, children }) {
  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Counter({ value, max }) {
  const n = value.length;
  return <span className={`text-xs ${n > max ? 'font-medium text-red-600' : 'text-slate-400'}`}>{n}/{max}</span>;
}

function ReelPicker({ reels, selected, onChange }) {
  const [onlyReels, setOnlyReels] = useState(true);
  const list = onlyReels ? reels.filter((r) => r.mediaProductType === 'REELS') : reels;
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (!reels.length) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No posts synced yet. Go to <Link to="/settings" className="font-medium text-brand-600">Settings</Link> and click “Sync Reels”, or use “All Reels”.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={onlyReels} onChange={(e) => setOnlyReels(e.target.checked)} className="rounded border-slate-300 text-brand-600" />
        Show Reels only
      </label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {list.map((r) => {
          const on = selected.includes(r.igMediaId);
          return (
            <button
              key={r.igMediaId}
              type="button"
              onClick={() => toggle(r.igMediaId)}
              aria-pressed={on}
              className={`group relative overflow-hidden rounded-xl border-2 text-left transition ${on ? 'border-brand-500 ring-4 ring-brand-500/15' : 'border-transparent hover:border-slate-300'}`}
            >
              <div className="aspect-[9/16] bg-slate-100">
                {r.thumbnailUrl ? (
                  <img src={r.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400"><Film className="h-6 w-6" /></div>
                )}
              </div>
              <p className="line-clamp-2 bg-white p-1.5 text-[11px] text-slate-600">{r.caption || 'No caption'}</p>
              {on && (
                <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KeywordInput({ keywords, onChange }) {
  const [draft, setDraft] = useState('');
  const add = (raw) => {
    const parts = raw.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
    const next = [...keywords];
    for (const p of parts) if (!next.includes(p) && next.length < LIMITS.keywords) next.push(p);
    onChange(next);
    setDraft('');
  };
  return (
    <div className="space-y-3">
      <div className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
        {keywords.map((k) => (
          <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-sm font-medium text-violet-700">
            {k}
            <button type="button" aria-label={`Remove ${k}`} onClick={() => onChange(keywords.filter((x) => x !== k))} className="rounded hover:bg-violet-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && !draft && keywords.length) {
              onChange(keywords.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={keywords.length ? 'Add another…' : 'Type a keyword and press Enter'}
          className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1 text-sm focus:outline-none focus:ring-0"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_KEYWORDS.filter((k) => !keywords.includes(k)).map((k) => (
          <button key={k} type="button" onClick={() => add(k)} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-brand-500 hover:text-brand-600">
            <Plus className="h-3 w-3" /> {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function Preview({ form, reels, accountName }) {
  const reel = reels.find((r) => form.mediaIds.includes(r.igMediaId));
  const sample = 'priya_styles';
  const fill = (t) => (t || '').replace(/\{\{\s*username\s*\}\}/g, sample);
  const reply = form.publicReplies.find((r) => r.trim());
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[2rem] border-[10px] border-ink-900 bg-white shadow-2xl">
      <div className="overflow-hidden rounded-[1.4rem]">
        <div className="relative aspect-[9/10] bg-gradient-to-br from-violet-brand via-brand-500 to-accent-500">
          {reel?.thumbnailUrl && <img src={reel.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white">Reel</span>
        </div>
        <div className="space-y-2.5 p-3 text-[12px] leading-snug">
          <p><span className="font-semibold">{sample}</span> {form.keywords[0] ? form.keywords[0][0].toUpperCase() + form.keywords[0].slice(1) : 'Price'}?</p>
          {reply ? (
            <p className="flex gap-1.5 pl-3 text-slate-700">
              <CornerDownRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
              <span><span className="font-semibold">{accountName}</span> {fill(reply)}</span>
            </p>
          ) : (
            <p className="pl-3 text-slate-400">No public reply</p>
          )}
        </div>
        <div className="border-t border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <Send className="h-3 w-3" /> Direct message
          </p>
          {form.sendDm && form.dmMessage.trim() ? (
            <p className="ml-auto w-fit max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-r from-violet-brand to-brand-500 px-3 py-2 text-[12px] text-white">
              {fill(form.dmMessage)}
            </p>
          ) : (
            <p className="text-[12px] text-slate-400">No automatic DM</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CampaignEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [reels, setReels] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { accounts } = await api.get('/instagram/accounts');
        const acc = accounts.find((a) => a.status !== 'disconnected');
        setAccount(acc ?? null);
        if (acc) setReels((await api.get(`/instagram/accounts/${acc.id}/media?limit=60`)).media);
        if (!isNew) {
          const { campaign } = await api.get(`/campaigns/${id}`);
          setForm({
            name: campaign.name,
            matchMode: campaign.matchMode,
            appliesToAllMedia: campaign.appliesToAllMedia,
            mediaIds: campaign.mediaIds,
            keywords: campaign.keywords,
            publicReplies: campaign.publicReplies.length ? campaign.publicReplies : [''],
            sendDm: campaign.sendDm,
            dmMessage: campaign.dmMessage,
            productInfo: campaign.productInfo,
            priority: campaign.priority,
            isActive: campaign.isActive,
          });
        }
      } catch (e) {
        setFormError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    // Clear the error of any field the user just changed.
    setErrors((e) => {
      const keys = Object.keys(patch).map((k) => (k === 'appliesToAllMedia' ? 'mediaIds' : k === 'sendDm' ? 'dmMessage' : k));
      if (!keys.some((k) => e[k])) return e;
      const next = { ...e };
      for (const k of keys) delete next[k];
      if (patch.sendDm === false) delete next.publicReplies;
      return next;
    });
  };
  const accountName = useMemo(() => account?.username ?? 'your_shop', [account]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError('');
    try {
      const body = { ...form, publicReplies: form.publicReplies.map((r) => r.trim()).filter(Boolean), priority: Number(form.priority) || 0 };
      if (isNew) await api.post('/campaigns', body);
      else await api.put(`/campaigns/${id}`, body);
      navigate('/campaigns');
    } catch (err) {
      const byField = {};
      for (const d of err.details ?? []) byField[d.field.split('.')[0]] ??= d.message;
      setErrors(byField);
      setFormError(Object.keys(byField).length ? 'Please fix the highlighted fields.' : err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete campaign “${form.name}”? Its statistics stay on the Comments page.`)) return;
    try {
      await api.delete(`/campaigns/${id}`);
      navigate('/campaigns');
    } catch (e) {
      setFormError(e.message);
    }
  }

  if (loading) return <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" />;

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/campaigns" aria-label="Back to campaigns" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-semibold text-slate-900">{isNew ? 'New campaign' : 'Edit campaign'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} {isNew ? 'Create campaign' : 'Save changes'}
          </button>
        </div>
      </div>

      {!account && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Connect your Instagram account in Settings before creating campaigns.</p>}
      {formError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Section title="Basics">
            <div>
              <label htmlFor="name" className="label">Campaign name</label>
              <input id="name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Gold bracelet launch" className="input" maxLength={150} />
              <FieldError>{errors.name}</FieldError>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Toggle checked={form.isActive} onChange={(v) => set({ isActive: v })} label="Active" />
                <span className="text-sm text-slate-700">{form.isActive ? 'Active: replies automatically' : 'Paused'}</span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="priority" className="text-sm text-slate-600">Priority</label>
                <input id="priority" type="number" min={-100} max={100} value={form.priority} onChange={(e) => set({ priority: e.target.value })} className="input w-20" />
              </div>
            </div>
          </Section>

          <Section title="Which Reels?" hint="The campaign only reacts to comments on these Reels.">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { v: false, label: 'Selected Reels' },
                { v: true, label: 'All Reels', icon: Images },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => set({ appliesToAllMedia: o.v })}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${form.appliesToAllMedia === o.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {form.appliesToAllMedia ? (
              <p className="text-sm text-slate-600">Reacts to matching comments on every post and Reel, including future ones.</p>
            ) : (
              <ReelPicker reels={reels} selected={form.mediaIds} onChange={(mediaIds) => set({ mediaIds })} />
            )}
            <FieldError>{errors.mediaIds}</FieldError>
          </Section>

          <Section title="Trigger keywords" hint="Matched as whole words, ignoring case and emoji. “price” matches “Price?” and “prices”, but not “priceless”.">
            <KeywordInput keywords={form.keywords} onChange={(keywords) => set({ keywords })} />
            <FieldError>{errors.keywords}</FieldError>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { v: 'contains', label: 'Comment contains a keyword', hint: '“what’s the price 😍” ✓' },
                { v: 'exact', label: 'Comment is exactly a keyword', hint: 'only “Price” / “price!!” ✓' },
              ].map((o) => (
                <label key={o.v} className="flex cursor-pointer items-start gap-2">
                  <input type="radio" name="matchMode" checked={form.matchMode === o.v} onChange={() => set({ matchMode: o.v })} className="mt-0.5 text-brand-600" />
                  <span>
                    <span className="block text-slate-800">{o.label}</span>
                    <span className="text-xs text-slate-500">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Public comment reply" hint="One variant is picked at random each time, so replies don’t look copy-pasted. Use {{username}} for the commenter’s name.">
            <div className="space-y-3">
              {form.publicReplies.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <textarea
                      value={r}
                      rows={2}
                      onChange={(e) => set({ publicReplies: form.publicReplies.map((x, j) => (j === i ? e.target.value : x)) })}
                      placeholder="Thank you {{username}}! Please check your DM ❤️"
                      className="input resize-y"
                      aria-label={`Reply variant ${i + 1}`}
                    />
                    <div className="mt-1 flex justify-end"><Counter value={r} max={LIMITS.reply} /></div>
                  </div>
                  <button type="button" aria-label="Remove variant" onClick={() => set({ publicReplies: form.publicReplies.filter((_, j) => j !== i) })} className="mt-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {form.publicReplies.length < LIMITS.replies && (
                <button type="button" onClick={() => set({ publicReplies: [...form.publicReplies, ''] })} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                  <Plus className="h-4 w-4" /> Add variant
                </button>
              )}
            </div>
            <FieldError>{errors.publicReplies}</FieldError>
          </Section>

          <Section title="Automatic DM (private reply)">
            <div className="flex items-center gap-3">
              <Toggle checked={form.sendDm} onChange={(v) => set({ sendDm: v })} label="Send automatic DM" />
              <span className="text-sm text-slate-700">Send a DM to the person who commented</span>
            </div>
            {form.sendDm && (
              <>
                <div>
                  <textarea value={form.dmMessage} rows={5} onChange={(e) => set({ dmMessage: e.target.value })} className="input resize-y" aria-label="DM message" />
                  <div className="mt-1 flex justify-between">
                    <FieldError>{errors.dmMessage}</FieldError>
                    <Counter value={form.dmMessage} max={LIMITS.dm} />
                  </div>
                </div>
                <div className="rounded-xl bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-800">
                  <strong>Meta’s rules:</strong> one private reply per comment, only within 7 days of the comment. Some people can’t
                  receive it (privacy settings); those show as “DM not allowed” on the Comments page. You can message them again
                  only after they reply, which opens a 24-hour window.
                </div>
              </>
            )}
          </Section>

          <Section title="Product information" hint="Notes about what this campaign sells. In Phase 5 the AI uses this, together with your knowledge base, to answer follow-up questions.">
            <textarea value={form.productInfo} rows={4} onChange={(e) => set({ productInfo: e.target.value })} placeholder="Gold-plated bracelet, ₹499, free shipping above ₹999, COD available…" className="input resize-y" />
          </Section>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-400">Preview</p>
          <Preview form={form} reels={reels} accountName={accountName} />
        </aside>
      </div>
    </form>
  );
}
