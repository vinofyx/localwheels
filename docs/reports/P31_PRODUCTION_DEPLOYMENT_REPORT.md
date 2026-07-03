# Production Deployment Report
## LocalWheels Enterprise v1.0 — Phase 31

**Date:** 2026-07-03  
**Platform:** Hostinger VPS (Ubuntu 22.04 LTS)  
**Version:** v1.0.0  
**Status:** ✅ Deployment artifacts complete | ⏳ Live deployment pending

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Hostinger VPS                        │
│  OS: Ubuntu 22.04 LTS                                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Nginx (port 80/443)                             │   │
│  │  ├── api.yourdomain.com → :5000 (reverse proxy)  │   │
│  │  └── app.yourdomain.com → /var/www/.../dist (SPA) │  │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │  PM2 → Node.js API (port 5000, internal only)   │   │
│  │  App: /var/www/localwheels/backend/src/index.js  │   │
│  └──────────────────────────────────────────────────┘   │
│                     │            │                      │
│  ┌──────────────────▼──┐  ┌──────▼──────────────────┐   │
│  │  Redis :6379         │  │  MongoDB Atlas (cloud)  │   │
│  │  (local, auth)       │  │  M10+, same region      │   │
│  └──────────────────────┘  └─────────────────────────┘   │
│                                                         │
│  Security: UFW + Fail2Ban + Certbot SSL + SSH keys only  │
└─────────────────────────────────────────────────────────┘
```

---

## Pre-Deployment Artifacts Status

| Artifact | File | Status |
|----------|------|--------|
| VPS setup script | `deploy/setup-vps.sh` | ✅ Syntax verified |
| Deploy script | `deploy/deploy.sh` | ✅ Syntax verified |
| Backup script | `deploy/backup.sh` | ✅ Syntax verified |
| PM2 config | `deploy/ecosystem.config.js` | ✅ Node.js validated |
| Nginx config | `deploy/nginx.conf` | ✅ Config structure verified |
| Env template | `deploy/env.example` | ✅ All vars documented |
| Prometheus config | `monitoring/prometheus.yml` | ✅ VPS targets configured |
| Seed script | `backend/src/db/seed-production.js` | ✅ Idempotent, validated |
| Production validator | `backend/production-validate.js` | ✅ 27/27 verified |
| Smoke test | `backend/smoke-test.js` | ✅ 17/17 verified |

---

## Validation Results (Pre-Deployment)

| Suite | Result | Date | Evidence |
|-------|--------|------|---------|
| Auth certification | 74/74 ✅ | 2026-07-03 | `docs/auth-production-readiness-certificate.md` |
| Workflow validation | 16/16 ✅ | 2026-07-03 | `backend/uat-workflow-results.json` |
| Production validation | 27/27 ✅ | 2026-07-03 | `backend/production-validation-results.json` |
| Smoke test | 17/17 ✅ | 2026-07-03 | Terminal output |
| Frontend security | 0 vulns ✅ | 2026-07-03 | `npm audit` output |

---

## Deployment Steps (Operator Execution Required)

### Step 1 — Provision VPS

```bash
# Hostinger control panel:
# 1. Select VPS plan (KVM2 minimum: 2vCPU, 8GB RAM)
# 2. Choose Ubuntu 22.04 LTS
# 3. Set hostname: localwheels-prod
# 4. Add SSH public key during provisioning
# 5. Note the VPS IP address
```

### Step 2 — DNS Configuration

```
# In your domain registrar (before SSL setup):
Type  Name   Value       TTL
A     api    <VPS IP>    300
A     app    <VPS IP>    300

# Wait for propagation (5–60 minutes):
dig api.yourdomain.com +short  # should return VPS IP
dig app.yourdomain.com +short  # should return VPS IP
```

### Step 3 — Initial Setup

```bash
ssh root@<VPS-IP>

git clone https://github.com/vinofyx/localwheels /var/www/localwheels
chmod +x /var/www/localwheels/deploy/setup-vps.sh
bash /var/www/localwheels/deploy/setup-vps.sh

# ⚠️  SAVE the Redis password printed at the end
```

### Step 4 — Configure Environment

```bash
cp /var/www/localwheels/deploy/env.example /var/www/localwheels/backend/.env
nano /var/www/localwheels/backend/.env

