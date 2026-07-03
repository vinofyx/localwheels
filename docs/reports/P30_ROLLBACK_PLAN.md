# Rollback Plan
## LocalWheels Enterprise v1.0 — Hostinger VPS

**Date:** 2026-07-03  
**Platform:** Hostinger VPS + PM2 + Nginx

---

## Rollback Decision Criteria

Initiate rollback if any of the following occur after a deploy:

| Trigger | Action |
|---------|--------|
| `/api/health` returns non-200 for >2 minutes | Immediate rollback |
| PM2 process crashes 3+ times in 5 minutes | Immediate rollback |
| Production validation drops below 25/27 | Investigate, rollback if no fix in 30min |
| P1 incident opened and traced to deploy | Immediate rollback |
| Login failure rate >5% | Immediate rollback |

---

## Rollback Procedure

### Option A — Code Rollback (previous git commit)

**Time to rollback: ~3 minutes**

```bash
ssh user@your-vps-ip

cd /var/www/localwheels

# 1. Identify the last good commit
git log --oneline -10

# 2. Reset to last good commit (e.g. abc1234)
git reset --hard <last-good-commit-hash>

# 3. Rebuild backend deps
cd backend && npm ci --omit=dev && cd ..

# 4. Rebuild frontend
cd frontend && npm ci && npm run build && cd ..

# 5. Reload API (zero downtime)
pm2 reload localwheels-api

# 6. Verify health
sleep 3 && curl http://127.0.0.1:5000/api/health | jq .

# 7. Verify via HTTPS
curl https://api.yourdomain.com/api/health | jq .
```

### Option B — PM2 Restart Only (no code change needed)

Use if the code is fine but the process crashed or hung.

```bash
pm2 restart localwheels-api
sleep 3
pm2 status
curl http://127.0.0.1:5000/api/health
```

### Option C — Full Application Restore from Backup

Use if code and DB are both corrupt (rare).

```bash
# 1. Stop the API
pm2 stop localwheels-api

# 2. Restore app from backup
cd /var/backups/localwheels
ls -lt | head -5   # find latest backup

RESTORE_DIR=/var/backups/localwheels/<timestamp>

# Restore app code
tar -xzf ${RESTORE_DIR}/app.tar.gz -C /

# Restore .env (if encrypted)
openssl enc -d -aes-256-cbc -pbkdf2 \
    -in ${RESTORE_DIR}/env.enc \
    -out /var/www/localwheels/backend/.env \
    -pass env:BACKUP_PASSPHRASE

# 3. Reinstall dependencies
cd /var/www/localwheels
cd backend && npm ci --omit=dev && cd ..
cd frontend && npm ci && npm run build && cd ..

# 4. Restart API
pm2 start deploy/ecosystem.config.js --env production

# 5. Verify
curl http://127.0.0.1:5000/api/health
```

### Option D — MongoDB Atlas Point-in-Time Restore

Use if data corruption is detected.

```
1. Log in to MongoDB Atlas
2. Navigate to: Clusters → <cluster> → Backup → Restore
3. Select "Point in Time" and choose timestamp before incident
4. Restore to new cluster first, verify data, then promote
5. Update MONGODB_URI in .env if cluster name changes
6. pm2 restart localwheels-api
```

---

## Post-Rollback Checklist

After any rollback, complete all items before notifying customer:

| # | Item | ✓ |
|---|------|---|
| 1 | `/api/health` returns 200 | ☐ |
| 2 | `env=production` in health response | ☐ |
| 3 | `db.ready=true` | ☐ |
| 4 | PM2 status shows "online" | ☐ |
| 5 | Smoke test 17/17 | ☐ |
| 6 | Login works | ☐ |
| 7 | Dashboard loads with data | ☐ |
| 8 | Incident logged in P29_INCIDENT_REGISTER.md | ☐ |
| 9 | Root cause identified | ☐ |
| 10 | Customer notified of resolution | ☐ |

---

## Rollback Time Targets

| Option | RTO | RPO |
|--------|-----|-----|
| A — Code rollback | ~3 min | 0 (no data change) |
| B — PM2 restart | ~30 sec | 0 |
| C — Full restore | ~15 min | Last backup (max 24hr) |
| D — Atlas PIT restore | ~30 min | Any point in time (M10+) |

---

## Keep on Hand

These must be accessible without internet (save to phone / USB):

- VPS IP address
- SSH private key path
- VPS root/admin password (emergency only)
- MongoDB Atlas username/password
- Last known good git commit hash

---

**Owner:** vinofyx@gmail.com  
**Update after every deploy:** record last known good commit hash below.

| Date | Commit | Deploy Result | Notes |
|------|--------|--------------|-------|
| | | | |
