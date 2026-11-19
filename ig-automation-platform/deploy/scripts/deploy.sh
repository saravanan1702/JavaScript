#!/usr/bin/env bash
# Deploys the latest code with zero manual steps, and rolls back automatically if the new
# version doesn't come up healthy.
#
#   sudo bash /opt/ig-automation/repo/ig-automation-platform/deploy/scripts/deploy.sh
#   sudo BRANCH=main bash …/deploy.sh
#
# Steps: pull → build a new release folder → back up the database → run migrations →
#        switch the "current" symlink → restart → health check → (rollback on failure) → clean up.
#
# Note: a rollback restores the previous CODE. Database migrations are additive in this
# project, so older code keeps working with a newer schema; the pre-deploy backup is there
# if you ever need to restore data.
set -euo pipefail

BASE="${BASE:-/opt/ig-automation}"
BRANCH="${BRANCH:-main}"
APP_SUBDIR="${APP_SUBDIR:-ig-automation-platform}"
SERVICE="${SERVICE:-ig-automation}"
APP_USER="${APP_USER:-igauto}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:4000/api/health}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
RESTART_CMD="${RESTART_CMD:-systemctl restart $SERVICE}"
SKIP_BACKUP="${SKIP_BACKUP:-0}"

log() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# Run a command as the app user when we are root, otherwise as ourselves (local testing).
as_app() {
  if [[ $EUID -eq 0 ]] && id "$APP_USER" >/dev/null 2>&1; then
    sudo -u "$APP_USER" -H env "PATH=$PATH" "$@"
  else
    "$@"
  fi
}

REPO="$BASE/repo"
[[ -d "$REPO/.git" ]] || fail "No git repository at $REPO (see setup-server.sh)"
[[ -f "$BASE/shared/.env" ]] || fail "Missing $BASE/shared/.env"

log "Fetching branch '$BRANCH'"
as_app git -C "$REPO" fetch --prune origin "$BRANCH"
as_app git -C "$REPO" checkout -q -B "$BRANCH" "origin/$BRANCH"
COMMIT="$(git -C "$REPO" rev-parse --short HEAD)"
echo "Commit: $COMMIT  $(git -C "$REPO" log -1 --pretty=%s)"

RELEASE="$BASE/releases/$(date +%Y%m%d-%H%M%S)-$COMMIT"
PREVIOUS="$(readlink -f "$BASE/current" 2>/dev/null || true)"

log "Building release $(basename "$RELEASE")"
as_app mkdir -p "$RELEASE"
as_app rsync -a --delete \
  --exclude node_modules --exclude 'frontend/dist' --exclude '.env' --exclude '.env.*' \
  "$REPO/$APP_SUBDIR/" "$RELEASE/"
as_app ln -sfn "$BASE/shared/.env" "$RELEASE/backend/.env"
echo "$COMMIT" | as_app tee "$RELEASE/REVISION" >/dev/null

( cd "$RELEASE/backend" && as_app npm ci --omit=dev --no-audit --no-fund )
( cd "$RELEASE/frontend" && as_app npm ci --no-audit --no-fund && as_app npm run build && as_app rm -rf node_modules )
[[ -f "$RELEASE/frontend/dist/index.html" ]] || fail "Frontend build produced no index.html"

if [[ "$SKIP_BACKUP" != "1" ]]; then
  log "Backing up the database before migrating"
  as_app env BASE="$BASE" bash "$RELEASE/deploy/scripts/backup-db.sh" || fail "Backup failed. Not deploying."
fi

log "Running database migrations"
( cd "$RELEASE/backend" && as_app env NODE_ENV=production npm run --silent migrate )

switch_to() {
  # Atomic symlink swap: Nginx and systemd never see a half-switched state.
  as_app ln -sfn "$1" "$BASE/current.tmp"
  as_app mv -Tf "$BASE/current.tmp" "$BASE/current"
}

health_ok() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT))
  while (( SECONDS < deadline )); do
    if curl -fsS --max-time 3 "$HEALTH_URL" 2>/dev/null | grep -q '"status":"ok"'; then return 0; fi
    sleep 2
  done
  return 1
}

log "Switching to the new release and restarting"
switch_to "$RELEASE"
eval "$RESTART_CMD"

if health_ok; then
  log "Healthy ✓  ($HEALTH_URL)"
else
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    printf '\n\033[1;31m✖ New release failed its health check. Rolling back to %s\033[0m\n' "$(basename "$PREVIOUS")" >&2
    switch_to "$PREVIOUS"
    eval "$RESTART_CMD"
    health_ok && echo "Rollback healthy. Check the logs: journalctl -u $SERVICE -n 100" >&2
  fi
  fail "Deploy of $COMMIT failed."
fi

# Reload Nginx so it serves the new dashboard files (no downtime).
if command -v nginx >/dev/null && [[ $EUID -eq 0 ]]; then nginx -t -q && systemctl reload nginx; fi

log "Removing old releases (keeping $KEEP_RELEASES)"
find "$BASE/releases" -mindepth 1 -maxdepth 1 -type d | sort | head -n -"$KEEP_RELEASES" | while read -r old; do
  [[ "$old" == "$(readlink -f "$BASE/current")" ]] || { echo "  - $(basename "$old")"; rm -rf "$old"; }
done

echo
echo "✅ Deployed $COMMIT"
