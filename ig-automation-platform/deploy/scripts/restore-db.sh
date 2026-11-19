#!/usr/bin/env bash
# Restores a backup made by backup-db.sh. REPLACES the current database contents.
#
#   sudo bash restore-db.sh /opt/ig-automation/backups/ig_automation-20261120-023012.sql.gz
set -euo pipefail

FILE="${1:?Usage: restore-db.sh <backup.sql.gz>}"
BASE="${BASE:-/opt/ig-automation}"
ENV_FILE="${ENV_FILE:-$BASE/shared/.env}"
SERVICE="${SERVICE:-ig-automation}"
STOP_CMD="${STOP_CMD:-systemctl stop $SERVICE}"
START_CMD="${START_CMD:-systemctl start $SERVICE}"

[[ -f "$FILE" ]] || { echo "No such file: $FILE" >&2; exit 1; }
gzip -t "$FILE"

env_get() { grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2-; }
DB_NAME="$(env_get DB_NAME)"
CNF="$(mktemp)"
trap 'rm -f "$CNF"' EXIT
chmod 600 "$CNF"
printf '[client]\nuser=%s\npassword="%s"\nhost=%s\nport=%s\n' \
  "$(env_get DB_USER)" "$(env_get DB_PASSWORD)" "$(env_get DB_HOST)" "$(env_get DB_PORT)" > "$CNF"

if [[ "${FORCE:-0}" != "1" ]]; then
  read -r -p "This replaces ALL data in database '$DB_NAME' with $(basename "$FILE"). Type the database name to continue: " answer
  [[ "$answer" == "$DB_NAME" ]] || { echo "Cancelled."; exit 1; }
fi

echo "Stopping the app…"
eval "$STOP_CMD" || true
CLIENT="$(command -v mysql || command -v mariadb)"
gunzip -c "$FILE" | "$CLIENT" --defaults-extra-file="$CNF" "$DB_NAME"
echo "Restored. Starting the app…"
eval "$START_CMD"
echo "✅ Done."
