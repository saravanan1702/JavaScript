# Reel Automation: self-hosted Instagram comment & DM automation

Your own alternative to ManyChat-style tools. Built on the **official Meta Instagram API**,
**Claude AI** and **MySQL**, and running on a server you control.

- Auto-reply to Reel comments that contain your keywords ("price", "link", "details", …)
- Send one private DM per eligible comment, within Meta's rules
- Claude answers follow-up DMs using **only** your business knowledge base (no invented prices or stock)
- Campaigns per Reel, an inbox with human takeover, analytics, and logs

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the design, Meta API rules, security
model, schema and prerequisites.

## Build status

| Phase | Scope | Status |
|---|---|---|
| 1 | Architecture, folder structure, full DB schema, admin auth, dashboard shell | ✅ Done |
| 2 | Meta Developer App setup + Instagram account connection (OAuth) | ✅ Done ([setup guide](docs/PHASE-2-META-SETUP.md)) |
| 3 | Webhooks + comment detection | ⏳ Next |
| 4 | Public comment replies + private DMs | |
| 5 | Claude AI chatbot + knowledge base | |
| 6 | Admin dashboard + settings | |
| 7 | Customer inbox + analytics | |
| 8 | Deployment + 24/7 operation | |

---

## Phase 1: run it locally

### 1. Start MySQL

```bash
cd ig-automation-platform
docker compose up -d          # MySQL 8.4 on 127.0.0.1:3306
docker compose ps             # wait until "healthy"
```

> No Docker? Install MySQL 8 and run:
> ```sql
> CREATE DATABASE ig_automation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> CREATE USER 'igauto'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
> GRANT ALL PRIVILEGES ON ig_automation.* TO 'igauto'@'localhost';
> ```

### 2. Configure and start the backend

```bash
cd backend
npm install
cp .env.example .env
npm run gen-secrets           # paste JWT_SECRET and ENCRYPTION_KEY into .env
npm run migrate               # creates all tables
npm run create-admin          # your dashboard login (password ≥ 12 chars)
npm run dev                   # API on http://localhost:4000
```

Check it: `curl http://localhost:4000/api/health` should print `{"status":"ok","db":true}`.

### 3. Start the dashboard

```bash
cd ../frontend
npm install
npm run dev                   # http://localhost:5173
```

Open <http://localhost:5173> and sign in. The **System status** card shows the database as
*Ready*. To connect Instagram, follow **[docs/PHASE-2-META-SETUP.md](docs/PHASE-2-META-SETUP.md)**.

The frontend has **no `.env`**: it only calls `/api` on its own origin (Vite proxies it in
dev, Nginx in production), so no keys can leak into the browser bundle.

### 4. Run the tests

```bash
cd backend
npm test
```

The tests mock the database and Meta's API, so they run offline without MySQL. They cover
token encryption, login and sessions, security headers, the Instagram OAuth flow (state/CSRF
checks, expired and forged callbacks, cancel, partial permissions), token exchange and refresh,
Graph API error mapping, and media paging.

---

## Environment variables (backend/.env)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | | `development` / `production` |
| `PORT` | | API port (default 4000) |
| `APP_BASE_URL` | | Public HTTPS URL of the app; the OAuth redirect URI is `APP_BASE_URL/api/instagram/oauth/callback` |
| `FRONTEND_URL` | | Dashboard origin (CORS + redirect after connecting). Same as `APP_BASE_URL` when using a tunnel or Nginx |
| `TRUST_PROXY` | | `true` behind Nginx |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | ✅ | MySQL connection |
| `JWT_SECRET` | ✅ | ≥ 32 chars, signs admin sessions |
| `JWT_EXPIRES_IN` | | Session length (default `12h`) |
| `ENCRYPTION_KEY` | ✅ | 32 bytes base64, encrypts Instagram tokens. **Back it up.** |
| `INSTAGRAM_APP_ID` `INSTAGRAM_APP_SECRET` | Phase 2 | **Instagram** app ID/secret from *API setup with Instagram login* (not the Meta App ID) |
| `META_WEBHOOK_VERIFY_TOKEN` | Phase 3 | Random string you also enter in the Meta webhook settings |
| `META_GRAPH_API_VERSION` | | Default `v26.0`; use the latest in Meta's changelog |
| `ANTHROPIC_API_KEY` | Phase 5 | Claude API key |
| `ANTHROPIC_MODEL` | | Default `claude-opus-5-5` |

The server **refuses to start** if a required variable is missing or malformed, and prints exactly which one.

## Useful commands

```bash
npm run migrate            # apply migrations
npm run migrate:rollback   # undo the last batch
npm run create-admin       # add another admin
npm run gen-secrets        # new random secrets
```
