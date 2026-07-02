# LocalWheels Platform — Capacity Planning Report
**Phase:** 23.5 | **Date:** 2026-07-02 | **Version:** 1.0 GA

---

## Planning Horizon: 12 Months from Go-Live

This report projects resource requirements across growth scenarios for the first 12 months of production operations.

---

## Growth Scenarios

### Scenario A: Conservative (Pilot + 2 Paid Customers)
- 5 companies, ~100 active users
- ~2,000 shipments/day

### Scenario B: Target (10 Paid Customers)
- 10 companies, ~300 active users
- ~10,000 shipments/day

### Scenario C: Accelerated (25 Paid Customers)
- 25 companies, ~800 active users
- ~30,000 shipments/day

---

## Infrastructure Capacity by Scenario

### API Server (Render)

| Scenario | Tier | vCPU | RAM | Instances | Est. Cost/mo |
|----------|------|------|-----|-----------|-------------|
| A — Conservative | Starter | 0.5 | 512 MB | 1 | ~$7 |
| B — Target | Standard | 1 | 2 GB | 1 | ~$25 |
| C — Accelerated | Standard | 1 | 2 GB | 2 | ~$50 |

**Scaling signal:** When CPU sustained > 70% or P95 > 500ms for 1 hour.

### Database (MongoDB Atlas)

| Scenario | Tier | RAM | Storage | Max Connections | Est. Cost/mo |
|----------|------|-----|---------|----------------|-------------|
| A — Conservative | M10 | 2 GB | 10 GB | 500 | ~$57 |
| B — Target | M10 | 2 GB | 20 GB | 500 | ~$57 |
| C — Accelerated | M20 | 4 GB | 40 GB | 1500 | ~$189 |

**Scaling signal:** When `mongodb_connections_current / mongodb_connections_available > 0.8` or query latency > 100ms.

### Cache (Redis Cloud)

| Scenario | Tier | Memory | Est. Cost/mo |
|----------|------|--------|-------------|
| A — Conservative | Free / Essentials 30 MB | 30 MB | $0–$10 |
| B — Target | Essentials 100 MB | 100 MB | ~$15 |
| C — Accelerated | Pro 1 GB | 1 GB | ~$50 |

**Scaling signal:** When `redis_memory_used_bytes > 80%` of plan limit.

---

## Storage Growth Projections

### MongoDB Collection Growth (per shipment)

| Collection | Est. Doc Size | Docs/Shipment | Growth/1000 Shipments |
|------------|--------------|--------------|----------------------|
| Shipments | 5 KB | 1 | 5 MB |
| PODs | 2 KB | 1 | 2 MB |
| AuditLogs | 1 KB | 5–10 | 5–10 MB |
| Payments | 1 KB | 1 | 1 MB |
| Invoices | 3 KB | 1 | 3 MB |
| **Total (estimated)** | | | **~20 MB/1000 shipments** |

| Scenario | Shipments/Month | Storage/Month | 12-Month Total |
|----------|----------------|--------------|----------------|
| A | 60,000 | 1.2 GB | ~14 GB |
| B | 300,000 | 6 GB | ~72 GB |
| C | 900,000 | 18 GB | ~216 GB |

### File Uploads (POD, Documents)

| Scenario | Files/Month | Avg Size | Storage/Month | Recommendation |
|----------|-------------|---------|--------------|----------------|
| A | 5,000 | 500 KB | 2.5 GB | Local disk (Render) |
| B | 25,000 | 500 KB | 12.5 GB | Migrate to S3 |
| C | 75,000 | 500 KB | 37.5 GB | S3 required |

**Action:** Migrate `/uploads/` to S3 before Scenario B. S3 Standard storage at Scenario C: ~$1/month.

---

## API Call Volume Projections

### Anthropic AI API

| Endpoint | Calls/Day | Tokens/Call | Cost Estimate |
|----------|-----------|------------|--------------|
| executive-cockpit/snapshot | 1/company/day (cached) | 600 | ~$0.001/company |
| forecast/revenue | 24/company/day (1hr cache) | 250 | ~$0.01/company |
| finance-copilot | User-driven | 400 | Variable |

At Scenario B (10 companies): ~$0.11/day Anthropic costs. Negligible.

---

## Monthly Cost Summary

| Component | Scenario A | Scenario B | Scenario C |
|-----------|-----------|-----------|-----------|
| Render API | $7 | $25 | $50 |
| MongoDB Atlas | $57 | $57 | $189 |
| Redis Cloud | $0 | $15 | $50 |
| S3 Storage | $0 | $5 | $15 |
| Anthropic AI | $2 | $10 | $35 |
| Vercel Frontend | $0 | $0–20 | $20 |
| **Total Infra** | **~$66/mo** | **~$112/mo** | **~$359/mo** |

---

## Scaling Decision Timeline

| Milestone | Trigger | Action | Lead Time |
|-----------|---------|--------|-----------|
| Month 1 | Pilot live | Monitor baselines | — |
| Month 2 | P95 > 400ms | Plan Atlas upgrade | 2 weeks |
| Month 3 | 5+ companies | Move uploads to S3 | 1 week |
| Month 6 | 10+ companies | Upgrade to Scenario B infra | 2 weeks |
| Month 9 | 500+ daily users | Add second Render instance | 1 day |
| Month 12 | 25+ companies | Plan v2.0 architecture review | 4 weeks |

---

## Monitoring Thresholds for Capacity Alerts

```yaml
# Copy to prometheus-alerts.yml
- alert: StorageGrowthHigh
  expr: mongodb_dbstats_storageSize > 8 * 1024 * 1024 * 1024  # 8 GB
  for: 1h
  annotations:
    summary: "MongoDB storage > 8 GB — plan Atlas tier upgrade"

- alert: ConnectionPoolNearFull
  expr: mongodb_connections_current / mongodb_connections_available > 0.75
  for: 10m
  annotations:
    summary: "MongoDB connection pool 75% full — consider scaling"
```

---

## Certification

✅ Capacity projections cover 3 growth scenarios for 12 months.
✅ Scaling triggers defined with lead times.
✅ Infrastructure cost model established.
✅ Storage growth modeled per collection and file type.
✅ S3 migration identified as prerequisite before Scenario B.
