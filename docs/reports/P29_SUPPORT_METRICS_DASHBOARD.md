# LocalWheels Enterprise v1.0 — Support Metrics Dashboard

**Program:** LocalWheels Enterprise v1.0 Production Execution  
**Phase:** 5 — Support Operations  
**Date:** 2026-07-03  
**Review Cadence:** Weekly (ops team) / Monthly (executive)  

---

## Current Period: 2026-07-03 → 2026-07-31 (Pilot Month 1)

### Ticket Volume

| Priority | Open | Resolved | Total | Avg Resolution Time |
|----------|------|----------|-------|---------------------|
| P1 — Critical | 0 | 0 | 0 | — |
| P2 — High | 0 | 0 | 0 | — |
| P3 — Medium | 0 | 0 | 0 | — |
| P4 — Low | 0 | 0 | 0 | — |
| **Total** | **0** | **0** | **0** | **—** |

### SLA Compliance

| SLA | Target | Actual | Status |
|-----|--------|--------|--------|
| P1 First Response | 15 min | — | — |
| P1 Resolution | 4 hours | — | — |
| P2 First Response | 1 hour | — | — |
| P2 Resolution | 24 hours | — | — |
| P3 First Response | 4 hours | — | — |
| P3 Resolution | 72 hours | — | — |

---

## Support Channels

| Channel | Status | Volume (this period) | Notes |
|---------|--------|---------------------|-------|
| Email (support@localwheels.in) | Active | 0 | Primary channel |
| WhatsApp Business | Configured | 0 | Customer-facing |
| In-app Help Desk | Active | 0 | Via /api/complaints |
| Phone | On-call only | — | P1/P2 escalation |

---

## Issue Tracker (All Tickets)

| ID | Date | P-Level | Customer | Component | Status | Assigned To |
|----|------|---------|----------|-----------|--------|-------------|

---

## Common Issue Categories

Track frequencies across these categories as tickets accumulate:

| Category | Count | % of Total |
|----------|-------|-----------|
| Authentication / Login | 0 | — |
| Shipment Creation | 0 | — |
| Invoice / Finance | 0 | — |
| Driver / POD | 0 | — |
| Dashboard / Reports | 0 | — |
| Data Import | 0 | — |
| Performance / Slow | 0 | — |
| UI / Display Issues | 0 | — |
| Training / How-to | 0 | — |
| Other | 0 | — |

---

## Hotfix Deployments

| Date | Version | Scope | Incident ID | Regression Tests |
|------|---------|-------|-------------|-----------------|

---

## Customer Satisfaction

| Customer | NPS Score | Last Contacted | Notes |
|----------|-----------|---------------|-------|

*Target: >90% satisfaction. Collect after each resolved P1/P2, and monthly for all customers.*

---

## Support Runbooks (Quick Reference)

### User cannot log in
1. Check `GET /api/auth/me` with their token — is it expired?
2. If Clerk user: verify CLERK_SECRET_KEY is set in Render
3. If password user: confirm account exists in DB: `db.users.findOne({ username: '...' })`
4. Check for `lw_clerk_session` flag causing redirect — clear browser storage

### Shipment stuck in status
1. Check `GET /api/shipments/:id` — verify current status
2. Review audit log: `GET /api/shipments/:id/history`
3. Manual status update via admin panel if needed

### Invoice not generated after POD
1. Verify POD is marked complete in `/api/pod`
2. Check automation rules: `GET /api/automation`
3. Manual trigger: `POST /api/invoices` with shipment_id

### Dashboard shows no data
1. Confirm `branch_id` is set in user profile
2. Check DB: verify data exists for the branch
3. Clear browser cache / force refresh

### Backend not responding (5xx)
1. Check `/api/health` — is it returning `"status":"ok"`?
2. Check Render logs for errors
3. If MongoDB disconnected: check Atlas cluster status
4. Restart Render service if needed (Settings → Manual Deploy → Restart)

---

## Escalation Decision Tree

```
Customer reports issue
        │
        ▼
Is the backend down?  (GET /api/health fails)
   YES → P1: page on-call, check MongoDB/Render
   NO  ↓
Is all data inaccessible?
   YES → P1: check auth middleware, JWT secret
   NO  ↓
Is a core workflow broken? (booking, shipment, invoice)
   YES → P2: assign to engineering
   NO  ↓
Is there a workaround?
   YES → P3: schedule for next sprint
   NO  → P2: expedite fix
```

---

## Monthly Targets (Pilot Phase)

| Metric | Target |
|--------|--------|
| Total tickets | < 20 (first month) |
| P1 incidents | 0 |
| SLA breach rate | 0% |
| First-contact resolution | > 70% |
| Customer satisfaction | > 90% |
| Unresolved bugs at month end | 0 P1/P2, < 5 P3 |

---

*Dashboard owner: Support Lead | Updated: weekly | Archive: docs/reports/support/*
