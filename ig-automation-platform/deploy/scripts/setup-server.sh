#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 server (VPS or AWS EC2) for Reel Automation.
# Safe to re-run: every step checks before changing anything.
#
#   sudo DOMAIN=automation.yourshop.in EMAIL=you@example.com \
#        REPO_URL=https://github.com/you/your-repo.git BRANCH=main \
#        bash setup-server.sh
#
# What it does:
#   system updates + automatic security updates · Node.js 22 · MySQL 8 · Nginx · Let's Encrypt HTTPS
#   firewall (SSH, HTTP, HTTPS only) · fail2ban · swap on small servers · log size limits
#   app user + folders · database + user with a random password · .env with fresh secrets
#   systemd service (24/7, auto-restart) · daily backup timer
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN, e.g. DOMAIN=automation.yourshop.in}"
EMAIL="${EMAIL:?Set EMAIL (used by Lets Encrypt for expiry notices)}"
REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
APP_SUBDIR="${APP_SUBDIR:-ig-automation-platform}" # folder inside the repo that holds this app
BASE=/opt/ig-automation
APP_USER=igauto
DB_NAME=ig_automation
DB_USER=igauto

log() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
[[ $EUID -eq 0 ]] || { echo "Run as root (sudo)." >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

log "System updates and base packages"
apt-get update -q
apt-get upgrade -yq
apt-get install -yq curl git ca-certificates gnupg nginx mysql-server ufw fail2ban unattended-upgrades certbot rsync openssl

log "Automatic security updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
CONF

log "Node.js 22 (official NodeSource repository)"
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update -q
  apt-get install -yq nodejs
fi
node -v

log "Swap (only on servers with less than 2 GB RAM)"
if [[ $(free -m | awk '/^Mem:/{print $2}') -lt 2000 ]] && ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

log "Firewall: allow only SSH, HTTP and HTTPS"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

log "fail2ban (blocks repeated SSH login attempts)"
systemctl enable --now fail2ban

log "Limit system log size"
install -d /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/ig-automation.conf <<'CONF'
[Journal]
SystemMaxUse=500M
MaxRetentionSec=1month
CONF
systemctl restart systemd-journald

log "App user and folders"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --home-dir "$BASE" --shell /usr/sbin/nologin "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" -m 0750 "$BASE" "$BASE/releases" "$BASE/shared" "$BASE/backups"
# Nginx (www-data) needs to read the built dashboard files, nothing else.
usermod -aG "$APP_USER" www-data

log "MySQL database and user (local connections only)"
systemctl enable --now mysql
if [[ ! -f "$BASE/shared/.env" ]]; then
  DB_PASSWORD="$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-32)"
  mysql --protocol=socket -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

  log "Writing $BASE/shared/.env with fresh secrets"
  umask 077
  cat > "$BASE/shared/.env" <<ENV
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
APP_BASE_URL=https://$DOMAIN
FRONTEND_URL=https://$DOMAIN
TRUST_PROXY=true
APP_TIMEZONE=Asia/Kolkata
DATA_RETENTION_DAYS=90

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_POOL_MAX=10

JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
JWT_EXPIRES_IN=12h
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')

# ── Fill these in (see docs/PHASE-2 and PHASE-5) ──
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=$(openssl rand -hex 24)
META_GRAPH_API_VERSION=v26.0
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-opus-5-5
ENV
  chown "$APP_USER:$APP_USER" "$BASE/shared/.env"
  chmod 600 "$BASE/shared/.env"
else
  echo "$BASE/shared/.env already exists, leaving it untouched."
fi

log "Get the code"
if [[ -n "$REPO_URL" && ! -d "$BASE/repo/.git" ]]; then
  sudo -u "$APP_USER" git clone --branch "$BRANCH" "$REPO_URL" "$BASE/repo"
elif [[ ! -d "$BASE/repo/.git" ]]; then
  echo "No REPO_URL given. Clone your repository into $BASE/repo (as user $APP_USER) before deploying."
fi

log "systemd service + daily backup timer"
SRC="$BASE/repo/$APP_SUBDIR/deploy"
[[ -d "$SRC" ]] || SRC="$(cd "$(dirname "$0")/.." && pwd)"
install -m 0644 "$SRC/systemd/ig-automation.service" /etc/systemd/system/
install -m 0644 "$SRC/systemd/ig-automation-backup.service" /etc/systemd/system/
install -m 0644 "$SRC/systemd/ig-automation-backup.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable ig-automation.service ig-automation-backup.timer
systemctl start ig-automation-backup.timer

log "HTTPS certificate from Let's Encrypt"
install -d /var/www/certbot
install -d /etc/nginx/snippets
install -m 0644 "$SRC/nginx/security-headers.conf" /etc/nginx/snippets/ig-automation-security.conf
rm -f /etc/nginx/sites-enabled/default
if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  # Temporary HTTP-only site so Let's Encrypt can verify the domain.
  cat > /etc/nginx/sites-available/ig-automation-acme.conf <<CONF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 404; }
}
CONF
  ln -sf /etc/nginx/sites-available/ig-automation-acme.conf /etc/nginx/sites-enabled/ig-automation-acme.conf
  nginx -t && systemctl reload nginx
  certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
  rm -f /etc/nginx/sites-enabled/ig-automation-acme.conf
fi
install -d /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'HOOK'
#!/bin/sh
systemctl reload nginx
HOOK
chmod 755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

log "Nginx site"
sed "s/__DOMAIN__/$DOMAIN/g" "$SRC/nginx/ig-automation.conf" > /etc/nginx/sites-available/ig-automation.conf
ln -sf /etc/nginx/sites-available/ig-automation.conf /etc/nginx/sites-enabled/ig-automation.conf
nginx -t
systemctl enable nginx
systemctl reload nginx

cat <<DONE

✅ Server ready.

Next steps:
  1. Add your keys:   sudo -u $APP_USER nano $BASE/shared/.env
     (INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, ANTHROPIC_API_KEY …)
  2. Deploy:          sudo BRANCH=$BRANCH bash $BASE/repo/$APP_SUBDIR/deploy/scripts/deploy.sh
  3. Create login:    cd $BASE/current/backend && sudo -u $APP_USER NODE_ENV=production npm run create-admin
  4. Open https://$DOMAIN

⚠️  Copy ENCRYPTION_KEY from $BASE/shared/.env into your password manager now.
    Without it, a database restore on a new server cannot decrypt the Instagram token
    (you would simply reconnect Instagram).
DONE
