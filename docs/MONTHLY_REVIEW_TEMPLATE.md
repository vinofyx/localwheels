# LocalWheels — Monthly Operations Review Template
**Version:** 1.0 | Use this template every month during pilot operations

---

## Header

**Review Period:** Month [X] — [Month YYYY]  
**Review Date:** [Date]  
**Attendees:** [Operations Lead, Support Lead, Tech Lead, Customer Success]

---

## 1. Uptime & Reliability

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| API uptime | 99.9% | | |
| Planned downtime (deployments) | < 30 min/month | | |
| Unplanned outages | 0 | | |
| P95 API latency | < 500 ms | | |
| AI endpoint response (cached) | < 100 ms | | |

**Incidents this month:**
- [List any outages, degradations, or alerts that fired]

---

## 2. Performance Metrics

| Endpoint | Avg Response | P95 | P99 | Notes |
|---------|-------------|-----|-----|-------|
| `/api/health` | | | | |
| `/api/dashboard` | | | | |
| `/api/shipments` | | | | |
| `/api/executive-cockpit/snapshot` | | | | |
| `/api/forecast/revenue` | | | | |

**MongoDB:**
- Avg query time: ___
- Slow queries (>100ms): ___
- Connection pool utilization: ___%
- Storage used: ___ GB / ___ GB

**Redis:**
- Cache hit rate: ___%
- Memory used: ___ MB / ___ MB

---

## 3. Business KPIs (across all pilot companies)

| KPI | Company 1 | Company 2 | Company 3 | Total |
|-----|----------|----------|----------|-------|
| New shipments created | | | | |
| Shipments delivered | | | | |
| Leads created | | | | |
| Quotes generated | | | | |
| Invoices raised (₹) | | | | |
| Payments collected (₹) | | | | |
| Complaints raised | | | | |
| Complaints resolved | | | | |
| Active users (DAU) | | | | |

---

## 4. Support Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Bugs reported | — | |
| Bugs resolved | — | |
| Critical bugs open | 0 | |
| Avg resolution time | < 48 hours | |
| Customer escalations | 0 | |

**Open issues:**

| Issue | Severity | Reported | Status | ETA |
|-------|---------|---------|--------|-----|
| | | | | |

---

## 5. Security

| Check | Status |
|-------|--------|
| npm audit (critical/high) | 0 |
| Unauthorized access attempts | |
| Rate limit triggers | |
| Failed login spikes | |
| JWT anomalies | |

---

## 6. Customer Feedback

### Company 1 — [Name]
- **Feature requests:** 
- **Pain points:** 
- **Performance feedback:** 
- **AI accuracy feedback:** 
- **Satisfaction (1–10):** 

### Company 2 — [Name]
- **Feature requests:** 
- **Pain points:** 
- **Performance feedback:** 
- **Satisfaction (1–10):** 

### Company 3 — [Name]
- **Feature requests:** 
- **Pain points:** 
- **Performance feedback:** 
- **Satisfaction (1–10):** 

**Aggregate NPS / CSAT:** ___

---

## 7. AI Usage

| AI Feature | Calls This Month | Avg Latency | Cache Hit % | Cost (Anthropic) |
|-----------|----------------|------------|------------|-----------------|
| Executive Cockpit Snapshot | | | | |
| Revenue Forecast | | | | |
| Finance AI Copilot | | | | |
| WH-AI Recommendations | | | | |
| **Total** | | | | |

---

## 8. Deployments & Changes

| Date | Version | Change | Rollback? |
|------|---------|--------|----------|
| | | | |

---

## 9. Capacity Review

| Resource | Current Usage | 80% Threshold | Action Needed? |
|---------|--------------|--------------|----------------|
| MongoDB Storage | | | |
| Redis Memory | | | |
| Render CPU (avg) | | | |
| Render Memory (avg) | | | |

---

## 10. Action Items

| # | Action | Owner | Due Date | Priority |
|---|--------|-------|---------|---------|
| 1 | | | | |

---

## 11. Next Month Focus

1. 
2. 
3. 

---

## 12. Executive Summary (3 sentences)

[Write 3-sentence summary: overall health, key achievement, top concern]

---

*Template version: 1.0 | Review cadence: Monthly (first Monday of each month)*
