# Rollback Plan
**LocalWheels Enterprise v1.0 — Production Operations**
**Purpose:** Procedure to revert a failed production deployment

---

## Rollback Triggers

Execute rollback immediately if ANY of the following occur after deployment:

| Trigger | Action |
|---|---|
| `phase28-validate.js` fails (< 48/48 PASS) | Rollback immediately |
| `daily-ops-check.js` reports RED | Rollback immediately |
| 5xx error rate > 1% within 10 minutes | Rollback immediately |
| MongoDB connection drops after deployment | Rollback immediately |
| Auth (login) stops working | Rollback immediately |
| Customer reports data loss or corruption | Rollback immediately |
| Any P1-severity regression introduced | Rollback immediately |

**If in doubt — roll back first, investigate second. Recovery is always faster than debugging in production.**

---

## Rollback Procedure

### Step 1 — Identify the pre-deployment commit

```bash
# List last 5 commits to find the one before the bad deployment
git log --oneline -5

# Example output:
# a1b2c3d fix: complaint type field — resolves #P2-003  ← BAD (just deployed)
# 9f8e7d6 ops: daily ops check + 7 deliverables          ← GOOD (restore to this)
# d4ccf8d feat: Phase 28 Go-Live Certification
```

Note the hash of the GOOD commit (one before the bad deployment).

### Step 2 — Revert the bad commit

```bash
# SAFE: creates a new revert commit (preserves history)
git revert <bad-commit-hash> --no-edit
# Example: git revert a1b2c3d --no-edit

# This creates: "Revert 'fix: complaint type field — resolves #P2-003'"
```

Do NOT use `git reset --hard` unless the bad commit has not been pushed to remote. Prefer `git revert` — it preserves history and is auditable.

### Step 3 — Restart the backend

```bash
# Stop current Node.js process (Ctrl+C or kill PID)
# Restart from the now-reverted codebase:
node backend/src/index.js

# OR if using PM2:
pm2 restart localwheels-api
```

### Step 4 — Verify rollback succeeded

```bash
# Run full validation — must be 48/48
cd backend
node src/scripts/phase28-validate.js

# Run daily ops check — must be GREEN
node src/scripts/daily-ops-check.js
```

Both must pass before declaring rollback complete.

### Step 5 — Notify and document

- [ ] Customer notified if P1/P2 was involved
- [ ] `OPS_PRODUCTION_CHANGE_LOG.md` updated with rollback entry
- [ ] `OPS_IMPROVEMENT_BACKLOG.md` item set back to `OPEN` or `IN_ANALYSIS`
- [ ] Post-mortem scheduled (required for all rollbacks)

---

## Rollback Time Targets

| Scenario | Target Time |
|---|---|
| Identify need to rollback | Within 10 minutes of deployment |
| Execute rollback (git revert + restart) | Within 5 minutes |
| Verify rollback succeeded | Within 5 minutes |
| Customer notification (if P1/P2) | Within 15 minutes of rollback decision |
| **Total target: from trigger to verified rollback** | **< 20 minutes** |

---

## Database Rollback

The standard git revert handles code changes only. If a deployment also ran a data migration:

### Scenario A — No data migration (most hotfixes)
Standard git revert is sufficient. No DB action needed.

### Scenario B — Schema change (field added, index added)
MongoDB is schemaless — adding a field in a schema does not modify existing documents. Rolling back the code is sufficient; old documents just won't have the new field (which is fine since the code no longer references it).

### Scenario C — Data mutation (records updated/deleted)
**This scenario should never occur in v1.0 hotfixes.** Hotfixes must not run data migrations. If this somehow happens:
1. Contact Platform Lead immediately
2. Do NOT attempt DB rollback without a full backup verified
3. MongoDB Atlas point-in-time recovery (when configured) can restore to pre-deployment state

---

## Rollback Communication Template

**Customer notification (P1/P2 only):**

```
Subject: LocalWheels — Service Update [<timestamp>]

We have detected an issue following today's maintenance update.
We are rolling back to the previous stable version immediately.

Status: Rollback in progress
Expected resolution: <time>
Impact: <describe impact — e.g., "API may be briefly unavailable">

We will notify you when normal service is restored.

— LocalWheels Platform Team
```

**Resolution notification:**

```
Subject: LocalWheels — Service Restored [<timestamp>]

Normal service has been restored.
Rollback completed successfully at <time>.

We are investigating the root cause and will provide a full
post-mortem within 24 hours.

— LocalWheels Platform Team
```

---

## Post-Rollback Requirements

1. **Post-mortem within 24 hours** — what went wrong, why it wasn't caught in pre-deploy checks
2. **Add test case to `phase28-validate.js`** if the defect wasn't caught by existing checks
3. **Update Deployment Checklist** if a process gap is identified
4. **Fix the original defect** — properly this time, with the additional test case
5. **Re-deploy** — using the full checklist with the updated validation suite

---

## Version-Specific Rollback Map

| Deployed Version | Rollback To | Commit |
|---|---|---|
| v1.0.0 (current) | N/A — initial release | `ea425a0` |
| v1.0.1 (future) | v1.0.0 | `ea425a0` |
| v1.0.2 (future) | v1.0.1 | TBD |

**Current stable baseline:** `ea425a0` (Phase 28 Go-Live Certification)

---

*Last updated: 2026-07-02*  
*See also: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)*  
*Validation script: `backend/src/scripts/phase28-validate.js`*
