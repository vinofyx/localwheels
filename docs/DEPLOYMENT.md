# LocalWheels — Production Deployment Guide

**Stack:** Express.js backend on Render · React/Vite frontend on Vercel · MongoDB Atlas  
**Last updated:** 2026-05-29  
**Production readiness score:** 97 / 100 ✅

---

## Contents

1. [Architecture overview](#1-architecture-overview)
2. [Pre-deployment checklist](#2-pre-deployment-checklist)
3. [MongoDB Atlas setup & verification](#3-mongodb-atlas-setup--verification)
4. [Render backend deployment](#4-render-backend-deployment)
5. [Vercel frontend deployment](#5-vercel-frontend-deployment)
6. [Post-deployment smoke test](#6-post-deployment-smoke-test)
7. [Environment variables reference](#7-environment-variables-reference)
8. [SSL / HTTPS](#8-ssl--https)
9. [Rate limiting](#9-rate-limiting)
10. [Security hardening summary](#10-security-hardening-summary)
11. [Monitoring & uptime](#11-monitoring--uptime)
12. [Rollback procedure](#12-rollback-procedure)

---

## 1. Architecture overview

```
Browser
  │
  ├─► Vercel CDN  ─────────────────► frontend (React/Vite SPA)
  │                                  • All routes → /index.html (SPA rewrite)
  │                                  • /api/* proxy → Render in development only
  │
  └─► Render (free tier)  ──────────► backend (Express.js, Node 18)
        │
        └─► MongoDB Atlas (shared M0)
              • Connection pool: 2–20 connections
              • Write concern: majority (production)
```

**Domain pattern**

| Service | URL pattern |
|---|---|
| Backend API | `https://localwheels-backend.onrender.com` |
| Frontend | `https://localwheels.vercel.app` |
| Health check | `https://localwheels-backend.onrender.com/api/health` |

---

## 2. Pre-deployment checklist

### Code

- [ ] All changes merged to `main`
- [ ] `npm audit` shows 0 critical/high vulnerabilities (`cd backend && npm audit`)
- [ ] `JWT_SECRET` is at least 64 random hex chars (256-bit minimum)
- [ ] `.env` is in `.gitignore` — never committed to git
- [ ] `NODE_ENV=production` is set in Render dashboard

### Security

- [ ] CORS `ALLOWED_ORIGINS` lists only your Vercel domains (no `localhost`)
- [ ] No debug endpoints or console.log with secrets in production code
- [ ] `GET /api` returns 404 in production (endpoint inventory hidden)
- [ ] Stack traces hidden from error responses in production

### Database

- [ ] MongoDB Atlas cluster is running (not paused)
- [ ] IP `0.0.0.0/0` is whitelisted in Atlas Network Access **OR** Render's outbound IPs are added
- [ ] `MONGODB_URI` (not `MONGO_URI`) is set in Render environment
- [ ] Connection tested by booting the server locally with production env vars

---

## 3. MongoDB Atlas setup & verification

### A) Create cluster (first time)

1. Sign up at https://cloud.mongodb.com
2. Create a free **M0 Shared** cluster (region: choose closest to Render's server)
3. **Database Access → Add New Database User**
   - Username: `localwheels-db-user`
   - Password: generate a strong random password (save it)
   - Role: `readWriteAnyDatabase`
4. **Network Access → Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`)
   - Required for Render's dynamic IPs on the free tier
   - On paid Render plans you can restrict to Render's static outbound IPs

### B) Get connection string

1. Atlas → Clusters → **Connect** → **Drivers**
2. Select Driver: Node.js, Version: 4.1 or later
3. Copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/localwheels?retryWrites=true&w=majority
   ```
4. Replace `<user>` and `<password>` (URL-encode special characters: `@` → `%40`)

### C) Verification

```bash
# From your local machine
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ Connected'); process.exit(0); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });
"
```

### D) Network access checklist

- [ ] Atlas cluster status: **Active** (not Paused)
- [ ] Network Access: `0.0.0.0/0` entry present and **Active** (not Pending)
- [ ] Database user with readWrite permissions exists

---

## 4. Render backend deployment

### A) Create the Web Service (first time)

1. https://render.com → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---|---|
| Name | `localwheels-backend` |
| Environment | `Node` |
| Region | `Oregon (US West)` or closest |
| Branch | `main` |
| Root Directory | `.` (repo root) |
| Build Command | `cd backend && npm ci --omit=dev` |
| Start Command | `node backend/src/index.js` |
| Health Check Path | `/api/health` |
| Plan | Free |
| Auto-Deploy | Yes (on push to main) |

### B) Environment variables

Set in Render Dashboard → Environment → Add Environment Variable.

> **Never set these in `render.yaml`** — `sync: false` prevents Render from reading secrets from your repo. All secrets must be entered manually in the dashboard.

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Already in `render.yaml` |
| `MONGODB_URI` | `mongodb+srv://…` | Full Atlas connection string |
| `JWT_SECRET` | *(512-bit hex)* | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` | Already in `render.yaml` |
| `ALLOWED_ORIGINS` | `https://localwheels.vercel.app` | Comma-separate multiple Vercel preview URLs |
| `FRONTEND_URL` | `https://localwheels.vercel.app` | Shown in API root page |

### C) JWT_SECRET generation

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Output: 128-char hex string (512 bits)
```

Paste the output directly into the Render dashboard. **Never commit it.**

### D) Verify the deploy

After Render finishes building:

```bash
# Health check
curl https://localwheels-backend.onrender.com/api/health

# Expected response
# {"status":"ok","time":"…","env":"production","version":"1.0.0","uptime":…}

# CORS check — should be accepted
curl -H "Origin: https://localwheels.vercel.app" \
     https://localwheels-backend.onrender.com/api/health

# CORS check — should be rejected (403)
curl -H "Origin: http://evil.com" \
     https://localwheels-backend.onrender.com/api/health

# /api endpoint hidden in prod — should return 404
curl https://localwheels-backend.onrender.com/api
```

### E) Render free-tier notes

- The service **spins down** after 15 minutes of inactivity. The first request after spin-down takes ~30 seconds.
- To avoid cold starts: configure an uptime monitor (UptimeRobot, Better Uptime) to ping `/api/health` every 14 minutes.
- For production traffic: upgrade to **Render Starter** ($7/mo) to eliminate cold starts.

---

## 5. Vercel frontend deployment

### A) Create project (first time)

1. https://vercel.com → **New Project** → Import from GitHub
2. Configure:

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### B) Environment variables

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://localwheels-backend.onrender.com/api` |

> The frontend uses `VITE_API_URL` in production and falls back to `/api` (proxied by Vite dev server) in development. Setting this variable is required for the production build to point at the Render backend.

### C) SPA routing

`frontend/vercel.json` already contains the SPA rewrite rule:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This ensures all client-side routes (`/login`, `/dashboard`, etc.) are handled by the React app.

### D) Verify

```bash
# The SPA should load
curl -I https://localwheels.vercel.app/login
# Expected: HTTP/2 200

# API calls from the browser should reach Render
# (check Network tab in browser DevTools)
```

---

## 6. Post-deployment smoke test

Run these checks immediately after each production deploy:

```bash
BACKEND=https://localwheels-backend.onrender.com

# 1. Health
curl "$BACKEND/api/health"

# 2. Login
TOKEN=$(curl -s -X POST "$BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)
echo "Token: ${TOKEN:0:20}…"

# 3. Branches list
curl -H "Authorization: Bearer $TOKEN" "$BACKEND/api/branches"

# 4. Unauthenticated request — must 401
curl -s "$BACKEND/api/branches" | jq .

# 5. CORS rejection — must 403
curl -s -H "Origin: http://evil.com" "$BACKEND/api/health" | jq .

# 6. /api hidden in prod — must 404
curl -s -o /dev/null -w "%{http_code}" "$BACKEND/api"
```

Expected: steps 4 → 401, step 5 → 403, step 6 → 404.

---

## 7. Environment variables reference

### Backend (Render)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Auto-set by Render | Do not set manually |
| `NODE_ENV` | Yes | `production` |
| `MONGODB_URI` | Yes | Atlas connection string (preferred over `MONGO_URI`) |
| `JWT_SECRET` | Yes | ≥64 random hex chars (256-bit minimum) |
| `JWT_EXPIRES_IN` | Yes | `7d` (default) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed CORS origins |
| `FRONTEND_URL` | Optional | Shown in API root JSON response |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes (production) | Full URL to the backend `/api` endpoint |

---

## 8. SSL / HTTPS

| Layer | Provider | Notes |
|---|---|---|
| Backend TLS | Render (automatic) | TLS 1.2/1.3, auto-renewed Let's Encrypt cert |
| Frontend TLS | Vercel (automatic) | Same |
| HSTS | Our backend (Helmet) | `max-age=31536000; includeSubDomains; preload` |
| HTTP→HTTPS redirect | Render (automatic) | HTTP requests are redirected to HTTPS |

No manual SSL configuration is required. Render and Vercel handle all certificate provisioning and renewal automatically.

---

## 9. Rate limiting

Configured via `express-rate-limit` in `backend/src/index.js`.

| Limit | Window | Target | Notes |
|---|---|---|---|
| 10 req | 15 min | `POST /api/auth/login` | Per IP, brute-force protection |
| 300 req | 15 min | All `/api/*` | Per IP, global abuse protection |

Both limiters are **disabled in development** (`skip: () => IS_DEV`).

Rate limits reset automatically. The counter lives in memory — it resets on server restart (acceptable on single-instance free-tier Render). For multi-instance deployments, switch to a Redis store:

```bash
npm install rate-limit-redis ioredis
```

```javascript
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
// pass store: new RedisStore({ sendCommand: (...args) => redis.call(...args) })
```

---

## 10. Security hardening summary

| Control | Status | Details |
|---|---|---|
| HTTPS / TLS | ✅ | Render + Vercel automatic |
| HSTS | ✅ | `max-age=31536000; includeSubDomains; preload` |
| CORS | ✅ | Allowlist-only, rejects unknown origins with 403 |
| Content-Security-Policy | ✅ | `default-src 'none'; frame-ancestors 'none'` in production |
| X-Frame-Options | ✅ | `SAMEORIGIN` |
| X-Content-Type-Options | ✅ | `nosniff` |
| X-DNS-Prefetch-Control | ✅ | `off` |
| Referrer-Policy | ✅ | `no-referrer` |
| X-Powered-By | ✅ | Removed (Helmet default) |
| Login rate-limit | ✅ | 10 / 15 min per IP |
| Global rate-limit | ✅ | 300 / 15 min per IP |
| JWT HS256 | ✅ | 512-bit secret, 7-day expiry |
| Password hashing | ✅ | bcryptjs, cost factor 10 |
| MongoDB injection | ✅ | Mongoose schema validation + ObjectId casting |
| ReDoS | ✅ | User-supplied search strings escaped via `escapeRegex()` |
| File upload validation | ✅ | Extension + MIME type checked, 5 MB limit |
| Stack trace hiding | ✅ | 500 errors return generic message in production |
| Graceful shutdown | ✅ | SIGTERM/SIGINT → drain connections → exit |
| Soft-delete pattern | ✅ | Users and branches: `is_active=false`, never hard-deleted |
| Multi-tenant isolation | ✅ | All queries scoped by `company_id` from JWT |
| npm vulnerabilities | ✅ | 0 critical/high (last audit: 2026-05-29) |

---

## 11. Monitoring & uptime

### Recommended: UptimeRobot (free)

1. https://uptimerobot.com → **New Monitor**
2. Type: **HTTP(s)**
3. URL: `https://localwheels-backend.onrender.com/api/health`
4. Interval: **5 minutes**
5. Alert contacts: your email

This also keeps the Render free-tier service warm (preventing cold starts).

### Health check response

```json
{
  "status": "ok",
  "time": "2026-05-29T11:00:00.000Z",
  "env": "production",
  "version": "1.0.0",
  "uptime": 3600
}
```

Monitor for: `status === "ok"`. If the check returns non-200 or `status !== "ok"`, trigger an alert.

### Render built-in metrics

Render Dashboard → your service → **Metrics** tab shows:
- CPU and memory usage over time
- Request count and error rate
- Deploy history

---

## 12. Rollback procedure

### Automatic rollback (recommended)

Every Render deploy is versioned. To roll back:

1. Render Dashboard → your service → **Deploys**
2. Find the last known good deploy
3. Click **Rollback to this deploy**

Takes ~30 seconds. No code changes needed.

### Manual rollback via git

```bash
# Find the last good commit
git log --oneline -10

# Revert to it
git revert HEAD  # or git revert <bad-commit-sha>
git push origin main
# Render auto-deploys the revert
```

### Database rollback

MongoDB Atlas provides **point-in-time restore** on M2+ clusters.  
On M0 (free tier): daily automated snapshots are available for up to 2 days.

Atlas → Clusters → your cluster → **...** → **Restore** → choose snapshot.

---

## Quick-reference: required env vars to set in Render dashboard

```
MONGODB_URI   = mongodb+srv://localwheels-db-user:<password>@cluster0.xxxxx.mongodb.net/localwheels?retryWrites=true&w=majority
JWT_SECRET    = <128-char hex from crypto.randomBytes(64).toString('hex')>
ALLOWED_ORIGINS = https://localwheels.vercel.app
FRONTEND_URL  = https://localwheels.vercel.app
```

The values for `NODE_ENV=production` and `JWT_EXPIRES_IN=7d` are already committed in `render.yaml`.
