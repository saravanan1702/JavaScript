# Phase 8: Deployment & 24/7 operation

This guide puts the platform on your own server with HTTPS, automatic restarts, daily
backups and safe one-command updates. Plan for about an hour the first time.

```
Internet ──443──▶ Nginx (HTTPS, Let's Encrypt) ──┬── /        React dashboard (static files)
                                                  └── /api/*   Node.js app + worker (systemd, 127.0.0.1:4000)
                                                                 └── MySQL (localhost only)
Firewall: only 22 (SSH), 80, 443 open
```

Everything in `deploy/` was tested end to end on Ubuntu 24.04:
- **Deploy:** the real `deploy.sh` (pull → build → backup → migrate → switch → health check) and its automatic rollback with a deliberately broken release.
- **Nginx:** the production config, checking HTTPS redirect, security headers and policy, caching, `Secure` cookies, the login rate limit and webhook signatures through the proxy.
- **Backups:** a backup → restore round trip with matching row counts.
- **Scripts:** `shellcheck`.

---

## 1. Choose a server

| | **VPS (recommended)** | **AWS EC2** |
|---|---|---|
| Examples | Hetzner, DigitalOcean, Hostinger, Vultr, Linode | `t3.small` / `t4g.small` |
| Size | **2 GB RAM, 1–2 vCPU, 40+ GB SSD** | 2 GB RAM, 30+ GB gp3 disk |
| Region | Closest to your customers (e.g. Mumbai/Bangalore) | `ap-south-1` (Mumbai) |
| Rough cost | ~₹400–1,200 / month | ~₹1,200–2,000 / month + data transfer |
| Extra setup | None | Security group (22 from your IP, 80, 443), **Elastic IP** |

Choose **Ubuntu 24.04 LTS**. 1 GB RAM works too (the setup script adds swap), but 2 GB is
comfortable for MySQL + Node + building updates.

> **EC2:** in the security group, allow port 22 from **your IP only**, and 80 + 443 from
> anywhere. Attach an Elastic IP so the address never changes.

## 2. Point your domain at the server

At your domain registrar, create a DNS record:

| Type | Name | Value |
|---|---|---|
| A | `automation` (for `automation.yourshop.in`) | your server's IPv4 address |
| AAAA *(optional)* | `automation` | your server's IPv6 address |

Check it (it can take a few minutes): `nslookup automation.yourshop.in` should show your IP.

## 3. Log in and secure SSH

```bash
ssh root@YOUR_SERVER_IP            # EC2: ssh -i key.pem ubuntu@YOUR_SERVER_IP
adduser admin && usermod -aG sudo admin          # skip on EC2 (use "ubuntu")
mkdir -p /home/admin/.ssh && cp ~/.ssh/authorized_keys /home/admin/.ssh/ && chown -R admin:admin /home/admin/.ssh
```

Open a **second terminal** and confirm `ssh admin@YOUR_SERVER_IP` works. Then disable
password logins: in `/etc/ssh/sshd_config` set `PasswordAuthentication no` and
`PermitRootLogin no`, and run `sudo systemctl restart ssh`.

## 4. Run the setup script

**Public repository:**
```bash
git clone https://github.com/YOU/YOUR-REPO.git /tmp/igauto
sudo DOMAIN=automation.yourshop.in EMAIL=you@example.com \
     REPO_URL=https://github.com/YOU/YOUR-REPO.git BRANCH=main \
     bash /tmp/igauto/ig-automation-platform/deploy/scripts/setup-server.sh
```

**Private repository** (recommended), using a read-only *deploy key*:
```bash
git clone https://github.com/YOU/YOUR-REPO.git /tmp/igauto   # with your own credentials, just for setup
sudo DOMAIN=automation.yourshop.in EMAIL=you@example.com bash /tmp/igauto/ig-automation-platform/deploy/scripts/setup-server.sh

# Give the server its own read-only key:
sudo -u igauto mkdir -p /opt/ig-automation/.ssh
sudo -u igauto ssh-keygen -t ed25519 -N "" -f /opt/ig-automation/.ssh/id_ed25519
sudo cat /opt/ig-automation/.ssh/id_ed25519.pub
# GitHub → repo → Settings → Deploy keys → Add key (read-only) → paste it
sudo -u igauto git clone --branch main git@github.com:YOU/YOUR-REPO.git /opt/ig-automation/repo
```

