# LocalWheels Platform — Monitoring Guide
**Version:** 1.0 | **Date:** 2026-07-02 | **Audience:** Operations, DevOps

---

## 1. Monitoring Stack

| Tool | Purpose | Access |
|------|---------|--------|
| Prometheus | Metrics collection | http://localhost:9090 |
| Grafana | Dashboards & alerts | http://localhost:3000 (admin/admin) |
| `/api/health` | Health check endpoint | https://api.localwheels.com/api/health |
| `/api/metrics` | Prometheus scrape target | https://api.localwheels.com/api/metrics |
| MongoDB Atlas | DB monitoring | atlas.mongodb.com |
| Render Logs | Application logs | render.com dashboard |

---

## 2. Health Check

### Endpoint
```
GET /api/health
```

### Expected Response (healthy system)
```json
{
  "status": "ok",
  "timestamp": "2026-07-02T10:00:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production",
  "database": "connected",
  "redis": "connected"
}
```

### Degraded States
| Field | Value | Action |
|-------|-------|--------|
| `database` | `"disconnected"` | Check MongoDB Atlas connectivity, restart backend |
| `redis` | `"disconnected"` | Redis cache unavailable — system still works, slower |
| HTTP status | 503 | Backend is down — check Render logs |

### Uptime Monitor Setup (UptimeRobot)
1. Add HTTP monitor: `https://api.localwheels.com/api/health`
2. Check interval: 5 minutes
3. Alert on: HTTP not 200
4. Alert channels: Email + SMS (on-call engineer)

---

## 3. Prometheus Metrics

### Key Metrics Available

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total API requests by method/route/status |
| `http_request_duration_seconds` | Histogram | Request latency distribution |
| `nodejs_heap_used_bytes` | Gauge | Memory usage |
| `nodejs_active_handles_total` | Gauge | Active connections |
| `process_cpu_user_seconds_total` | Counter | CPU usage |
| `mongodb_connections_active` | Gauge | Active DB connections |

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml (already configured)
scrape_configs:
  - job_name: 'localwheels-backend'
    scrape_interval: 15s
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/api/metrics'
```

---

## 4. Grafana Dashboards

### Setup
1. Start stack: `docker-compose up -d`
2. Open: http://localhost:3000
3. Login: admin / admin (change on first login)
4. Datasource: Prometheus at http://prometheus:9090 (pre-configured)

### Dashboard Panels to Create

**API Performance Dashboard:**
```
Panel 1: Request Rate
  Query: rate(http_requests_total[5m])

Panel 2: Error Rate (4xx + 5xx)
  Query: rate(http_requests_total{status=~"4..|5.."}[5m])

Panel 3: P95 Latency
  Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

Panel 4: P99 Latency
  Query: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

**System Health Dashboard:**
```
Panel 1: Memory Usage
  Query: nodejs_heap_used_bytes

Panel 2: CPU Usage
  Query: rate(process_cpu_user_seconds_total[1m]) * 100

Panel 3: Active Connections
  Query: nodejs_active_handles_total

Panel 4: Uptime
  Query: process_uptime_seconds
```

### Alerting Rules

Configure in Grafana → Alerting → Alert Rules:

| Alert | Condition | Severity | Action |
|-------|-----------|---------|--------|
| High Error Rate | error_rate > 5% for 5min | Critical | Page on-call |
| High P99 Latency | p99 > 2000ms for 5min | High | Notify team |
| Memory Critical | heap > 1.5GB | High | Notify + investigate |
| DB Disconnect | health.database != "connected" | Critical | Page on-call |
| Backend Down | health endpoint returns non-200 | Critical | Page on-call |

---

## 5. MongoDB Atlas Monitoring

### Atlas Built-in Monitoring
1. Atlas Dashboard → Cluster → Metrics tab
2. Key charts:
   - **Connections:** Should stay under 80% of max
   - **Opcounters:** Read/write rate over time
   - **Query Executors:** Scanned vs returned (high ratio = missing index)
   - **Cache:** Working set should fit in cache

