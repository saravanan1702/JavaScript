# Phase 6: Admin dashboard & settings

## Dashboard

One date filter at the top (**Today · 7 · 30 · 90 days**, in your time zone) controls
everything on the page. The page refreshes every minute.

| Section | What it shows |
|---|---|
| **Alerts** | Conversations that need you (AI handed over, photo received), failed webhook events, Instagram disconnected |
| **KPI tiles** | Comments received · Automatic DMs sent · Customer enquiries · Successful automations · Keyword matches · Public replies · Active campaigns · Failed webhook events, each with the change vs the previous period of the same length |
| **Activity** | Comments, public replies and DMs per day. Hover (or focus it and press ←/→) for exact numbers; **Table** shows the raw numbers |
| **Automation funnel** | Comments → matched a keyword → public reply → private reply (DM), with % of comments |
| **Automation outcomes** | Done / partly sent / failed / skipped / waiting for matched comments |
| **Top campaigns / Top keywords** | What's working and what customers ask for |
| **Recent conversations** | Latest DM threads, marked *Needs you* or *AI paused* |
| **AI assistant** | AI replies, hand-overs to you, tokens used, and the share served from the cache |
| **System health** | Database, Instagram token, webhooks (time of the last event), Claude |

### How the numbers are defined

| Metric | Counted as |
|---|---|
| Comments received | Every comment delivered by Meta in the period |
| Keyword matches | Comments that matched a campaign |
| Public replies | Public replies actually posted |
| Automatic DMs sent | Private replies + AI replies successfully sent |
| Customer enquiries | Unique customers who sent you a DM |
| Successful automations | Matched comments where everything (reply + DM) was sent |
| Success rate | Done ÷ (done + partly sent + failed) |
| Failed webhook events | Events that still failed after all automatic retries |

Every chart has a **Table** button (an accessible alternative), and every chart colour
is also labelled, so nothing relies on colour alone.

## Settings

**Settings → Automation**

| Setting | Default | What it does |
|---|---|---|
| Comment automation | On | Master switch for all campaigns |
| Automatic DMs | On | Send the private reply after the public reply |
| AI chatbot | Off | Claude answers DMs (needs `ANTHROPIC_API_KEY`) |
| Duplicate comment protection | On | One automation per person per Reel |
| Reply inside comment threads | Off | Also react to replies under other comments |
| Minimum / maximum delay | 20 / 90 s | Random human-like wait before the public reply |
| Max replies + DMs per hour | 120 | Safety cap; extra replies wait instead of failing |

AI-specific options (answer quality, wait before replying, pause rules) are under
**Knowledge Base → AI assistant**.

**Settings → Instagram & webhooks**: connect/reconnect, token status, webhook callback URL and subscription.

**Settings → System status**: API connection status, background job queue (waiting / running /
failed in 24h), latest error, uptime. Refreshes every 15 seconds.

## Try it with demo data

```bash
cd backend
npm run demo:seed     # ~30 days of realistic activity (refuses to run in production)
npm run demo:clear    # removes every demo row (IDs start with "demo_"); your real data is untouched
```

## Configuration

```env
APP_TIMEZONE=Asia/Kolkata   # "today" and the daily chart buckets
```

## Testing checklist

| Test | Expected |
|---|---|
| `npm run demo:seed`, then open the dashboard | All cards filled; the 30-day chart rises over the month |
| Switch Today / 7 / 30 / 90 days | Every number and chart changes together |
| Hover the Activity chart | Tooltip with all three series for that day |
| Click **Table** on any chart | The same numbers as a table |
| Settings → turn **Comment automation** off | New matched comments show "Skipped: comment automation is turned off" |
| Set minimum delay > maximum | Rejected with a clear message |
| Settings → System status | Queue numbers and last error shown |
| `npm run demo:clear` | Dashboard back to real data only |
