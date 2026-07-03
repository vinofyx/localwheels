# Operations Handover Report
## LocalWheels Enterprise v1.0 — Phase 31

**Date:** 2026-07-03  
**Handover From:** Engineering (build & deployment)  
**Handover To:** Operations (monitoring & support)  
**Status:** Ready for handover upon go-live

---

## System Overview

| Component | Technology | Location |
|-----------|-----------|---------|
| Backend API | Node.js 20 / Express | Hostinger VPS → PM2 → port 5000 |
| Frontend SPA | React / Vite | Hostinger VPS → Nginx → `/var/www/localwheels/dist` |
| Database | MongoDB Atlas M10+ | Cloud (Atlas), same region as VPS |
| Cache | Redis 7 | VPS local, port 6379 |
| Reverse proxy | Nginx | VPS, ports 80/443 |
| Process manager | PM2 | VPS |
| SSL | Let's Encrypt (Certbot) | VPS, auto-renewing |
| Monitoring | PM2 + Nginx logs + Prometheus | VPS |

---

## Daily Operations

### Morning Health Check (5 minutes)

Run every morning before business hours:

```bash
# 1. Check API health
curl https://api.yourdomain.com/api/health | jq '{env,db,redis,memory}'

# 2. Check PM2 status
ssh user@vps-ip "pm2 status"

# 3. Check for errors in last 24hr
ssh user@vps-ip "grep -c ERROR /var/log/localwheels/api-err.log || echo 0"

# 4. Check disk usage
ssh user@vps-ip "df -h / | awk 'NR==2 {print \$5}'"  # should be <70%

# 5. Check last backup
ssh user@vps-ip "ls -lt /var/backups/localwheels/ | head -3"
```

**Alert criteria:**
- Health check fails → P1 incident
- PM2 shows any status other than `online` → investigate immediately
- ERROR count >10 in 24hr → P2 investigation
- Disk >80% → P2 disk cleanup
- No backup in 48hr → P3 backup check

---

## Weekly Operations

### Monday Weekly Check (15 minutes)

```bash
# 1. Run smoke test
node /var/www/localwheels/backend/smoke-test.js https://api.yourdomain.com admin pass
# Expected: 17/17

# 2. Check SSL expiry
ssh user@vps-ip "certbot certificates | grep Expiry"
# Alert if <30 days remaining

# 3. Review weekly error summary
ssh user@vps-ip "tail -200 /var/log/localwheels/api-err.log | grep -c '\"level\":\"error\"'"

# 4. Review Nginx access log for anomalies
ssh user@vps-ip "tail -1000 /var/log/nginx/localwheels-api-access.log | awk '{print \$9}' | sort | uniq -c | sort -rn"
# Check for unusual 4xx/5xx patterns

# 5. Check MongoDB Atlas metrics
# Atlas → Monitoring → check operations, connections, slow queries

# 6. Update pilot tracker
# Fill in P30_PILOT_WEEK_TRACKER.md for the week
```

---

## Deployment Process

### Standard Deploy (code update)

```bash
# Run deploy script from VPS (or via SSH)
ssh user@vps-ip "bash /var/www/localwheels/deploy/deploy.sh"

# Script does automatically:
# git pull → npm ci → frontend build → pm2 reload → health check
# If health check fails: auto-rollback
```

### Hotfix Process

1. Reproduce issue locally with evidence (error log + repro steps)
2. Fix and test: `node backend/workflow-test.js` (confirm 16/16)
3. Commit with clear message referencing incident ID
4. Deploy: `ssh user@vps "bash /var/www/localwheels/deploy/deploy.sh"`
5. Validate: `node backend/production-validate.js https://api.domain.com admin pass`
6. Log in incident register (`P29_INCIDENT_REGISTER.md`)

---

## Incident Response

### P1 — System Down

```bash
# Immediate: check PM2
ssh user@vps "pm2 status && pm2 logs localwheels-api --lines 30"

# If crashed: restart
ssh user@vps "pm2 restart localwheels-api"

# If Nginx issue:
ssh user@vps "systemctl status nginx && systemctl restart nginx"

# If VPS unreachable: Hostinger panel → Reboot VPS
# If still down after reboot: see P30_DISASTER_RECOVERY_GUIDE.md

# Notify customer within 30 minutes if impact >5 users
```

### P2 — Feature Unavailable

```bash
# Identify affected route from Nginx error log
ssh user@vps "tail -100 /var/log/nginx/localwheels-api-error.log"

# Check application error log
ssh user@vps "tail -100 /var/log/localwheels/api-err.log | jq ."

# Workaround: if route-specific, document and provide manual workaround
# Fix within 8 hours, deploy, re-validate
```