### Performance Advisor
1. Atlas → Cluster → Performance Advisor
2. Review suggested indexes weekly (first month after go-live)
3. Apply suggested indexes during low-traffic windows

### Slow Query Log
Atlas logs queries > 100ms automatically.
Review in: Atlas → Cluster → Performance Advisor → Slow Queries

### Atlas Alerts to Configure
- Connections > 80% capacity → Email
- Average query execution time > 200ms → Email
- Disk usage > 80% → Email + SMS
- Replica set election → Email + SMS (potential failover)
- Backup failed → Email

---

## 6. Application Logs

### Log Format (morgan)
```
:method :url :status :response-time ms - :res[content-length]
```

Example:
```
GET /api/health 200 12.345 ms - 156
POST /api/auth/login 200 234.567 ms - 312
GET /api/shipments 401 2.123 ms - 89
```

### Log Levels
- `INFO` — Normal operations
- `WARN` — Rate limit triggered, slow query, Redis miss
- `ERROR` — Unhandled exceptions, DB errors, auth failures

### Searching Logs (Render)
```
Filter: ERROR           → All application errors
Filter: 500             → HTTP 500 responses  
Filter: auth/login      → Login attempts
Filter: mongoose        → Database errors
```

### Log Retention
- Render free tier: Last 7 days
- Render paid tier: 30 days
- Recommended: Ship logs to Datadog or CloudWatch for 90-day retention

---

## 7. Business KPI Monitoring

The following KPIs are tracked automatically and visible in dashboards:

| KPI | Source | Dashboard |
|-----|--------|-----------|
| Daily Shipments | shipments collection | Control Tower |
| On-Time Delivery % | trip completion data | Executive Dashboard |
| Vehicle Utilization | fleet telemetry | Fleet Analytics |
| Warehouse Fill Rate | inventory levels | Warehouse Analytics |
| Invoice Aging | finance module | Finance Dashboard |
| Lead Conversion Rate | CRM pipeline | Sales Dashboard |
| AI Automation ROI | automation executions | Automation Analytics |
| API Response Time | Prometheus | Grafana |

---

## 8. Incident Detection Playbook

### Scenario: Sudden spike in 500 errors
1. Check Grafana error rate panel
2. Check Render backend logs for ERROR messages
3. Check `/api/health` — is DB connected?
4. If DB disconnected: Check Atlas connection string, IP allowlist
5. If DB connected but errors: Look for unhandled exceptions in logs
6. Restart backend pod if no root cause found within 15 minutes

### Scenario: High latency (P99 > 2s)
1. Check MongoDB Atlas → Performance Advisor for slow queries
2. Check Grafana memory panel — is heap near limit?
3. Check Grafana connections panel — connection leak?
4. Check Redis — is cache hit rate low? (All requests hitting DB?)
5. Atlas Performance Advisor → Apply suggested indexes

### Scenario: Memory leak (heap growing)
1. Monitor over 1-hour window in Grafana
2. If trending up consistently: restart pod (temporary fix)
3. Review recent deploys — identify offending code
4. Common cause: unclosed event emitters, large in-memory accumulation

### Scenario: Login failures spike
1. Check logs for "Too many login attempts" (rate limit messages)
2. Could be brute force — check source IP
3. If brute force: Block IP at Cloudflare WAF level
4. Notify security team

---

## 9. Runbook Quick Reference

| Situation | Command / Action |
|-----------|-----------------|
| Check backend health | `curl https://api.localwheels.com/api/health` |
| View Prometheus metrics | `curl https://api.localwheels.com/api/metrics` |
| Restart backend (Render) | Render Dashboard → Manual Deploy |
| Restart backend (Docker) | `docker-compose restart backend` |
| Restart backend (K8s) | `kubectl rollout restart deployment/localwheels-backend` |
| View backend logs | `docker-compose logs -f backend` |
| Check DB connections | Atlas Dashboard → Real Time |
| Flush Redis cache | `redis-cli FLUSHDB` (⚠️ clears all cache) |
| Force re-index MongoDB | `node backend/src/scripts/ensure-indexes.js` |