> Replace `BRANCH=main` with the branch you deploy from. To deploy this work as-is, use
> `BRANCH=claude/instagram-automation-ai-8dy2r1`, or merge it into `main` first (recommended).

What the script sets up:
- automatic security updates
- Node.js 22, MySQL 8 and Nginx
- a firewall and fail2ban
- swap on small servers, and log size limits
- the app user and folders
- the database, with a random password
- `shared/.env` with fresh secrets
- the 24/7 service and daily backup timer
- the Let's Encrypt certificate (it renews automatically)
- the Nginx site

The script is safe to re-run.

## 5. Add your keys and deploy

```bash
sudo -u igauto nano /opt/ig-automation/shared/.env
#   INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET   (Meta app → Instagram → API setup with Instagram login)
#   META_APP_SECRET                           (optional, App settings → Basic)
#   ANTHROPIC_API_KEY                         (platform.claude.com)
# Everything else was generated for you.

sudo BRANCH=main bash /opt/ig-automation/repo/ig-automation-platform/deploy/scripts/deploy.sh

cd /opt/ig-automation/current/backend && sudo -u igauto NODE_ENV=production npm run create-admin
```

Open **https://automation.yourshop.in** and sign in.

> 🔐 Copy `ENCRYPTION_KEY` from `/opt/ig-automation/shared/.env` into your password manager.
> If the server is ever lost, a database backup plus this key restores everything. Without
> the key you only need to reconnect Instagram.

> The server refuses to start in production if `.env` is insecure: an `http://` URL,
> example secrets, `TRUST_PROXY` not true, or a weak DB password. The error names the
> exact setting (`journalctl -u ig-automation -n 50`).

## 6. Switch Meta to your real domain

In the Meta App Dashboard (Instagram → API setup with Instagram login):

1. **OAuth redirect URI:** add `https://automation.yourshop.in/api/instagram/oauth/callback` (remove the tunnel URL).
2. **Webhooks:** callback URL `https://automation.yourshop.in/api/webhooks/instagram`, verify token = `META_WEBHOOK_VERIFY_TOKEN` from `.env`, then **Verify and save**; fields `comments`, `messages`.
3. In the dashboard: **Settings → Instagram & webhooks → Connect Instagram**, then check that **Receiving events** shows.
4. **Settings → System status:** everything green.

---

## 7. Go-live checklist

**Technical**
- [ ] https://your-domain loads with a valid padlock; http:// redirects to https://
- [ ] `curl https://your-domain/api/health` → `{"status":"ok","db":true}`
- [ ] Settings → System status all green; Instagram token days > 50
- [ ] A test comment from an app-role account gets a public reply + DM
- [ ] Backup timer active: `systemctl list-timers ig-automation-backup.timer`
- [ ] First backup exists: `sudo systemctl start ig-automation-backup && ls -l /opt/ig-automation/backups`
- [ ] Uptime monitor set up (step 8)
- [ ] `ENCRYPTION_KEY` and the admin password saved in a password manager
- [ ] Reboot test: `sudo reboot`, and the site is back on its own within a minute

**Meta (needed before real customers can trigger the automation)**
- [ ] Privacy Policy URL (and Terms) set in App settings → Basic
- [ ] Data deletion instructions URL (or a callback). A page explaining "DM us 'delete my data' and we remove your conversation within 7 days" is acceptable for most apps
- [ ] Business Verification completed (if Meta asks)
- [ ] App Review submitted for **instagram_business_basic**, **instagram_business_manage_comments** and **instagram_business_manage_messages**. Use the screencast script in `docs/PHASE-4-REPLIES-AND-DMS.md`
- [ ] After approval, switch the app to **Live** mode
- [ ] Test again with an account that has **no** role on the app

---

## 8. Running it day to day