### Rollback

See `P30_ROLLBACK_PLAN.md` for full rollback procedures:
- **Option A** (code rollback): ~3 min
- **Option B** (PM2 restart): ~30 sec
- **Option C** (full restore): ~15 min
- **Option D** (Atlas PIT): ~30 min

---

## Monitoring Reference

### PM2 Commands

```bash
pm2 status                      # Process list
pm2 logs localwheels-api        # Live log stream
pm2 logs localwheels-api --lines 100  # Last 100 lines
pm2 monit                       # Real-time CPU/memory dashboard
pm2 reload localwheels-api      # Zero-downtime restart
pm2 restart localwheels-api     # Hard restart
pm2 flush                       # Clear all logs
pm2 info localwheels-api        # Full process details
```

### Log Files

| Log | Path | Purpose |
|-----|------|---------|
| API stdout | `/var/log/localwheels/api-out.log` | Normal operation output |
| API stderr | `/var/log/localwheels/api-err.log` | Errors and warnings |
| Nginx access | `/var/log/nginx/localwheels-api-access.log` | HTTP request log |
| Nginx error | `/var/log/nginx/localwheels-api-error.log` | Nginx errors |
| Backup | `/var/log/localwheels/backup.log` | Nightly backup results |

### Prometheus Metrics

```bash
# Metrics (requires METRICS_TOKEN)
curl -H "X-Metrics-Token: $METRICS_TOKEN" https://api.yourdomain.com/api/metrics
```

Key metrics to watch:
- `process_uptime_seconds` — time since last restart
- `http_request_duration_seconds` — API latency histogram
- `nodejs_heap_used_bytes` — memory usage

---

## Support Runbooks

### User Cannot Log In

1. Check `/api/health` — is DB connected?
2. Test login directly: `curl -X POST https://api.domain.com/api/auth/login -H "Content-Type: application/json" -d '{"username":"...","password":"..."}'`
3. If 401: wrong credentials (reset via database if needed)
4. If 500: check API error log
5. If timeout: check PM2 status

### Dashboard Shows No Data

1. Confirm user has correct branch selected
2. Check: `GET /api/dashboard?branch_id=<branch_id>` returns data
3. Check MongoDB Atlas — is cluster running?
4. Check API logs for aggregation errors

### Invoice Generation Fails

1. Check: invoice requires `branch_id` in body and at least 1 `line_items` entry
2. Check API error log for validation errors
3. Test directly with `production-validate.js`

### Backup Not Running

```bash
# Check cron
crontab -l | grep backup

# Run manually
bash /var/www/localwheels/deploy/backup.sh

# Check backup log
tail -50 /var/log/localwheels/backup.log
```

---

## Monthly Operations Tasks

| Task | When | Command / Action |
|------|------|-----------------|
| Full production validation | 1st of month | `node backend/production-validate.js ...` |
| SSL expiry check | 1st of month | `certbot certificates` |
| Disk cleanup | 1st of month | `df -h; find /var/log -mtime +30 -delete` |
| Security patch check | 1st of month | `apt list --upgradable` |
| Backup restore test | 1st of month | Restore to staging, verify data |
| MongoDB index review | 1st of month | Atlas → Performance Advisor |
| PM2 log rotation | Automatic | logrotate configured |
| Pilot tracker update | Weekly | `P30_PILOT_WEEK_TRACKER.md` |

---

## Key Contacts

| Role | Contact | Scope |
|------|---------|-------|
| Engineering | vinofyx@gmail.com | Bug fixes, deployments, infrastructure |
| Hostinger Support | https://hostinger.com/support | VPS hardware/network |
| MongoDB Atlas | https://support.mongodb.com | Database issues |
| Clerk | https://clerk.com/support | SSO authentication |
| Let's Encrypt | https://community.letsencrypt.org | SSL issues |

---

## Handover Checklist

| # | Item | Status |
|---|------|--------|
| 1 | All deployment scripts verified | ✅ |
| 2 | All documentation complete | ✅ |
| 3 | Production validation 27/27 | ✅ |
| 4 | Smoke test 17/17 | ✅ |
| 5 | Go-live checklist prepared | ✅ |
| 6 | Rollback plan documented | ✅ |
| 7 | Disaster recovery documented | ✅ |
| 8 | Backup scripts ready | ✅ |
| 9 | Monitoring commands documented | ✅ |
| 10 | Support runbooks documented | ✅ |
| 11 | 30-day pilot tracker ready | ✅ |
| 12 | V2 gate defined | ✅ |

**Handover complete.** Engineering hands over to operations. No new features until V2 gate is satisfied.

---

**Handover authorized by:** vinofyx@gmail.com  
**Date:** 2026-07-03
