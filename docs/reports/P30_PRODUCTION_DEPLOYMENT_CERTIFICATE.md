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
| Deployment Configuration | render.yaml + vercel.json complete | 2026-07-03 | ✅ CERTIFIED |
| Security Audit | 0 npm vulnerabilities | 2026-07-03 | ✅ CERTIFIED |

---

## Infrastructure Configuration

### Backend — Render (Starter Plan)
| Item | Value |
|------|-------|
| Platform | Render Web Service |
| Plan | Starter ($7/mo — always-on) |
| Runtime | Node.js ≥ 18 |
| Build command | `cd backend && npm ci --omit=dev` |
| Start command | `node backend/src/index.js` |
| Health check | `/api/health` |
| Auto-deploy | Enabled (main branch) |

**Required environment variables (set in Render dashboard):**

| Variable | Source |
|----------|--------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_AUTHORIZED_PARTIES` | Comma-separated: `https://your-app.vercel.app` |
| `METRICS_TOKEN` | Random 32-char string |
| `REDIS_URL` | Redis Cloud free tier URL |
| `VOICE_ENCRYPTION_KEY` | 32-char random hex |
| `SEED_COMPANY_NAME` | First customer company name |
| `SEED_ADMIN_USERNAME` | First customer admin username |
| `SEED_ADMIN_EMAIL` | First customer admin email |
| `SEED_ADMIN_PASSWORD` | Min 12-char strong password |

### Frontend — Vercel
| Item | Value |
|------|-------|
| Platform | Vercel |
| Framework | Vite (framework: null in vercel.json) |
| Build command | `cd frontend && npm ci && npm run build` |
| Output directory | `dist` (repo root) |
| SPA routing | Rewrites `/*` → `/index.html` |
| Security headers | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection |

**Required environment variables (set in Vercel dashboard):**

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (same as backend) |

### Database — MongoDB Atlas
| Item | Value |
|------|-------|
| Tier | M10 minimum (dedicated, always-on) |
| Region | Same as Render instance (e.g. ap-south-1 Mumbai) |
| Network | IP allow: Render static IPs |
| User | `localwheels_prod` with readWrite on `localwheels` db |

### Cache — Redis
| Item | Value |
|------|-------|
| Provider | Redis Cloud (free tier: 30MB) |
| TLS | Required in production |

---

## Deployment Procedure

### Step 1 — Backend (Render)
```bash
# 1. Create Render account → New Web Service → Connect GitHub repo
# 2. Set Root Directory: . (repo root)
# 3. Set all env vars from table above in Render Dashboard → Environment
# 4. Deploy — watch logs for "LocalWheels API running on port 5000"

# 5. Verify health
curl https://your-backend.onrender.com/api/health

# 6. Seed first customer
SEED_COMPANY_NAME="..." SEED_ADMIN_USERNAME="..." SEED_ADMIN_PASSWORD="..." \
  node backend/src/db/seed-production.js

# 7. Run smoke test
node backend/smoke-test.js https://your-backend.onrender.com admin_user password
```

### Step 2 — Frontend (Vercel)
```bash
# 1. Create Vercel account → New Project → Import GitHub repo
# 2. Set env vars: VITE_API_URL, VITE_CLERK_PUBLISHABLE_KEY
# 3. Deploy — build should complete in ~30s

# 4. Verify SPA routing
curl https://your-app.vercel.app/login  # should return 200 (index.html)
```

### Step 3 — Production Validation
```bash
# Run full production validation suite (without --dev flag)
node backend/production-validate.js \
  https://your-backend.onrender.com \
  admin_username \
  admin_password
# Expected: 27/27 ALL CLEAR
```

---

## Performance Baseline (Dev Environment)

| Metric | Dev Baseline | Production Target |
|--------|-------------|-------------------|
| Health check p50 | 5ms | < 50ms |
| Login p50 | 164ms | < 200ms |
| /auth/me p50 | 52ms | < 100ms |
| Dashboard p50 | 216ms | < 200ms |
| Dashboard p95 | ~300ms (excl. Atlas cold) | < 500ms |
| Backend memory RSS | 83MB | < 300MB |

---

## Post-Deployment Monitoring

| Tool | Setup |
|------|-------|
| UptimeRobot | Monitor `/api/health` every 5 min, alert on 2 consecutive failures |
| Prometheus | Scrape `GET /api/metrics` with `X-Metrics-Token` header |
| MongoDB Atlas | Enable Performance Advisor, slow query threshold 100ms |
| Render | Enable email alerts for deploys and health check failures |

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
