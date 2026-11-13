# Phase 2: Meta app setup & Instagram connection

By the end of this guide you'll click **Connect Instagram** in your dashboard, log in on
Instagram's own page, and see your account and Reels appear in Settings.

> Meta changes its dashboard wording from time to time. If a label doesn't match exactly,
> look for the closest equivalent. The concepts (Instagram app ID/secret, redirect URI,
> testers, permissions) stay the same.

---

## How the connection works

```
Dashboard ──"Connect Instagram"──▶ instagram.com login + consent screen
                                          │ (you approve 3 permissions)
                                          ▼
   /api/instagram/oauth/callback?code=…&state=…
        │ 1. verify state (CSRF protection)
        │ 2. code → short-lived token (1 hour)
        │ 3. short-lived → long-lived token (~60 days)
        │ 4. read profile (/me), encrypt token, save
        │ 5. sync Reels
        ▼
Settings page: "Instagram connected!"
```

The server renews the token automatically: it checks every 6 hours and renews any token
with 20 days or less left. Your Instagram password never touches this app.

---

## Step 1: Make the Instagram account professional

In the Instagram app: **Profile → ☰ → Settings → Account type and tools → Switch to
professional account**. Choose **Business** (recommended for a shop) or **Creator**.

Then allow tools to access messages, which DMs need in Phase 4:
**Settings → Messages and story replies → Message controls → Connected tools → Allow access to messages** → ON.

## Step 2: Create the Meta app

1. Go to <https://developers.facebook.com> → **My Apps** → **Create app**.
2. App name: e.g. `Sparkle Reel Automation`. Use your own email.
3. Use case: choose **"Manage messaging & content on Instagram"**.
4. Business portfolio: connect yours if you have one, or skip for now (it's needed later for
   App Review / Business Verification).
5. Click **Create app**.

## Step 3: Get the Instagram app ID and secret

1. In the app dashboard, open **Use cases → Manage messaging & content on Instagram →
   Customize** (or **Instagram → API setup with Instagram login**).
2. You'll see **Instagram app ID** and **Instagram app secret** (click *Show*).

> ⚠️ These are **different** from the "App ID" at the top of the dashboard. Use the
> **Instagram** ones.

Put them in `backend/.env`:

```env
INSTAGRAM_APP_ID=1234567890123456
INSTAGRAM_APP_SECRET=abc123...        # keep secret, never commit
META_GRAPH_API_VERSION=v26.0
```

## Step 4: Get an HTTPS URL (local testing)

Instagram only redirects to **HTTPS** URLs, so for local testing you expose your dev server
through a tunnel. Point the tunnel at the **dashboard (port 5173)**. Vite forwards `/api` to
the backend, so the dashboard and API share one HTTPS address, just like in production.

**Option A: ngrok** (free static domain, so the URL doesn't change):
```bash
# one-time: sign up at ngrok.com, then
ngrok config add-authtoken <your-token>
# use the free static domain shown in your ngrok dashboard:
ngrok http --url=your-name.ngrok-free.app 5173
```

**Option B: Cloudflare quick tunnel** (no account, but the URL changes every run):
```bash
cloudflared tunnel --url http://localhost:5173
```

Set **both** URLs in `backend/.env` to the tunnel address, then restart the backend:

```env
APP_BASE_URL=https://your-name.ngrok-free.app
FRONTEND_URL=https://your-name.ngrok-free.app
```

From now on, open the dashboard at **https://your-name.ngrok-free.app**, not localhost.
The login cookie and the connect flow need that single address.

## Step 5: Register the redirect URI

Back in **API setup with Instagram login**, find **"Set up Instagram business login"**
(or **Business login settings**) and add this under **OAuth redirect URIs**:

```
https://your-name.ngrok-free.app/api/instagram/oauth/callback
```

It must match **exactly**: `https`, no trailing slash, same domain as `APP_BASE_URL`.
Save. (In production this becomes `https://automation.yourshop.in/api/instagram/oauth/callback`.)

## Step 6: Add yourself as a tester (Development mode)

While the app is in **Development mode**, only accounts with a role on the app can connect.

1. **App roles → Roles → Add people → Instagram Tester** → enter the Instagram username.
2. Accept the invite. In a browser, log in to instagram.com → **Settings → Apps and
   websites → Tester invites → Accept**. If the invite doesn't show on the web, look in
   the app under **Settings → Website permissions**.

## Step 7: Connect

1. `cd backend && npm run migrate` (adds the Phase 2 columns), then `npm run dev`.
2. `cd frontend && npm run dev`, with your tunnel running.
3. Open `https://your-name.ngrok-free.app` → sign in → **Settings** → **Connect Instagram**.
4. Log in to Instagram and **allow all three permissions**:

| Permission | Shown as | Used for |
|---|---|---|
| `instagram_business_basic` | Profile & Reels | Account info, list of Reels |
| `instagram_business_manage_comments` | Reply to comments | Public comment replies (Phase 4) |
| `instagram_business_manage_messages` | Send DMs | Private replies + conversations (Phase 4–5) |

5. You're sent back to Settings with **"Instagram connected!"**, and your Reels appear within a few seconds.

---

## Testing checklist

| Test | Expected |
|---|---|
| Dashboard → System status | "Instagram app credentials: Ready", "Instagram account: Connected, @username" |
| Settings → token | ~59 days left |
| **Sync Reels** | Reels grid updates |
| **Renew token now** right after connecting | Polite error: Instagram only allows a refresh 24h after issue (this is correct) |
| Cancel on Instagram's consent screen | "You cancelled the Instagram login" |
| Open `…/api/instagram/oauth/callback?code=x&state=y` directly | "The connection link expired…" (forged requests are rejected) |
| **Disconnect** then **Connect** again | Same account comes back (no duplicate) |
| `SELECT access_token_enc FROM instagram_accounts;` in MySQL | Starts with `v1:`, and the real token is not readable |
| `npm test` in backend | All tests pass |

## Troubleshooting

| Symptom | Fix |
|---|---|
| Instagram says **"Invalid redirect_uri"** | The URI in Meta must equal `APP_BASE_URL` + `/api/instagram/oauth/callback` exactly. Restart the backend after changing `.env`. |
| **"Invalid platform app"** / **"Invalid app ID"** | You used the Meta App ID. Use the **Instagram app ID** from Step 3. |
| "Insufficient developer role" / the account can't log in | Add the account as **Instagram Tester** and accept the invite (Step 6). |
| Back on Settings with **"link expired"** | You started on `localhost` but returned to the tunnel domain (or the reverse). Always use the tunnel URL. The link is also only valid for 10 minutes. |
| Vite shows **"Blocked request. This host is not allowed"** | Your tunnel domain isn't in `allowedHosts` in `frontend/vite.config.js`; add it. |
| Connection fails: **"connect_failed"** | Check the backend console. Usually the app secret is wrong or it's the Meta secret instead of the Instagram one. |
| Status shows **Reconnect needed** | Token revoked (password change, app removed in Instagram settings). Click **Reconnect Instagram**. |

---

## Going live later (before real customers, after Phase 4)

In Development mode the automation only works for app-role accounts. To serve everyone:

1. Host the app on your real domain with HTTPS (Phase 8) and update the redirect URI.
2. Add a **Privacy Policy URL** (and ideally Terms + a data-deletion instructions URL) in **App settings → Basic**.
3. Complete **Business Verification** if Meta asks for it.
4. Submit **App Review** for Advanced Access to all three permissions, with a screencast
   showing exactly how each is used (comment → public reply → DM, dashboard inbox).
5. Switch the app to **Live** mode.

We'll prepare the App Review screencast script together once Phase 4 works.
