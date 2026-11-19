# Phase 7: Customer inbox & analytics

## Inbox

**Inbox** in the sidebar, which shows a badge with the number of conversations that need you.

```
┌ Conversations ─────────┬ Thread ───────────────────────────┬ Customer ─────────┐
│ Search @username       │ @priya · You can reply for 18h 40m│ Messages: 3       │
│ All · Needs you · …    │ [AI replies ●]                    │ AI replies: 2     │
│ @priya  Needs you      │ "Needs you: damaged item" [Resolve]│ Notes (private)   │
│ @kavya  AI paused      │ 💬 Commented "price?" → Bracelet   │ Comments on your  │
│ …                      │ Auto DM / AI / You bubbles        │ Reels (history)   │
│                        │ [ Write a reply…            Send ]│                   │
└────────────────────────┴───────────────────────────────────┴───────────────────┘
```

| Feature | Details |
|---|---|
| Conversation list | Newest first; filters **All · Needs you · Unread · AI paused · Can reply**; search by username; refreshes every 8 s |
| Thread | Every message, labelled **Auto DM** (campaign private reply), **AI** (with its topic) or **You**, plus the comment that started the chat. Refreshes every 5 s |
| AI hand-offs | Shown as "Handed over: …" under the AI message, with a **Needs you** banner and a **Mark resolved** button |
| Reply manually | Enter to send, Shift+Enter for a new line, max 1000 characters |
| Messaging window | Header shows "You can reply for 18h 40m". After 24 h without a customer message the composer is replaced by an explanation (Meta's rule) |
| Pause / resume AI | Per customer, with the reason shown ("paused after handing over to you", "paused because you replied", "paused by you") |
| Customer panel | Message counts, first seen, **private notes**, and all their comments on your Reels (with campaign and outcome) |
| Read state | Opening a thread marks it read |

**Replying pauses the AI for that customer** (setting *Pause the AI when you reply yourself*,
on by default), so you and the AI never answer at the same time. Switch **AI replies** back
on when you're done. The AI then answers the customer's *next* message.

> Messages outside the 24-hour window need Meta's "Human Agent" permission, which requires
> separate approval. This platform deliberately doesn't send outside the window.

## Analytics

**Analytics** in the sidebar, with filter **7 · 30 · 90 days**.

| Section | What it tells you |
|---|---|
| Median time to public reply | Includes your deliberate random delay (20–90 s by default) |
| Median AI reply time | From the customer's message to the AI answer |
| DM delivery rate | Private replies delivered ÷ attempted (the rest Meta didn't allow) |
| Best-converting Reel | Highest share of commenters who received a DM (Reels with 5+ comments) |
| **When customers comment** | Weekday × hour heatmap in your time zone. Post Reels shortly before the dark cells |
| **What customers ask the AI** | Price, COD, shipping, order, complaints… Add missing answers to your Knowledge Base |
| **Performance by Reel** | Comments, matches, replies, DMs and conversion per Reel |
| **Campaign performance** | Matches, replies, DMs, "DM not allowed", issues, DM rate per campaign |

Every chart has a **Table** view.

## API (admin only)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/inbox/conversations?filter=&q=&page=` | Conversation list + counts |
| GET | `/api/inbox/conversations/:id` | Thread, customer, history (marks read) |
| POST | `/api/inbox/conversations/:id/messages` | `{ text }`: manual reply (inside the 24 h window only) |
| PATCH | `/api/inbox/conversations/:id` | `{ aiPaused?, needsAttention?, notes? }` |
| GET | `/api/analytics?days=7\|30\|90` | Analytics data |

## Testing checklist

| Test | Expected |
|---|---|
| `npm run demo:seed`, then open Inbox | Conversations with Auto DM / AI bubbles; some marked *Needs you* |
| Filter **Needs you** | Matches the sidebar badge |
| Open a conversation inside the window and reply | Your message appears as **You**; AI switches to paused |
| Customer replies while the thread is open (`npm run webhook:simulate`, or a real DM) | Appears within ~5 s |
| Open a conversation older than 24 h | Composer replaced by the window explanation |
| **Mark resolved** / AI toggle / notes | Saved; list badges update |
| Analytics → heatmap | Matches when your comments arrive (demo data peaks 12–1 PM and 7–10 PM) |
| `npm test` | All tests pass |
