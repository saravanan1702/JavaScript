# Phase 3: Webhooks & comment detection

When someone comments on a Reel, Meta POSTs the comment to your server within seconds. The
platform verifies it really came from Meta, stores it once, works out which Reel and
customer it belongs to, checks your keywords, and shows the result on the **Comments** page.

Phase 4 adds the actual public reply and DM to comments marked **Matched**.

---

## How a comment flows through the system

```
Meta ──POST /api/webhooks/instagram──▶ 1. Check X-Hub-Signature-256 (HMAC of raw body)  ✗ → 401, nothing stored
                                       2. Split into events, dedupe (Meta retries are dropped)
                                       3. Save to webhook_events + queue a job
                                       4. Reply 200 OK  (in a few milliseconds)
Worker (background) ─────────────────▶ 5. Find the connected account (entry.id)
                                       6. Save comment: Reel ID, commenter ID + username, text
                                       7. Decide:
                                          • own comment?                → Skipped (prevents reply loops)
                                          • comment automation off?     → Skipped
                                          • reply inside a thread?      → Skipped (setting)
                                          • keyword match in a campaign for this Reel?
                                               no  → No keyword
                                               yes, but person already handled on this Reel → Skipped
                                               yes → Matched  (Phase 4 replies here)
```

If processing fails (e.g. the database is busy), the job retries automatically after
about 30s, 2m, 8m and 32m. If every retry fails, the event shows as **Failed** on the Logs
page with a **Process again** button.

### Keyword matching rules

| Comment | Keyword `price` |
|---|---|
| `Price` · `PRICE??` · `what's the price 😍` · `price❤️` · `prices` | ✅ match |
| `priceless` · `enterprice` | ❌ no match (whole words only) |

- Works with Tamil, Hindi and other scripts (e.g. `விலை`, `कीमत`).
- **Exact** mode: the whole comment must be the keyword (`Price!!` ✅, `price pls` ❌).
- If several campaigns match, the winner is chosen by: higher priority, then Reel-specific over "all Reels", then the more specific keyword.

---

## Setup

### Step 1: Add the verify token

Run `npm run gen-secrets` (or invent any long random string) and add the token to `backend/.env`:

```env
META_WEBHOOK_VERIFY_TOKEN=3f9c0b5e8a7d4c1e9b2a6f0d8c7e5a4b3c2d1e0f9a8b7c6d
# Optional: also accept signatures made with the Meta App secret (App settings → Basic)
META_APP_SECRET=
```

Restart the backend and run `npm run migrate` (Phase 3 adds a couple of columns).

### Step 2: Make sure the URL is HTTPS

Keep your tunnel from Phase 2 running (`ngrok http --url=your-name.ngrok-free.app 5173`).
**Settings → Webhooks → Callback URL** shows the exact URL to use:

```
https://your-name.ngrok-free.app/api/webhooks/instagram
```

### Step 3: Configure webhooks in the Meta dashboard

1. App Dashboard → **Instagram → API setup with Instagram login** → **Configure webhooks**.
2. **Callback URL**: paste the URL above.
3. **Verify token**: paste your `META_WEBHOOK_VERIFY_TOKEN`.
4. Click **Verify and save**. Meta calls your server, which answers the challenge.
   **Logs → Activity** shows "Webhook callback URL verified by Meta".
5. In the webhook fields list, **subscribe** to `comments` and `messages`.

### Step 4: Subscribe the account

This happens automatically when you connect Instagram. To redo it, open **Settings → Webhooks →
Subscribe account to webhooks**. The badge turns **Receiving events**.

> Both halves are required: the *app-level* webhook configuration in the Meta dashboard
> (Step 3), and the *account-level* subscription (Step 4).

### Step 5: Test it

**Without Instagram** (works any time, even offline). This sends a correctly signed
payload, exactly like Meta's:

```bash
cd backend
npm run webhook:simulate -- "Price?"
npm run webhook:simulate -- "link pls 🙏" --user=priya
npm run webhook:simulate -- "Price?" --url=https://your-name.ngrok-free.app   # through the tunnel
```

**With Meta's test button**: in the webhook fields list, click **Test** next to `comments`.
Meta sends a sample event. It shows on **Logs → Webhook events**, normally as *ignored*,
because the sample's account ID isn't yours.

**For real**: from a **different** Instagram account (one with a role on the app while in
Development mode), comment on one of your Reels. It appears on **Comments** within seconds.

> To see **Matched**, you need a campaign with keywords. The campaign editor arrives in
> Phase 4. Until then, comments correctly show **No keyword**.

---

## Testing checklist

| Test | Expected |
|---|---|
| Meta **Verify and save** | Succeeds; activity log says "verified by Meta" |
| Wrong verify token in Meta | Meta shows an error; your server returns 403 |
| `curl -X POST <callback> -H 'Content-Type: application/json' -d '{}'` | **401** (no signature), and nothing is stored |
| `npm run webhook:simulate -- "Price?"` | Comment appears on **Comments** |
| Comment from your **own** account | Skipped: "Written by your own account" |
| Same event delivered twice by Meta | Stored once (dedupe) |
| Stop MySQL, then simulate | Server returns 500 so Meta retries later; once MySQL is back, events go through |
| `npm test` | All tests pass |

## Troubleshooting

| Symptom | Fix |
|---|---|
| Meta: **"The URL couldn't be validated"** | Is the tunnel running? Is the URL HTTPS? Does the verify token match `.env`, and did you restart the backend after editing it? |
| Events arrive but show **401** in the backend log | Meta signs with the secret of the product the webhook belongs to. Check that `INSTAGRAM_APP_SECRET` is correct, and also set `META_APP_SECRET`. |
| Nothing arrives for real comments | (1) Fields `comments`/`messages` subscribed in the dashboard? (2) Settings shows **Receiving events**? (3) In Development mode, the *commenter* must also have a role on the app. (4) Comments by your own account are delivered but skipped. |
| Events are **ignored** with "No connected account" | The event is for a different Instagram account (e.g. Meta's Test button sample). |
| ngrok shows a browser warning page | It only affects browsers, not Meta's servers. |
