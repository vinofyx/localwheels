#!/bin/bash
# LocalWheels Enterprise v1.0 — Nightly Backup Script
#
# Backs up: MongoDB Atlas (via mongodump), application code, .env file
# Schedule with cron:
#   crontab -e
#   0 2 * * * /var/www/localwheels/deploy/backup.sh >> /var/log/localwheels/backup.log 2>&1
#
# Backups are kept for 7 days then deleted.

set -euo pipefail

APP_DIR="/var/www/localwheels"
BACKUP_DIR="/var/backups/localwheels"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
RETAIN_DAYS=7

echo ""
echo "── LocalWheels Backup — ${TIMESTAMP} ─────────────────────────────"

# Load env to get MONGODB_URI
if [ -f "${APP_DIR}/backend/.env" ]; then
    export $(grep -E '^(MONGODB_URI|MONGO_URI)=' "${APP_DIR}/backend/.env" | xargs)
fi
MONGO_URI="${MONGODB_URI:-${MONGO_URI:-}}"

mkdir -p "${BACKUP_PATH}"

# ── 1. MongoDB backup ─────────────────────────────────────────────────────────
echo "[1/3] MongoDB backup"
if [ -n "${MONGO_URI}" ]; then
    if command -v mongodump &>/dev/null; then
        mongodump --uri="${MONGO_URI}" --out="${BACKUP_PATH}/mongodb" --quiet
        MONGO_SIZE=$(du -sh "${BACKUP_PATH}/mongodb" 2>/dev/null | cut -f1)
        echo "  MongoDB dump: ${MONGO_SIZE}"
    else
        echo "  ⚠️  mongodump not installed — skipping (Atlas continuous backup is primary)"
        echo "  Install: https://www.mongodb.com/try/download/database-tools"
    fi
else
    echo "  ⚠️  MONGODB_URI not found in .env — skipping local dump"
    echo "  MongoDB Atlas provides continuous backup on M10+ clusters"
fi

# ── 2. Environment backup (encrypted) ────────────────────────────────────────
echo "[2/3] Environment backup"
if [ -f "${APP_DIR}/backend/.env" ]; then
    # Store .env encrypted with openssl
    # Decrypt: openssl enc -d -aes-256-cbc -in env.enc -out .env
    openssl enc -aes-256-cbc -salt -pbkdf2 \
        -in "${APP_DIR}/backend/.env" \
        -out "${BACKUP_PATH}/env.enc" \
        -pass env:BACKUP_PASSPHRASE 2>/dev/null || \
        cp "${APP_DIR}/backend/.env" "${BACKUP_PATH}/env.bak"
    echo "  .env backed up"
fi

# ── 3. Application snapshot ───────────────────────────────────────────────────
echo "[3/3] Application snapshot"
tar -czf "${BACKUP_PATH}/app.tar.gz" \
    --exclude="${APP_DIR}/node_modules" \
    --exclude="${APP_DIR}/backend/node_modules" \
    --exclude="${APP_DIR}/frontend/node_modules" \
    --exclude="${APP_DIR}/.git" \
    --exclude="${APP_DIR}/dist" \
    "${APP_DIR}" 2>/dev/null
APP_SIZE=$(du -sh "${BACKUP_PATH}/app.tar.gz" | cut -f1)
echo "  App snapshot: ${APP_SIZE}"

# ── 4. Cleanup old backups ────────────────────────────────────────────────────
find "${BACKUP_DIR}" -maxdepth 1 -type d -mtime +${RETAIN_DAYS} -exec rm -rf {} +
KEPT=$(ls -1 "${BACKUP_DIR}" | wc -l)
echo "  Cleanup: keeping ${KEPT} backup(s)"

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)
echo ""
echo "  ✅ Backup complete: ${BACKUP_PATH} (${TOTAL_SIZE})"
echo "  Retention: last ${RETAIN_DAYS} days"
echo ""
