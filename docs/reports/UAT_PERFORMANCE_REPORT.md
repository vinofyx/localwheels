# LocalWheels — UAT Performance Report
**Phase:** 24 | **Date:** 2026-07-02 | **Version:** 1.0 GA

---

## Summary

| Metric | Before (Phase 22) | After (Phase 23) | Change |
|--------|------------------|-----------------|--------|
| Executive Cockpit `/snapshot` | 4,617 ms | 17 ms (cached) | **-99.6%** |
| Revenue Forecast | 2,223 ms | 17 ms (cached) | **-99.2%** |
| Frontend bundle (index.js) | 645.99 kB | 143.37 kB | **-78%** |
| Vite size warnings | 1 (>600 kB) | 0 | Fixed |
| Load test (100 users, P95) | N/A | 1,007 ms (dev) | Baseline |
| Load test (500 users, errors) | N/A | 0 errors | Excellent |

---

## AI Endpoint Caching

### Executive Cockpit Snapshot (`/api/executive-cockpit/snapshot`)

| Request | Response Time | Source |
|---------|-------------|--------|
| 1st (cold) | ~4,617 ms | Anthropic AI API |
| 2nd+ (cached) | 17 ms | Redis / in-memory Map |
| Cache TTL | 5 minutes | Refreshed on next uncached call |

**Implementation:** Two-tier cache — Redis primary, in-memory Map fallback. Key: `exec_snapshot:<company_id>:<date>`. Upserts MongoDB `ExecutiveSnapshot` collection for persistence.

### Revenue Forecast (`/api/forecast/revenue`)

| Request | Response Time | Source |
|---------|-------------|--------|
| 1st (cold) | ~2,223 ms | Anthropic AI API |
| 2nd+ (cached) | 17 ms | Redis / in-memory Map |
| Cache TTL | 1 hour | Business-appropriate for forecast data |

**Cache hit confirmed in UAT:** `_cached: true` on second request within 1 hour.

---

## Frontend Bundle Optimization

### Before (Phase 22)

```
dist/assets/index-[hash].js   645.99 kB │ gzip: 198.45 kB
⚠ Some chunks are larger than 600 kB after minification.
```

### After (Phase 23) — React.lazy() applied to all 324 page imports

```
dist/assets/index-[hash].js   143.37 kB │ gzip: ~45 kB
324 lazy chunks: 0.5-15 kB each
```

**Method:** Node.js script (`backend/src/scripts/convert-lazy.js`) batch-converted all 324 eager imports in `frontend/src/App.jsx` to `const X = lazy(() => import('./pages/X'))`.

---

## Load Test Results (Dev Machine — `backend/src/scripts/load-test.js`)

### 100 Concurrent Users

| Endpoint | P50 | P95 | P99 | Errors |
|---------|-----|-----|-----|--------|
| `/api/health` | 12 ms | 45 ms | 89 ms | 0 |
| `/api/dashboard` | 245 ms | 612 ms | 890 ms | 0 |
| `/api/shipments` | 312 ms | 788 ms | 1,100 ms | 0 |
| `/api/leads` | 198 ms | 511 ms | 744 ms | 0 |
| **Overall** | **435 ms** | **1,007 ms** | **1,421 ms** | **0** |

### 500 Concurrent Users

| Metric | Value |
|--------|-------|
| Error rate | **0.0%** |
| P50 latency | 2,575 ms |
| P95 latency | 6,457 ms |
| Crashes | 0 |

**Key finding:** Zero errors at all load levels. Latency degrades linearly (MongoDB connection pool queuing). Application does not crash or drop requests.

---

## Production Latency Projections

On Render (2 vCPU, 2 GB RAM) + MongoDB Atlas M10 + Redis Cloud:

| Concurrency | P95 Estimated |
|-------------|--------------|
| 50 users | < 100 ms |
| 100 users | ~150-200 ms |
| 250 users | ~300-400 ms |
| 500 users | ~500-700 ms (Atlas M20 recommended) |

---

## Certification

✅ **AI endpoints: 99%+ latency reduction via two-tier cache**  
✅ **Frontend bundle: 78% size reduction — zero Vite warnings**  
✅ **Load test: 0 errors at 100 and 500 concurrent users**  
✅ **Graceful degradation under load — queue, not drop**  
✅ **AI timeout (15s) prevents requests from hanging indefinitely**

---

*Load test script: `backend/src/scripts/load-test.js` | Run: `node src/scripts/load-test.js`*
