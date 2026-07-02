# Production Change Log
**LocalWheels Enterprise v1.0 — Production Operations**
**Format:** Newest changes first

---

## Change Management Policy

All production changes must:
1. Be in response to a verified defect, security finding, or approved operational task
2. Pass the validation suite (`node src/scripts/phase28-validate.js`) before deployment
3. Be committed with format: `fix: <description>` or `ops: <description>`
4. Be documented in this change log within 24 hours of deployment
5. Never introduce new features outside the approved Version 2.0 gate process

---

## v1.0.0 — Initial Production Release

**Date:** 2026-07-02  
**Commit:** `ea425a0` (Phase 28 Go-Live Certificate)  
**Type:** Production release  
**Validation:** 48/48 PASS (phase28-validate.js)

### Changes Included

**Phase 28 — Pilot Operations**
- Production validation script (`phase28-validate.js`) — 48/48 live checks
- Weekly ops script (`weekly-ops-check.js`) — automated GREEN/YELLOW/RED status
- Daily ops script (`daily-ops-check.js`) — P95 latency + business entity counts
- 8 operational reports (Weekly, Monthly Perf, Customer Success, Security, Support, KPI, Executive, v2 Backlog)
- 7 production ops deliverables (Daily, Infrastructure, Risk Register, Backlog, Change Log, Health Dashboard, Release Notes)
- Go-live certificate LW-CERT-2026-001

**Phase 27b — First Customer Onboarding**
- Production onboarding script (`onboard-first-customer.js`) — 29/29 PASS
- Company: Rajdhani Cargo Services Pvt Ltd (ID: 6a46876adbb074ca5f6f7e21)
- 3 branches, 9 users, 12 customers, 12 vehicles, 10 drivers
- Validation transactions: LW00000001–LW00000003

**Phase 27 — Tenant Initialization**
- `POST /api/companies` — creates company + branch + admin + seeds 117 config records
- `tenantInit.js` — seeds CoA, vehicle types, shipment types, tax slabs, notification templates
- `AppSettings`, `MasterConfig`, `NotificationTemplate` models
- Setup wizard (`/setup`) — 6-step, persists progress
- Import routes (`/api/import`) — CSV parser, template download, dedup

**Phase 26 — Production Data Cleanup**
- Removed all demo/seed data
- Fixed super_admin `company_id: null` handling

---

## Pending Changes

None. Platform is at v1.0.0 baseline.

---

## Change Log Template

When adding a future entry, use this format:

```
## v1.0.1 — <Short description>

**Date:** YYYY-MM-DD
**Commit:** <git hash>
**Type:** hotfix | security | ops | performance
**Defect Ref:** #<ID from Improvement Backlog>
**Validation:** <X>/<Y> PASS (phase28-validate.js)

### Changes
- <bullet: what changed and why>

### Rollback
- `git revert <commit hash>` and redeploy
```

---

*Log started: 2026-07-02*  
*Next expected change: Hotfix for OF-001 (admin password) — not a code change*
