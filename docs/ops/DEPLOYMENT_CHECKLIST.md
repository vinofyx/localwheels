# Deployment Checklist
**LocalWheels Enterprise v1.0 — Production Operations**
**Policy:** Hotfixes only. No new features. No breaking changes.

---

## When to Deploy

Deploy to production ONLY when:
- [x] A verified production defect has been confirmed (with reproduction steps)
- [x] The fix has been reviewed and approved
- [x] The fix passes all pre-deployment checks below
- [x] A rollback plan is documented (see `ROLLBACK_PLAN.md`)

**Do NOT deploy:**
- Speculative fixes ("this might help")
- Refactors without a verified defect
- New features (gate closed until 2026-10-01)
- Changes that touch more than the minimum code to fix the defect

---

## Pre-Deployment Checklist

### 1. Defect Verification

- [ ] Defect is documented in `OPS_IMPROVEMENT_BACKLOG.md` with ID (e.g. `P1-001`)
- [ ] Defect is reproducible on local dev from clean state
- [ ] Root cause is identified and documented
- [ ] Fix addresses root cause, not just symptoms
- [ ] Fix is minimal — no extra refactoring or scope expansion

### 2. Code Review

- [ ] Diff reviewed by at least one other engineer
- [ ] No new dependencies introduced
- [ ] No breaking changes to API contracts (response shape, HTTP status codes)
- [ ] No changes to authentication/authorization logic without security review
- [ ] No environment variable changes without updating `.env.example`

### 3. Validation (MUST PASS)

Run full production validation suite and verify 48/48 PASS:

```bash
cd backend
node src/scripts/phase28-validate.js
```

- [ ] `phase28-validate.js` — 48/48 PASS
- [ ] The specific defect endpoint returns correct response after fix
- [ ] Adjacent endpoints unaffected (test at minimum 3 related endpoints)
- [ ] Auth still works (login + /me)
- [ ] RBAC still enforced (try company admin creating company → expect 403)

### 4. Deployment Preparation

- [ ] Commit message format: `fix: <description> — resolves #<ID>`
- [ ] `OPS_PRODUCTION_CHANGE_LOG.md` entry drafted
- [ ] `OPS_RELEASE_NOTES.md` entry drafted (if v1.0.x increment)
- [ ] `OPS_IMPROVEMENT_BACKLOG.md` item status updated to `IN_PROGRESS`
- [ ] Rollback commit hash noted: `git log --oneline -3`
- [ ] Customer support notified of maintenance window (if P1/P2)

---

## Deployment Steps

```bash
# 1. Final pre-deploy validation
node backend/src/scripts/phase28-validate.js
# Must show: 48/48 PASS — 0 FAIL

# 2. Commit the fix
git add <changed files>
git commit -m "fix: <description> — resolves #<ID>"

# 3. Restart backend (if local dev)
# Stop current process (Ctrl+C) and restart:
node backend/src/index.js
# OR if using PM2:
pm2 restart localwheels-api

# 4. Post-deployment verification (within 5 minutes)
node backend/src/scripts/phase28-validate.js
node backend/src/scripts/daily-ops-check.js

# 5. Smoke test the specific fix endpoint manually
```

---

## Post-Deployment Checklist

- [ ] `phase28-validate.js` passes (48/48) after deployment
- [ ] `daily-ops-check.js` reports GREEN
- [ ] The specific defect is confirmed resolved
- [ ] No new 5xx errors in logs within 10 minutes of deployment
- [ ] Customer notified of resolution (if they reported the defect)
- [ ] `OPS_IMPROVEMENT_BACKLOG.md` item status updated to `DONE`
- [ ] `OPS_PRODUCTION_CHANGE_LOG.md` updated with actual deploy time and commit hash
- [ ] `OPS_RELEASE_NOTES.md` updated with new version (v1.0.x)
- [ ] `OPS_HEALTH_DASHBOARD.md` updated if metrics changed materially

---

## Severity-Specific Rules

### P1 (Critical — platform down, data loss, security breach)
- Deploy within 4 hours of confirmation
- No additional review gates — one senior engineer validates and deploys
- Notify customer immediately when deploying
- Post-mortem required within 24 hours

### P2 (High — major feature broken, workflow blocked)
- Deploy within 8 business hours
- One code review required
- Notify customer before and after deployment

### P3 (Medium — feature degraded, workaround available)
- Deploy within 48 hours (next deployment window)
- Standard full checklist required
- Customer update at resolution

### P4 (Low — minor issue, no workflow impact)
- Batch with next scheduled deployment
- Can be deferred up to 2 weeks
- Standard full checklist required

---

## Deployment Contacts

| Role | Responsibility |
|---|---|
| Platform Engineer | Writes and validates the fix |
| Ops Lead | Reviews checklist, approves deployment |
| Customer Success | Notifies customer before/after P1/P2 |
| On-call | Available 24×7 for P1 response |

---

*Last updated: 2026-07-02*  
*See also: [ROLLBACK_PLAN.md](ROLLBACK_PLAN.md)*