# Required values:
# MONGODB_URI       → Atlas connection string
# JWT_SECRET        → 64-char random hex (generate command in env.example)
# REDIS_URL         → redis://:<password from step 3>@127.0.0.1:6379
# ALLOWED_ORIGINS   → https://app.yourdomain.com
# METRICS_TOKEN     → 32-char random hex
# CLERK_SECRET_KEY  → from Clerk dashboard (if using Clerk)
```

### Step 5 — Atlas IP Whitelist

```bash
# Get VPS IP
curl -s https://api.ipify.org

# MongoDB Atlas → Security → Network Access → Add IP Address
# Paste VPS IP, comment: "Hostinger VPS production 2026-07-03"
```

### Step 6 — SSL Certificates

```bash
# Install Nginx config (update domain name first)
cp /var/www/localwheels/deploy/nginx.conf /etc/nginx/sites-available/localwheels
sed -i 's/yourdomain.com/ACTUAL_DOMAIN.com/g' /etc/nginx/sites-available/localwheels

ln -sf /etc/nginx/sites-available/localwheels /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Issue certificates (DNS must be resolving first)
certbot --nginx -d api.ACTUAL_DOMAIN.com -d app.ACTUAL_DOMAIN.com \
  --non-interactive --agree-tos --email vinofyx@gmail.com
```

### Step 7 — Build Frontend

```bash
cat > /var/www/localwheels/frontend/.env.production << 'EOF'
VITE_API_URL=https://api.ACTUAL_DOMAIN.com/api
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxx
EOF

cd /var/www/localwheels/frontend
npm ci
npm run build
ls -lh /var/www/localwheels/dist/
```

### Step 8 — Start API

```bash
cd /var/www/localwheels
cd backend && npm ci --omit=dev && cd ..

pm2 start deploy/ecosystem.config.js --env production
pm2 save
pm2 startup  # run the output command

pm2 status   # should show: localwheels-api | online
pm2 logs localwheels-api --lines 20  # check for startup errors
```

### Step 9 — Reload Nginx

```bash
nginx -t && systemctl reload nginx
```

### Step 10 — Seed + Validate

```bash
# Seed first customer
node /var/www/localwheels/backend/src/db/seed-production.js

# Smoke test
node /var/www/localwheels/backend/smoke-test.js https://api.ACTUAL_DOMAIN.com rajdhani_admin "<password>"

# Full production validation (no --dev)
node /var/www/localwheels/backend/production-validate.js https://api.ACTUAL_DOMAIN.com rajdhani_admin "<password>"
# Target: 27/27 ALL CLEAR
```

### Step 11 — Activate Backups

```bash
# Add cron
crontab -e
# Add: 0 2 * * * BACKUP_PASSPHRASE="your-phrase" /var/www/localwheels/deploy/backup.sh >> /var/log/localwheels/backup.log 2>&1

# Test first backup
bash /var/www/localwheels/deploy/backup.sh
ls -lh /var/backups/localwheels/
```

---

## Post-Deployment Verification Matrix

| Verification | Command | Expected |
|-------------|---------|---------|
| HTTPS health | `curl https://api.domain.com/api/health \| jq .` | `env=production, db.ready=true, redis.connected=true` |
| Frontend loads | Browser → `https://app.domain.com` | Login page renders |
| SPA routing | Browser → `https://app.domain.com/login` | Login page (not 404) |
| PM2 online | `pm2 status` | `online` |
| Redis connected | Health response | `redis.connected=true` |
| Metrics gated | `curl https://api.domain.com/api/metrics` | `401` |
| CORS active | Smoke test (no --dev) | `17/17` |
| Full validation | production-validate.js (no --dev) | `27/27` |

---

## Deployment Log

| Date | Action | Result | Operator |
|------|--------|--------|---------|
| 2026-07-03 | All deployment artifacts prepared | ✅ | Engineering |
| _(go-live date)_ | VPS provisioned | ⏳ | |
| _(go-live date)_ | setup-vps.sh executed | ⏳ | |
| _(go-live date)_ | SSL issued | ⏳ | |
| _(go-live date)_ | API started via PM2 | ⏳ | |
| _(go-live date)_ | Production validation 27/27 | ⏳ | |
| _(go-live date)_ | Customer seeded | ⏳ | |
| _(go-live date)_ | Go-live signed off | ⏳ | |

---

**Prepared by:** LocalWheels Engineering  
**Go-live operator:** vinofyx@gmail.com
