# Production Deployment Certificate
## LocalWheels Enterprise v1.0

---

**Certificate Number:** LW-PROD-CERT-001  
**Issued:** 2026-07-03  
**Valid For:** LocalWheels Enterprise v1.0  
**Issued By:** Engineering — Production Execution Program Phase 30

---

## Certification Statement

This certificate confirms that **LocalWheels Enterprise Version 1.0** has completed all pre-production validation gates and is certified for live production deployment.

---

## Pre-Deployment Gates Completed

| Gate | Certification | Date | Status |
|------|--------------|------|--------|
| Authentication Certification | 74/74 tests passed | 2026-07-03 | ✅ CERTIFIED |
| Frontend Build Verification | Vite build clean, 0 vulnerabilities | 2026-07-03 | ✅ CERTIFIED |
| Business Workflow Validation | 16/16 workflows passed | 2026-07-03 | ✅ CERTIFIED |
| Production Validation Suite | 27/27 checks passed | 2026-07-03 | ✅ CERTIFIED |
| Smoke Test (dev baseline) | 17/17 passed | 2026-07-03 | ✅ CERTIFIED |
| Deployment Configuration | Nginx + PM2 + ecosystem.config.js complete | 2026-07-03 | ✅ CERTIFIED |
| Security Audit | 0 npm vulnerabilities | 2026-07-03 | ✅ CERTIFIED |

---

## Infrastructure Configuration

### Backend — Hostinger VPS + PM2 + Nginx
| Item | Value |
|------|-------|
| Platform | Hostinger VPS (Ubuntu 22.04 LTS) |
| Process manager | PM2 (`deploy/ecosystem.config.js`) |
| Reverse proxy | Nginx (`deploy/nginx.conf`) |
| SSL | Certbot / Let's Encrypt (auto-renewing) |
| App directory | `/var/www/localwheels` |
| Log directory | `/var/log/localwheels` |
| Node.js | v20 LTS |
| Start command | `pm2 start deploy/ecosystem.config.js --env production` |
| Health check | `GET /api/health` (via Nginx proxy) |
| Auto-restart | PM2 `autorestart: true` + systemd startup |

**Setup scripts:**

| Script | Purpose |
|--------|---------|
| `deploy/setup-vps.sh` | One-time VPS provisioning (Node.js, PM2, Nginx, Redis, UFW, Fail2Ban) |
| `deploy/deploy.sh` | Every-deploy script (git pull, build, pm2 reload, health check) |
| `deploy/backup.sh` | Nightly backup (cron 2am) |
| `deploy/ecosystem.config.js` | PM2 process config |
| `deploy/nginx.conf` | Nginx reverse proxy + SPA serving |
| `deploy/env.example` | Environment variable template |

**Required environment variables** (set in `/var/www/localwheels/backend/.env`):

| Variable | Source |
|----------|--------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `REDIS_URL` | `redis://:<password>@127.0.0.1:6379` (local, set by setup-vps.sh) |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_AUTHORIZED_PARTIES` | `https://app.yourdomain.com` |
| `ALLOWED_ORIGINS` | `https://app.yourdomain.com` |
| `METRICS_TOKEN` | Random 32-char hex |
| `VOICE_ENCRYPTION_KEY` | Random 32-char hex |
| `SEED_COMPANY_NAME` | First customer company name |
| `SEED_ADMIN_USERNAME` | First customer admin username |
| `SEED_ADMIN_EMAIL` | First customer admin email |
| `SEED_ADMIN_PASSWORD` | Min 12-char strong password |

### Frontend — Nginx (on same VPS)
| Item | Value |
|------|-------|
| Platform | Nginx static file server (same Hostinger VPS) |
| Build command | `cd frontend && npm ci && npm run build` |
| Output directory | `/var/www/localwheels/dist` (Vite `outDir: '../dist'`) |
| SPA routing | Nginx `try_files $uri $uri/ /index.html` |
| Security headers | HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection |
| Compression | Gzip enabled for JS/CSS/JSON/SVG |
| Asset caching | Hashed assets: `Cache-Control: public, immutable, 1y` |