| Task | Command |
|---|---|
| Is it running? | `sudo systemctl status ig-automation` |
| Live logs | `sudo journalctl -u ig-automation -f` |
| Errors only | `sudo journalctl -u ig-automation -p warning --since today` |
| Restart | `sudo systemctl restart ig-automation` |
| **Update to the latest code** | `sudo BRANCH=main bash /opt/ig-automation/repo/ig-automation-platform/deploy/scripts/deploy.sh` |
| Which version is live? | `cat /opt/ig-automation/current/REVISION` |
| Backup now | `sudo systemctl start ig-automation-backup` |
| Restore a backup | `sudo bash /opt/ig-automation/current/deploy/scripts/restore-db.sh /opt/ig-automation/backups/<file>.sql.gz` |
| Nginx check / reload | `sudo nginx -t && sudo systemctl reload nginx` |
| Certificate status | `sudo certbot certificates` (renews automatically; test with `sudo certbot renew --dry-run`) |

**Updates are safe:** `deploy.sh` builds the new version beside the running one, backs up the
database, migrates, switches over instantly, and checks health. If the new version doesn't come
up within 60 seconds it **switches back automatically**. The last 5 releases are kept.

**Manual rollback** (e.g. a bug you notice later):
```bash
ls /opt/ig-automation/releases                     # pick the previous one
sudo -u igauto ln -sfn /opt/ig-automation/releases/<previous> /opt/ig-automation/current
sudo systemctl restart ig-automation && sudo systemctl reload nginx
```

**Monitoring.** Create a free monitor at UptimeRobot or Better Stack:
- URL: `https://your-domain/api/health`
- Keyword: `"status":"ok"`
- Interval: 5 minutes
- Alerts by email or phone

The dashboard itself warns about an expired Instagram token, failed webhooks and conversations needing you.

**Off-server backups** (strongly recommended). Backups are kept 14 days on the server. To also
copy them to Google Drive, S3 or Backblaze, install and configure `rclone`
(`sudo -u igauto rclone config`), then add to the backup service:
```bash
sudo systemctl edit ig-automation-backup
# [Service]
# Environment=RCLONE_REMOTE=gdrive:igauto-backups
```
The backup service is already allowed to update rclone's config folder (`/opt/ig-automation/.config/rclone`), so refreshed cloud logins are saved.

**Data retention.** Activity logs and raw webhook payloads are deleted after `DATA_RETENTION_DAYS`
(default 90). Conversations, comments and statistics are kept.

---

## 9. Security summary

| Layer | Protection |
|---|---|
| Network | Firewall: SSH/HTTP/HTTPS only; MySQL and Node listen on localhost only; fail2ban on SSH |
| Transport | HTTPS everywhere (TLS 1.2/1.3), HSTS, automatic certificate renewal |
| Browser | CSP (scripts only from your domain), no framing, no MIME sniffing, strict referrer |
| App | Admin login with bcrypt + httpOnly/Secure/SameSite cookie; login rate-limited in Nginx and the app; Zod validation on every input |
| Meta | Webhook HMAC signatures verified; OAuth state/CSRF protection; tokens AES-256-GCM encrypted |
| Secrets | `.env` readable only by the app user (600); never in git; never sent to the browser |
| Process | systemd sandbox: unprivileged user, read-only system, no new privileges, memory cap |
| System | Automatic security updates; logs capped at 500 MB |
| Data | Daily compressed backups (600 permissions), 14-day retention, pre-deploy backup |

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| **502 Bad Gateway** | The app isn't running: `sudo journalctl -u ig-automation -n 50`. Usually a `.env` problem, named in the log |
| Setup: certbot fails | DNS doesn't point to this server yet, or port 80 is blocked (EC2 security group) |
| `nginx: socket() [::]:80 failed (97…)` | IPv6 is disabled on this server: delete the two `listen [::]…` lines in `/etc/nginx/sites-available/ig-automation.conf` |
| Login works, then immediately logs out | `APP_BASE_URL` / `FRONTEND_URL` must exactly match the address in the browser (https, no trailing slash) |
| Meta webhook verification fails | `curl "https://your-domain/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=123"` should print `123` |
| Deploy says "health check failed" | It already rolled back. Read why: `journalctl -u ig-automation -n 100` |
| Disk filling up | `sudo du -sh /opt/ig-automation/* /var/log/journal`; lower `BACKUP_KEEP_DAYS`, or `sudo journalctl --vacuum-size=200M` |
| Out of memory during deploy (1 GB servers) | The setup adds 2 GB swap; check `free -h` |
