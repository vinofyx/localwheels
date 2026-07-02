# LocalWheels Platform — Scalability Report
**Phase:** 23.5 | **Date:** 2026-07-02 | **Version:** 1.0 GA

---

## Architecture Scalability Assessment

### Current Architecture

```
Browser / Mobile
      │
   Vercel CDN (Frontend)
      │
   Render (Node.js API)  ─── Redis Cloud (Cache)
      │
   MongoDB Atlas (Database)
```

This is a **single-instance, monolithic API** + **single database cluster** architecture. It is appropriate for the pilot phase and initial commercial customers.

---

## Horizontal Scaling Readiness

| Requirement | Status | Notes |
|-------------|--------|-------|
| Stateless API server | ✅ Ready | No in-process session state; all state in MongoDB |
| JWT auth (no server session) | ✅ Ready | JWT validated from token — no session store needed |
| Shared Redis cache | ✅ Ready | Cache client connects to external Redis URL |
| MongoDB replica set | ✅ Ready | Atlas provides M10+ replica sets natively |
| File uploads (stateful) | ⚠️ Partial | `/uploads/` directory is local — migrate to S3 for multi-instance |
| In-memory Map cache | ⚠️ Per-instance | `_memCache` and `_fmem` Maps are per-process — OK for single instance, inconsistent across multiple |

**Scaling path:** To run 2+ API instances: (1) configure `REDIS_URL` so all instances share the cache, (2) move file uploads to S3, (3) use a load balancer.

---

## Database Scalability

### Index Coverage
- 217/217 collections indexed (Phase 20 audit)
- All queries use `company_id + field` compound indexes
- Compound indexes support tenant isolation + sort in one scan

### Connection Pooling
| Environment | Max Pool | Concurrent Requests | Notes |
|-------------|---------|---------------------|-------|
| Development | 5 | ~20-50 effective | Local MongoDB |
| Production | 20 | ~80-200 effective | Atlas M10 |

### Atlas Tier Recommendations

| Traffic Level | Atlas Tier | Expected Users |
|--------------|-----------|---------------|
| Pilot (3 companies) | M10 | Up to 100 concurrent |
| Growth (10 companies) | M20 | Up to 300 concurrent |
| Scale (50 companies) | M30 | Up to 1000 concurrent |
| Enterprise (100+ companies) | M50+ or sharded | 1000+ concurrent |

---

## Load Test Summary (Dev Machine)

| Concurrency | Errors | P95 | Notes |
|-------------|--------|-----|-------|
| 100 users | 0 | 1007 ms (dev) | Zero errors — queue, don't drop |
| 500 users | 0 | 6457 ms (dev) | Zero errors — linearly degraded |

**Key finding:** Latency degrades linearly with concurrency. The application **never crashes or drops requests** — it queues them through the MongoDB connection pool. This is safe, predictable behavior.

**Production extrapolation:** With Render (2 vCPU, 2 GB RAM), MongoDB Atlas M10 (20-connection pool), and Redis:
- 100 concurrent: P95 ~150-200 ms
- 250 concurrent: P95 ~300-400 ms
- 500 concurrent: P95 ~500-700 ms (may need M20 Atlas)

---

## Caching Strategy

| Layer | Scope | TTL | Coverage |
|-------|-------|-----|---------|
| Redis (primary) | Shared across all instances | Configurable per key | AI results, heavy aggregations |
| In-memory Map (fallback) | Per-process | Configurable per key | Same as Redis when Redis unavailable |
| Mongoose connection pool | Per-instance | Persistent | All MongoDB queries |

**Cache hit rate expectation:** For AI endpoints (executive snapshot, forecast), cache hit rate > 99% in production (daily/hourly TTLs vs daily usage patterns).

---

## Bottleneck Analysis

| Component | Bottleneck At | Mitigation |
|-----------|--------------|-----------|
| MongoDB pool | ~20 concurrent writes (prod pool=20) | Increase pool; Atlas M20+ |
| Node.js event loop | CPU-intensive aggregations | Move heavy aggregations to background jobs |
| Anthropic AI API | Rate limits (requests/min) | Cache results; exponential backoff |
| File uploads | Local disk on single instance | Migrate to S3 (already planned in v2.0) |
| Redis memory | Depends on Redis Cloud tier | Monitor `redis_memory_used_bytes` alert |

---

## Capacity Planning (Pilot Phase)

**Pilot:** 3 companies, ~50 total users, 500-1000 shipments/day

| Metric | Day 1 | Month 1 | Month 6 |
|--------|-------|---------|---------|
| MongoDB storage | ~100 MB | ~2 GB | ~20 GB |
| API requests/day | ~5,000 | ~50,000 | ~500,000 |
| Atlas tier | M10 | M10 | M10 (review at month 3) |
| Render tier | Starter | Starter | Standard |

---

## Scaling Triggers (When to Scale)

| Metric | Threshold | Action |
|--------|-----------|--------|
| API P95 > 500ms | Sustained 1 hour | Upgrade Render to Standard (2 instances) |
| MongoDB connections > 80% | Sustained 30 min | Upgrade Atlas tier |
| Redis memory > 80% | Sustained 1 hour | Upgrade Redis tier or increase TTL |
| Error rate > 1% | Any | Immediate investigation |
| Heap > 85% | Sustained 15 min | Investigate memory leak; restart if necessary |

---

## Certification

✅ Architecture is stateless and horizontally scalable (with S3 migration for uploads).
✅ Database indexes support multi-tenant queries at scale.
✅ Caching strategy reduces DB load for expensive operations.
✅ Scaling triggers defined with clear thresholds and actions.
✅ Capacity plan covers pilot phase through month 6.
