# Improvement Backlog
**LocalWheels Enterprise v1.0 — Production Operations**
**Date:** 2026-07-02
**Policy:** Evidence-based only — no speculative features

---

## Backlog Policy

> Items enter this backlog ONLY when supported by one of:
> - Verified production defect (reproducing in live system)
> - Customer-reported friction (documented in support ticket or feedback session)
> - Measured performance regression (ops log data)
> - Security finding (audit or `npm audit`)
> - Operational finding (weekly/daily ops check)

Items without a source are not added. Feature requests are tracked but not scheduled until the Version 2.0 gate is passed.

---

## Status Definitions

| Status | Meaning |
|---|---|
| `OPEN` | Identified, not yet scheduled |
| `IN_ANALYSIS` | Being investigated before commit to fix |
| `APPROVED` | Approved for hotfix — production defect confirmed |
| `IN_PROGRESS` | Fix being developed |
| `DONE` | Deployed and verified |
| `DEFERRED` | Valid but deferred to Version 2.0 |
| `REJECTED` | Investigated; not a defect or not in scope |

---

## Section A — Verified Production Defects

Items in this section are confirmed defects in the live system. These are the ONLY items approved for immediate development.

| ID | Description | Source | Severity | Status | Resolution |
|---|---|---|---|---|---|
| — | No confirmed production defects (Day 1) | — | — | — | — |

---

## Section B — Operational Findings (Infrastructure / Performance)

Findings from the automated ops checks that may need attention.

| ID | Finding | Source | Priority | Status | Notes |
|---|---|---|---|---|---|
| OF-001 | Admin password not changed since go-live | Daily ops check 2026-07-02 | High | OPEN | Customer IT action — not a platform defect |
| OF-002 | Redis cache not configured | Daily ops check | Low | OPEN | Optional — activate with `REDIS_URL` when needed |
| OF-003 | `/api/metrics` accessible without auth | Security review | Low | OPEN | Restrict to internal network before public cloud |
| OF-004 | No automated MongoDB backup | Risk register | High | OPEN | Configure before GA |
| OF-005 | No external uptime monitor | Risk register | Medium | OPEN | Uptime Robot or similar before public URL |

---

## Section C — Customer Feature Requests

Items requested by customer users. NOT approved for development until Version 2.0 gate.

| ID | Request | Requested By | Date | Module | Notes |
|---|---|---|---|---|---|
| FR-001 | _(no requests yet — Day 1)_ | — | — | — | — |

---

## Section D — Security Actions

Findings from security reviews requiring remediation.

| ID | Finding | Severity | Status | Due |
|---|---|---|---|---|
| SEC-001 | `npm audit` not yet run | Medium | OPEN | 2026-08-01 |
| SEC-002 | JWT secret rotation not yet scheduled in prod | Low | OPEN | 2026-10-01 |
| SEC-003 | MongoDB auth not enabled (local dev) | Low | OPEN | Before cloud deploy |
| SEC-004 | HTTPS not configured | Medium | OPEN | Before cloud deploy |

---

## Section E — Dependency Updates

| Package | Current | Latest | Breaking Change? | Action |
|---|---|---|---|---|
| express | 4.18.3 | Check monthly | — | `npm audit` on 2026-08-01 |
| mongoose | 8.23.1 | Check monthly | — | Review changelog |
| jsonwebtoken | 9.0.2 | Check monthly | — | Stable |
| @anthropic-ai/sdk | 0.106.0 | Check monthly | — | Check for new models |

*Last dependency audit: Not yet run. Scheduled 2026-08-01.*

---

## Backlog Statistics

| Category | Items | Open | Done |
|---|---|---|---|
| Production Defects | 0 | 0 | 0 |
| Operational Findings | 5 | 5 | 0 |
| Feature Requests | 0 | 0 | 0 |
| Security Actions | 4 | 4 | 0 |
| Dependency Updates | 4 | 4 | 0 |
| **Total** | **13** | **13** | **0** |

---

## Hotfix Deployment Protocol

When a production defect is confirmed and a fix is approved:

1. Reproduce defect in dev — document steps
2. Write minimal fix — no refactoring, no scope expansion
3. Run existing validation suite (`node src/scripts/phase28-validate.js`)
4. Verify fix resolves the issue at the API surface
5. Commit with message format: `fix: <description> — resolves #<ID>`
6. Update this backlog: move item to DONE
7. Append entry to [Production Change Log](OPS_PRODUCTION_CHANGE_LOG.md)
8. Update release notes

---

*Last updated: 2026-07-02*
*Next review: 2026-07-09 (weekly)*
