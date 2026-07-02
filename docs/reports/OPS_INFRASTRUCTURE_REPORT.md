# Infrastructure Report
**LocalWheels Enterprise v1.0 — Production Operations**
**Date:** 2026-07-02
**Customer:** Rajdhani Cargo Services Pvt Ltd

---

## Architecture Overview

```
Browser / API Client
        │
        ▼
  Express.js API  (Node.js v20, port 5000)
  ┌─────────────────────────────────────────┐
  │  Helmet (Security Headers)              │
  │  CORS (Origin Whitelist)                │
  │  Morgan (HTTP Logging)                  │
  │  Rate Limiter (express-rate-limit)      │
  │  Compression (gzip)                     │
  │  Metrics Middleware (Prometheus-format) │
  │  JWT Authenticate Middleware            │
  │  100+ Route Handlers                    │
  └──────────┬──────────────────────────────┘
             │
    ┌────────┴──────────┐
    ▼                   ▼
MongoDB              Redis (optional)
(Mongoose 8.x)       (cache, not configured)
```

---

## Current Infrastructure Snapshot (2026-07-02 19:02 IST)

### Compute

| Metric | Value | Assessment |
|---|---|---|
| Runtime | Node.js v20 (LTS) | ✅ Current LTS |
| Platform | win32 x64 | ✅ |
| Process PID | Runtime-assigned | ✅ |
| Process Uptime | 3h 26m | ✅ Stable |
| Heap Used | 52 MB | ✅ Normal |
| Heap Total | 55 MB | ✅ Normal |
| RSS Memory | ~90 MB | ✅ Normal |
| System Load 1m | 0.00 | ✅ Idle |

### Database

| Metric | Value | Status |
|---|---|---|
| Engine | MongoDB (Mongoose 8.23.1) | ✅ |
| Connection State | connected | ✅ |
| Ready State | 1 (connected) | ✅ |
| Connection Pool | Mongoose default (5) | ✅ |
| Avg Query Time | ~50–100ms | ✅ Within SLA |
| Indexes | On company_id, branch_id, is_active | ✅ |

### Cache Layer

| Metric | Value | Status |
|---|---|---|
| Redis | Not configured | ⚪ Optional |
| REDIS_URL env var | Not set | ⚪ |
| Cache middleware | Implemented (`middleware/cache.js`) | ✅ Ready |
| Activation cost | Zero code change — set `REDIS_URL` | ✅ |

### Observability

| Component | Status | Endpoint |
|---|---|---|
| Health endpoint | ✅ Active | `GET /api/health` |
| Prometheus metrics | ✅ Active | `GET /api/metrics` |
| HTTP access log | ✅ Active (Morgan dev format) | stdout |
| Daily ops log | ✅ Active | `backend/ops-daily-log.jsonl` |
| Weekly ops log | ✅ Active | `backend/ops-log.jsonl` |

---

## Request Throughput (Cumulative since start)

| Status Code | Count | % |
|---|---|---|
| 2xx (Success) | 213 | 89.9% |
| 4xx (Client Error) | 24 | 10.1% |
| 5xx (Server Error) | 0 | 0.0% |
| **Total** | **237** | |

4xx breakdown: authentication test calls (401), RBAC test calls (403), one stale endpoint call (404). All expected — not user-facing errors.

---

## File System

| Path | Purpose | Status |
|---|---|---|
| `backend/uploads/` | File uploads (POD, documents, CSV) | ✅ Created on start |
| `backend/ops-daily-log.jsonl` | Daily ops log (append-only) | ✅ Active |
| `backend/ops-log.jsonl` | Weekly ops log (append-only) | ✅ Active |
| `backend/phase28-results.json` | Last validation run | ✅ Present |
| `backend/onboard-results.json` | Onboarding audit trail | ✅ Present |

---

## Middleware Stack (in order)

| # | Middleware | Purpose | Config |
|---|---|---|---|
| 1 | `helmet()` | Security headers | CSP, HSTS (prod), nosniff, no-referrer |
| 2 | `cors()` | Origin control | Whitelist in prod, open in dev |
| 3 | `morgan()` | HTTP access log | combined (prod), dev (local) |
| 4 | `rateLimit()` (global) | Abuse prevention | 300 req/15min (prod only) |
| 5 | `rateLimit()` (login) | Brute-force prevention | 10 attempts/15min (prod only) |
| 6 | `compression()` | gzip response | All responses |
| 7 | `metricsMiddleware` | Request timing | Per-route counter + histogram |
| 8 | `express.json()` | Body parsing | 10 MB limit |
| 9 | `express.urlencoded()` | Form parsing | 10 MB limit |
| 10 | Route handlers | Business logic | 100+ routes |
| 11 | Error handler | 500 fallback | Generic message, no stack trace in prod |

---

## Capacity Projections

| Scenario | Heap Est. | Latency Est. | Action Needed |
|---|---|---|---|
| Pilot (9 users, 2 shipments) | 52 MB | < 100ms | None ✅ |
| Month 1 (50 shipments) | ~70 MB | < 150ms | None |
| Month 3 (500 shipments) | ~120 MB | < 200ms | Consider Redis |
| Scale (5,000+ shipments) | ~300 MB | < 400ms | Add Redis + PM2 cluster |
| Enterprise (50,000+ shipments) | ~600 MB+ | Variable | Horizontal scaling |

**Redis activation** (zero code change, just set `REDIS_URL`) handles the Month 3 scenario by caching list endpoint responses.

---

## Infrastructure Improvement Roadmap (Evidence-Gated)

| Action | Trigger Condition | Priority |
|---|---|---|
| Enable Redis cache | Heap > 200 MB or P95 > 300ms | Medium |
| Enable PM2 cluster mode | CPU > 70% sustained | Medium |
| Add HTTPS / TLS | Before cloud deployment | High |
| MongoDB Atlas migration | Before multi-region | Low |
| MongoDB replica set | Before production SLA 99.9% | High |
| Log aggregation (CloudWatch) | When cloud-deployed | Low |
| External health monitor (Uptime Robot) | When publicly accessible | Medium |

None of these are required during the local pilot period.

---

## Infrastructure Status: ✅ HEALTHY — All critical components operational.
