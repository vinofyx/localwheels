# LocalWheels — Support & Bug Tracking Process
**Version:** 1.0 | **Phase:** 25 (Production Operations)

---

## Severity Definitions

| Severity | Definition | SLA | Example |
|---------|-----------|-----|---------|
| **P1 — Critical** | Platform down or data loss | Fix in 4 hours | API returning 500 on all requests, login broken |
| **P2 — High** | Major feature broken, no workaround | Fix in 24 hours | Shipment creation failing, invoices not generating |
| **P3 — Medium** | Feature degraded, workaround exists | Fix in 72 hours | Report missing data, slow UI on one screen |
| **P4 — Low** | Minor cosmetic or edge case | Fix in next sprint | Label typo, minor UI misalignment |

---

## Bug Intake Process

### Step 1 — Receive & Log

When a bug is reported (via customer call, email, or internal observation):

1. Log it in this file under **Open Issues** with date, reporter, and description
2. Reproduce the bug (run against local dev or staging)
3. Assign severity using the table above
4. Assign an owner

### Step 2 — Reproduce

```bash
# Connect to backend logs
# On Render: Dashboard → Service → Logs

# Reproduce locally
cd backend
node src/scripts/uat-api-audit.js        # check if endpoint broke
node src/scripts/uat-workflow-test.js    # check if workflow broke
```

### Step 3 — Fix

- Fix only the reported issue — no scope creep
- Do not change business logic unless the bug is in the logic
- Do not refactor unrelated code

### Step 4 — Test

```bash
# After fixing, run regression tests
cd backend
node src/scripts/uat-workflow-test.js    # must be 68/68
node src/scripts/uat-api-audit.js        # must be 112/112
```

### Step 5 — Deploy Hotfix

```bash
git add <changed files>
git commit -m "fix: <short description of bug>"
git push origin main
# Render auto-deploys on push to main
# Verify health: GET https://api.localwheels.com/api/health
```

### Step 6 — Verify in Production

```bash
# Run health check against production
curl https://api.localwheels.com/api/health

# If critical fix: manually verify the specific workflow that was broken
# Communicate fix to affected customer within 30 minutes of deployment
```

---

## Issue Log

### Open Issues

| ID | Date | Reporter | Severity | Description | Owner | Status |
|----|------|---------|---------|-------------|-------|--------|
| — | — | — | — | No open issues | — | — |

---

### Closed Issues (Phase 24 UAT — Fixed Before Launch)

| ID | Date | Description | Root Cause | Fix |
|----|------|-------------|-----------|-----|
| FIX-001 | 2026-07-02 | Workflow test: Lead source 'Direct' rejected | Enum values are `['website','whatsapp','facebook','instagram','google_ads','referral','sales_team','manual_entry']` | Updated UAT test to use `manual_entry` |
| FIX-002 | 2026-07-02 | Workflow test: Quote creation missing fields | `weight_kg` required (not `weight`); `customer_phone` required | Updated UAT test with correct fields |
| FIX-003 | 2026-07-02 | Workflow test: Shipment `payment_type: 'Paid'` rejected | Enum is lowercase: `['topay','paid','fob','tbb']` | Updated UAT test to `paid` |
| FIX-004 | 2026-07-02 | Workflow test: Opportunity `stage: 'proposal'` rejected | Valid stages: `new_lead, qualified, contacted, meeting_scheduled, proposal_sent, negotiation, won, lost` | Updated test to `proposal_sent` |
| FIX-005 | 2026-07-02 | AI endpoint cache not working | Server running old code | Restarted backend — cache active |
| FIX-006 | 2026-07-02 | Lead API response: ID at `.data._id` not `.data.data._id` | Lead route returns raw doc (not `ok()` helper) | Fixed ID extraction path |

> All Phase 24 fixes were test script corrections. No production code required changes.

---

## Customer Communication Templates

### Bug Acknowledgment (send within 2 hours)

```
Subject: [LocalWheels] Issue Reported — [Brief Description]

Hi [Name],

Thank you for reporting this. We have received your report and 
our team is investigating. Current severity: P[1/2/3].

Expected resolution: [ETA based on SLA]

We will update you as soon as the fix is deployed.

— LocalWheels Support Team
```

### Fix Deployed (send within 30 min of deployment)

```
Subject: [LocalWheels] Issue Resolved — [Brief Description]

Hi [Name],

The issue you reported has been resolved and deployed to production.

Fix summary: [1-sentence description of what was fixed]
Deployed at: [timestamp]

Please verify that [specific workflow] is working correctly for you.
Reply to this email if you notice any issues.

— LocalWheels Support Team
```

---

## Hotfix Deployment Commands

```bash
# 1. Create fix on main branch (or hotfix branch for P1)
git checkout -b hotfix/[issue-description]   # for P1 only
git checkout main                             # for P2/P3 — fix directly

# 2. Make the fix, then test
cd backend && node src/scripts/uat-workflow-test.js

# 3. Commit
git add [files]
git commit -m "fix: [description] (P[severity])"

# 4. Push (Render auto-deploys)
git push origin main

# 5. Verify production health
curl -s https://api.localwheels.com/api/health | python -m json.tool

# 6. Monitor logs for 10 minutes after deployment
# Render Dashboard → Service → Logs
```

---

## Escalation Path

| Situation | Action |
|-----------|--------|
| P1 detected | Immediately notify tech lead + ops lead |
| P1 not fixed in 2 hours | Escalate to engineering manager |
| Data integrity suspected | Halt writes, notify all pilots, investigate |
| Security incident | Rotate JWT_SECRET, notify security team |
| Render outage | Check status.render.com, communicate ETA to customers |
| MongoDB Atlas outage | Check cloud.mongodb.com/status, activate read-only mode |
