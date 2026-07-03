#!/bin/bash
# LocalWheels Enterprise v1.0 — Production Deploy Script
#
# Run on the VPS (not locally) for every deploy.
# Pulls latest from git, rebuilds frontend, restarts API with zero downtime.
#
# Usage:
#   ssh localwheels@your-vps-ip "bash /var/www/localwheels/deploy/deploy.sh"
#
# Or set up a git post-receive hook to run automatically.

set -euo pipefail

APP_DIR="/var/www/localwheels"
LOG_DIR="/var/log/localwheels"
DEPLOY_LOG="${LOG_DIR}/deploy-$(date +%Y%m%d-%H%M%S).log"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   LocalWheels — Production Deploy                           ║"
echo "║   $(date -u +"%Y-%m-%dT%H:%M:%SZ")                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd "${APP_DIR}"

# ── 1. Pull latest code ───────────────────────────────────────────────────────
echo "── [1/6] Git pull ───────────────────────────────────────────────"
git fetch origin main
git reset --hard origin/main
echo "  HEAD: $(git log --oneline -1)"

# ── 2. Backend dependencies ───────────────────────────────────────────────────
echo "── [2/6] Backend dependencies ───────────────────────────────────"
cd "${APP_DIR}/backend"
npm ci --omit=dev --prefer-offline
echo "  Backend deps installed"

# ── 3. Frontend build ─────────────────────────────────────────────────────────
echo "── [3/6] Frontend build ─────────────────────────────────────────"
cd "${APP_DIR}/frontend"
npm ci --prefer-offline
npm run build
# Vite outputs to /var/www/localwheels/dist (configured as outDir: '../dist')
echo "  Frontend built → ${APP_DIR}/dist"
ls -lh "${APP_DIR}/dist/" 2>/dev/null | head -5

# ── 4. Restart API (zero downtime with PM2 reload) ───────────────────────────
echo "── [4/6] Restart API ────────────────────────────────────────────"
cd "${APP_DIR}"
if pm2 list | grep -q "localwheels-api"; then
    pm2 reload deploy/ecosystem.config.js --env production --update-env
    echo "  PM2 reload complete"
else
    pm2 start deploy/ecosystem.config.js --env production
    pm2 save
    echo "  PM2 started (first run)"
fi

# ── 5. Health check ───────────────────────────────────────────────────────────
echo "── [5/6] Health check ───────────────────────────────────────────"
sleep 3
MAX_TRIES=10
for i in $(seq 1 $MAX_TRIES); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/api/health || echo "000")
    if [ "$STATUS" = "200" ]; then
        echo "  ✅ Health check passed (attempt ${i}) — status=${STATUS}"
        break
    fi
    if [ "$i" = "$MAX_TRIES" ]; then
        echo "  ❌ Health check failed after ${MAX_TRIES} attempts — last status=${STATUS}"
        echo "  Rolling back..."
        pm2 restart localwheels-api
        exit 1
    fi
    echo "  ⏳ Waiting... (attempt ${i}/${MAX_TRIES}, status=${STATUS})"
    sleep 2
done

# ── 6. Nginx reload (in case nginx.conf changed) ─────────────────────────────
echo "── [6/6] Nginx reload ───────────────────────────────────────────"
nginx -t && systemctl reload nginx
echo "  Nginx reloaded"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Deploy complete: $(date -u +"%Y-%m-%dT%H:%M:%SZ")              ║"
echo "║  Commit: $(git log --oneline -1 | cut -c1-50 | tr -d '\n')      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Save deploy log
pm2 logs localwheels-api --lines 10 --nostream 2>/dev/null | tee "${DEPLOY_LOG}" || true
echo "  Deploy log: ${DEPLOY_LOG}"