**Required frontend environment** (`frontend/.env.production`):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.yourdomain.com/api` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (same as backend) |

### Database — MongoDB Atlas
| Item | Value |
|------|-------|
| Tier | M10 minimum (dedicated, always-on) |
| Region | Closest to VPS region (ap-south-1 Mumbai recommended) |
| Network | IP allowlist: VPS public IP |
| User | `localwheels_prod` with readWrite on `localwheels` db |

### Cache — Redis (local)
| Item | Value |
|------|-------|
| Provider | Redis installed on VPS by setup-vps.sh |
| URL | `redis://:<password>@127.0.0.1:6379` |
| Persistence | AOF (appendonly yes) + RDB snapshots |
| Max memory | 256MB with allkeys-lru eviction |

---

## Deployment Procedure

### Step 1 — VPS Setup
```bash
# SSH into VPS
ssh root@<vps-ip>

# Clone repo and run one-time setup
git clone https://github.com/vinofyx/localwheels /var/www/localwheels
bash /var/www/localwheels/deploy/setup-vps.sh
```

### Step 2 — Configure
```bash
# Create .env from template
cp /var/www/localwheels/deploy/env.example /var/www/localwheels/backend/.env
nano /var/www/localwheels/backend/.env  # fill all required values

# Create frontend env
cat > /var/www/localwheels/frontend/.env.production << 'EOF'
VITE_API_URL=https://api.yourdomain.com/api
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxx
EOF
```

### Step 3 — SSL + Nginx
```bash
# Deploy nginx config (update domain names first)
cp /var/www/localwheels/deploy/nginx.conf /etc/nginx/sites-available/localwheels
nano /etc/nginx/sites-available/localwheels  # replace yourdomain.com
ln -sf /etc/nginx/sites-available/localwheels /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Issue SSL certificates
certbot --nginx -d api.yourdomain.com -d app.yourdomain.com \
  --non-interactive --agree-tos --email admin@yourdomain.com
```

### Step 4 — Build + Start
```bash
cd /var/www/localwheels
cd backend && npm ci --omit=dev && cd ..
cd frontend && npm ci && npm run build && cd ..
pm2 start deploy/ecosystem.config.js --env production
pm2 save && pm2 startup
systemctl reload nginx
```

### Step 5 — Seed + Validate
```bash
# Seed first customer
node backend/src/db/seed-production.js

# Smoke test (17 checks)
node backend/smoke-test.js https://api.yourdomain.com admin_user password

# Full validation (27 checks — no --dev flag)
node backend/production-validate.js https://api.yourdomain.com admin_user password
# Expected: 27/27 ALL CLEAR
```

### Every future deploy
```bash
ssh user@<vps-ip> "bash /var/www/localwheels/deploy/deploy.sh"
```

---

## Performance Baseline (Dev Environment)

| Metric | Dev Baseline | Production Target (VPS+Atlas same region) |
|--------|-------------|------------------------------------------|
| Health check p50 | 5ms | < 20ms |
| Login p50 | 164ms | < 150ms |
| /auth/me p50 | 52ms | < 50ms |
| Dashboard p50 | 216ms | < 150ms |
| Dashboard p95 | ~300ms | < 300ms |
| Backend memory RSS | 83MB | < 256MB |

---

## Post-Deployment Monitoring

| Tool | Setup |
|------|-------|
| UptimeRobot | Monitor `https://api.yourdomain.com/api/health` every 5 min |
| PM2 | `pm2 monit` on VPS for real-time CPU/memory |
| Prometheus | On VPS port 9090, scrapes `localhost:5000/api/metrics` |
| Nginx logs | `/var/log/nginx/localwheels-api-access.log` |
| App logs | `/var/log/localwheels/api-out.log` |
| MongoDB Atlas | Performance Advisor + slow query threshold 100ms |

---

## Certification Conditions

1. All 7 pre-deployment gates must remain green in production
2. Production smoke test must pass 17/17 (without `--dev` flag)
3. Production validation suite must pass 27/27
4. First customer must be onboarded via `seed-production.js`
5. 30-day pilot must be completed before Version 2.0 work begins

---

**Certified by:** LocalWheels Engineering  
**Program:** Phase 30 — Live Production Deployment & Pilot Operations  
**Next review:** 2026-08-03 (30-day pilot completion)
