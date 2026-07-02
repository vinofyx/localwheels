# Risk Register
**LocalWheels Enterprise v1.0 — Production Operations**
**Date:** 2026-07-02
**Customer:** Rajdhani Cargo Services Pvt Ltd
**Review Cycle:** Monthly (next: 2026-08-01)

---

## Risk Matrix

**Probability:** 1 = Rare, 2 = Unlikely, 3 = Possible, 4 = Likely, 5 = Almost certain  
**Impact:** 1 = Negligible, 2 = Minor, 3 = Moderate, 4 = Major, 5 = Critical  
**Score = Probability × Impact**

| Score | Rating |
|---|---|
| 1–4 | 🟢 Low |
| 5–9 | 🟡 Medium |
| 10–15 | 🟠 High |
| 16–25 | 🔴 Critical |

---

## Security Risks

| ID | Risk | P | I | Score | Rating | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| S1 | Admin password not changed (default shipped) | 4 | 4 | 16 | 🔴 Critical | Change immediately | Customer IT | Open |
| S2 | JWT secret exposed via env file | 2 | 5 | 10 | 🟠 High | Verify `.gitignore` covers `.env` | Platform Team | Open |
| S3 | `/api/metrics` publicly accessible in cloud | 2 | 3 | 6 | 🟡 Medium | Restrict to internal network before cloud deploy | Platform Team | Open |
| S4 | HTTPS not configured (HTTP in local dev) | 1 | 4 | 4 | 🟢 Low | Required before cloud / public URL | Platform Team | Open |
| S5 | MongoDB no auth (local dev) | 1 | 4 | 4 | 🟢 Low | Enable auth before cloud deployment | Platform Team | Open |
| S6 | No MFA on admin accounts | 2 | 3 | 6 | 🟡 Medium | Plan for v2 if customer requests | Roadmap | Deferred |
| S7 | Dependency vulnerabilities (npm audit) | 2 | 3 | 6 | 🟡 Medium | Run `npm audit` monthly | Platform Team | Scheduled Aug 1 |
| S8 | Anthropic API key rotation | 1 | 3 | 3 | 🟢 Low | 90-day rotation scheduled Oct 1 | Platform Team | Scheduled |

---

## Infrastructure Risks

| ID | Risk | P | I | Score | Rating | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| I1 | Single MongoDB instance (no replica set) | 2 | 5 | 10 | 🟠 High | Accept for pilot; migrate before GA | Platform Team | Accepted (pilot) |
| I2 | Single Node.js process (no cluster/PM2) | 2 | 4 | 8 | 🟡 Medium | PM2 cluster if CPU > 70% sustained | Platform Team | Monitoring |
| I3 | No Redis — no distributed rate limiting | 2 | 2 | 4 | 🟢 Low | Single server in pilot; Redis when scaling | Platform Team | Deferred |
| I4 | No automated database backup | 3 | 5 | 15 | 🟠 High | Configure MongoDB Atlas backup before GA | Platform Team | Open |
| I5 | No external uptime monitoring | 2 | 3 | 6 | 🟡 Medium | Uptime Robot (free) before public URL | Platform Team | Open |
| I6 | Memory leak (hypothetical, not observed) | 1 | 4 | 4 | 🟢 Low | Monitor heap trend weekly | Platform Team | Monitoring |
| I7 | Disk space exhaustion (uploads dir) | 1 | 2 | 2 | 🟢 Low | Monitor uploads/ directory size monthly | Platform Team | Monitoring |

---

## Operational Risks

| ID | Risk | P | I | Score | Rating | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | Low user adoption (users don't log in) | 2 | 3 | 6 | 🟡 Medium | Training sessions scheduled W1–W2 | Platform Team | In progress |
| O2 | 2 driver licenses expiring within 6 months | 3 | 2 | 6 | 🟡 Medium | Alert fleet_mgr; renewals due Sep/Dec 2026 | Customer Fleet | Open |
| O3 | Customer data quality issues (duplicate phone) | 1 | 3 | 3 | 🟢 Low | Dedup enforced in import; API validates | — | Mitigated |
| O4 | SMTP not configured (missed email SLA) | 3 | 2 | 6 | 🟡 Medium | Manual email workaround acceptable for Week 1 | Customer IT | Open |
| O5 | Customer exits pilot early | 1 | 5 | 5 | 🟡 Medium | Weekly satisfaction surveys; rapid issue resolution | CS Team | Monitoring |
| O6 | New customer onboarding blocks pilot focus | 1 | 2 | 2 | 🟢 Low | Only one customer in pilot phase; v2 gate prevents premature expansion | — | Mitigated |

---

## Business Risks

| ID | Risk | P | I | Score | Rating | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| B1 | Pilot fails acceptance criteria | 2 | 5 | 10 | 🟠 High | Weekly ops reviews; rapid P1 response | Platform Team | Monitoring |
| B2 | Version 2.0 gate bypassed prematurely | 1 | 4 | 4 | 🟢 Low | Gate documented; requires exec approval | Governance | Policy |
| B3 | Feature creep during pilot (scope expansion) | 2 | 3 | 6 | 🟡 Medium | Ops-only mandate enforced; all requests backlogged | Governance | Policy |
| B4 | Regulatory issue (GST filing, e-way bill) | 1 | 3 | 3 | 🟢 Low | Platform supports GST; e-way integration v2 | Roadmap | Noted |

---

## Risk Summary

| Rating | Count | Open | Mitigated | Deferred |
|---|---|---|---|---|
| 🔴 Critical | 1 | 1 | 0 | 0 |
| 🟠 High | 3 | 3 | 0 | 0 |
| 🟡 Medium | 10 | 7 | 0 | 3 |
| 🟢 Low | 8 | 3 | 3 | 2 |
| **Total** | **22** | **14** | **3** | **5** |

---

## Immediate Actions (Open Critical/High)

| ID | Action | Due | Owner |
|---|---|---|---|
| S1 | Change admin password | 2026-07-03 | Customer IT |
| S2 | Verify `.env` in `.gitignore` | 2026-07-03 | Platform Team |
| I1 | Plan MongoDB replica set for post-pilot GA | 2026-08-01 | Platform Team |
| I4 | Configure automated MongoDB backup | 2026-07-14 | Platform Team |
| B1 | Weekly satisfaction check-in | Every Friday | CS Team |

---

*Next Risk Review: 2026-08-01 (Monthly)*
