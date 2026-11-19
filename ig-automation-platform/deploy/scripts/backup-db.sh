#!/usr/bin/env bash
# Compressed, consistent MySQL backup. Runs daily via ig-automation-backup.timer and before
# every deploy.
#
#   sudo -u igauto bash backup-db.sh          # manual backup
#   BACKUP_KEEP_DAYS=30 … backup-db.sh        # keep longer
#   RCLONE_REMOTE=gdrive:igauto-backups …     # also copy off the server (needs rclone configured)
set -euo pipefail

BASE="${BASE:-/opt/ig-automation}"
ENV_FILE="${ENV_FILE:-$BASE/shared/.env}"
BACKUP_DIR="${BACKUP_DIR:-$BASE/backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"

# Read DB settings from .env without executing it (values may contain shell characters).
env_get() { grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2-; }
DB_HOST="$(env_get DB_HOST)"; DB_PORT="$(env_get DB_PORT)"
DB_USER="$(env_get DB_USER)"; DB_PASSWORD="$(env_get DB_PASSWORD)"; DB_NAME="$(env_get DB_NAME)"
: "${DB_USER:?DB_USER missing in $ENV_FILE}" "${DB_NAME:?DB_NAME missing in $ENV_FILE}"

umask 077
mkdir -p "$BACKUP_DIR"

# Password goes in a private temp file, never on the command line (visible in `ps`).
CNF="$(mktemp)"
trap 'rm -f "$CNF"' EXIT
printf '[client]\nuser=%s\npassword="%s"\nhost=%s\nport=%s\n' "$DB_USER" "$DB_PASSWORD" "${DB_HOST:-127.0.0.1}" "${DB_PORT:-3306}" > "$CNF"

DUMP="$(command -v mysqldump || command -v mariadb-dump)"
FILE="$BACKUP_DIR/${DB_NAME}-$(date +%Y%m%d-%H%M%S).sql.gz"
# --single-transaction: consistent snapshot without locking the live app.
"$DUMP" --defaults-extra-file="$CNF" --single-transaction --quick --routines --triggers \
  --default-character-set=utf8mb4 --no-tablespaces "$DB_NAME" | gzip -9 > "$FILE.partial"
mv "$FILE.partial" "$FILE"
gzip -t "$FILE"
echo "Backup written: $FILE ($(du -h "$FILE" | cut -f1))"

find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -type f -mtime +"$BACKUP_KEEP_DAYS" -print -delete | sed 's/^/Removed old backup: /'

if [[ -n "$RCLONE_REMOTE" ]] && command -v rclone >/dev/null; then
  rclone copy "$FILE" "$RCLONE_REMOTE" && echo "Copied off-server to $RCLONE_REMOTE"
fi
