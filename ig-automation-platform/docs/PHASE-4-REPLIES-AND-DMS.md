# Phase 4: Public replies & private DMs

When a comment matches a campaign, the platform replies under the comment after a short,
human-like delay, then sends one private DM to the commenter, following Meta's rules.

---

## What happens after a match

```
Comment "Price?" matches campaign "Gold bracelet"
   │
   ├─ wait a random 20–90 s  (reply_delay_min/max_seconds)
   │
   ├─ 1. Public reply  →  POST /{comment-id}/replies
   │      a random variant, e.g. "Thank you priya! Please check your DM ❤️"
   │
   └─ 3–8 s later
      2. Private reply (DM)  →  POST /me/messages  { recipient: { comment_id }, message: { text } }
         "Hi priya! ❤️ The gold bracelet is ₹499…"
         → saved to the inbox (contacts + messages) so the conversation can continue (Phase 5/7)
```

**Right before sending**, each action checks again:

| Check | If it fails |
|---|---|
| Account connected and token valid | Skipped: "Instagram account needs reconnecting" |
| Comment automation switched on | Skipped |
| Campaign still exists and is active (you can pause it during the delay) | Skipped: "Campaign was paused or deleted" |
| DM automation switched on (DM only) | DM skipped |
| Comment is less than 7 days old (DM only) | **DM not allowed** (Meta's private-reply window) |
| Fewer than `max_actions_per_hour` actions in the last hour (default 120) | Waits 10 min and tries again; nothing is lost |
| Not already sent | Nothing happens: retries never double-send |

### When Meta says no

| Meta response | What the platform does |
|---|---|
| Rate limit, server error or timeout | Retries automatically after ~30s, 2m, 8m, 32m |
| Expired or revoked token | Stops and marks the account **Reconnect needed** |
| Refuses the DM (privacy settings, outside window, already replied) | Marks it **DM not allowed**. No retry: retrying would never work and could look like spam |
| Comment was deleted | Marks it **Reply failed** with Meta's reason |

Failed actions get a **Try again** button on the Comments page. It retries only what failed
and never re-sends anything that was already delivered.

### Statuses on the Comments page

| Status | Meaning |
|---|---|
| **Queued** | Waiting for the reply delay |
| **Done** | Everything the campaign asked for was sent |
| **Partly sent** | e.g. the public reply worked but Meta didn't allow the DM |
| **Failed** | Nothing could be sent (see the error) |
| **Skipped** | A rule stopped it (own comment, repeat commenter, campaign paused, …) |

---

## Creating a campaign

**Campaigns → New campaign**

1. **Name**, e.g. "Gold bracelet launch".
2. **Which Reels?** Pick one or more synced Reels, or choose **All Reels** (including future ones).
3. **Keywords**: type and press Enter, or click a suggestion (price, link, buy, details,
   available, order, catalogue…). Choose *contains* (recommended) or *exact* matching.
4. **Public reply variants**: write 2–4 different replies. One is chosen at random each time,
   never the same one twice in a row. `{{username}}` becomes the commenter's name.
5. **Automatic DM**: the private message (max 1000 characters). `{{username}}` works here too.
6. **Product information**: notes the AI will use in Phase 5.
7. **Priority**: if two campaigns match the same comment, the higher priority wins. The
   Campaigns page warns you about overlaps.

The phone preview on the right shows exactly what the customer will see.

> **Tip:** keep public replies short and friendly, and put prices and links in the DM.
> Several variants plus the random delay make the account look natural, not like a bot.

---

## Testing

**Locally, without Instagram:**
```bash
cd backend && npm run migrate        # adds the Phase 4 columns
npm run dev                          # in another terminal: cd frontend && npm run dev
# create a campaign for a synced Reel with keyword "price", then:
npm run webhook:simulate -- "Price?" --media=<that Reel's ID>
```
In local testing without a real token, the reply shows **Reply failed**. That proves the
pipeline ran and Meta's error was recorded.

**For real** (Development mode): connect your account, create a campaign, and comment from a
**second account that has a role on the app**. Within about 20–90 seconds you'll see the public
reply under the comment and the DM in that account's inbox (possibly under *Message requests*).

To test faster, temporarily lower the delay:
```sql
UPDATE app_settings SET value='3' WHERE `key` IN ('reply_delay_min_seconds','reply_delay_max_seconds');
```
(The Settings page in Phase 6 will have controls for this.)

| Test | Expected |
|---|---|
| Comment with a keyword | Public reply + DM; status **Done** |
| Same person comments again on the same Reel | Skipped: already handled |
| Pause the campaign within the delay | Skipped: campaign paused; nothing sent |
| DM recipient has restrictive privacy settings | **Partly sent / DM not allowed** |
| Comment older than 7 days | Public reply only; DM not allowed |
| `npm test` | All tests pass |

---

## Meta App Review (needed before real customers)

You now have everything Meta wants to see. Record a screencast that shows:

1. Logging in to the dashboard and connecting Instagram (Settings → Connect Instagram):
   `instagram_business_basic`.
2. Creating a campaign, commenting "price" from a test account, and the public reply appearing:
   `instagram_business_manage_comments`.
3. The DM arriving, and the conversation in the dashboard: `instagram_business_manage_messages`.

For each permission, explain in one or two sentences why the business needs it ("replies to
customers who ask for prices under our Reels and sends them product details by DM"). Then
submit it in App Review, together with your privacy policy URL.
