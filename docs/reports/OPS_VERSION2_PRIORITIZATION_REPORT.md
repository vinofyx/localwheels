# Version 2.0 Prioritization Report
**LocalWheels Enterprise v1.0 — Production Operations**
**Status:** PRE-GATE — Collection Only (Do Not Build)
**Date:** 2026-07-02

---

## Version 2.0 Gate Status

**Version 2.0 development has NOT been approved.** This document tracks the collection of evidence that will inform the Version 2.0 roadmap after the gate conditions are satisfied.

| Gate Condition | Required | Current | Met? |
|---|---|---|---|
| Minimum 90 days production usage | 90 days | Day 1 | ❌ |
| Multiple active production customers | ≥ 2 | 1 (pilot) | ❌ |
| Stable production metrics (30 days) | 30 days green | 0 days | ❌ |
| Customer satisfaction above target | NPS ≥ 7/10 | TBD | ❌ |
| Support trends analyzed | 30 days data | 0 days | ❌ |
| Feature requests prioritized | Customer-validated | 0 requests | ❌ |
| Executive approval | Board sign-off | Pending | ❌ |

**Earliest possible Version 2.0 start: 2026-10-01**

---

## Evidence Collection Framework

### What We Are Collecting (Not Building)

During the 90-day pilot and operations period, the following inputs will be collected to form the Version 2.0 roadmap:

1. **Support tickets** — module breakdown, frequency, severity, resolution time
2. **Feature requests** — from all 9 users, ranked by frequency and role
3. **Workflow friction** — where do users get stuck or take workarounds?
4. **Performance data** — which endpoints degrade under real load?
5. **AI module usage** — which AI features are actually used?
6. **Unused modules** — which of the 324 pages have zero traffic?
7. **Integration requests** — which external systems does the customer want to connect?
8. **Mobile/app requests** — do users want native mobile access?
9. **Report format requests** — which report types does finance need?
10. **Automation requests** — what manual steps could be eliminated?

---

## Preliminary Backlog (Hypothesis — Not Validated)

These are hypotheses to be validated with real customer evidence. **None are approved for development.**

### Operational Enhancements (Hypothesized)

| # | Feature | Hypothesis Source | Validation Required |
|---|---|---|---|
| E1 | Mobile app for drivers (POD on phone) | Phase 27b design | Driver usage data |
| E2 | WhatsApp notifications (auto-send on delivery) | Customer has WhatsApp | Customer confirms priority |
| E3 | GPS tracking integration (real-time) | Phase 28 gap identified | Customer GPS provider confirmed |
| E4 | Bulk LR creation from Excel | Logistics industry norm | Dispatch user request |
| E5 | E-way Bill API integration (NIC) | Compliance requirement | Accounts head confirms |
| E6 | Customer self-service portal (external) | CRM module exists | Customer portal usage data |

### Financial Enhancements (Hypothesized)

| # | Feature | Hypothesis Source | Validation Required |
|---|---|---|---|
| F1 | TDS/TCS auto-calculation | Tax compliance | Accounts head confirms |
| F2 | Bank reconciliation import | ERP standard | Finance usage patterns |
| F3 | GST return report (GSTR-1/3B) | Regulatory | Accounts head confirms |
| F4 | Automated payment reminders | Collections | Invoice aging data |

### Platform Enhancements (Hypothesized)

| # | Feature | Hypothesis Source | Validation Required |
|---|---|---|---|
| P1 | Multi-language support (Hindi) | India market | User language preference |
| P2 | Dark mode UI | Standard UX | User satisfaction survey |
| P3 | Faster dashboard (Redis caching) | Perf analysis | Load > 50 req/day |
| P4 | Print-optimized LR / delivery note | Operations | Dispatch user request |
| P5 | LDAP/SSO integration | Enterprise IT | Customer IT request |

---

## Prioritization Scoring Framework

When evidence is collected after 90 days, each backlog item will be scored:

| Dimension | Weight | Score (1–5) |
|---|---|---|
| Customer demand (# users requesting) | 30% | To be scored |
| Business impact (revenue / efficiency) | 30% | To be scored |
| Implementation effort (inverse) | 20% | To be scored |
| Risk / complexity | 20% | To be scored |

Items scoring ≥ 3.5 weighted average will be candidates for Version 2.0 sprint 1.

---

## Version 2.0 Timeline (Contingent on Gate)

| Phase | Activity | Estimated Date |
|---|---|---|
| Evidence collection | Ongoing (pilot + operations) | 2026-07-02 to 2026-10-01 |
| Gate review | All conditions checked | 2026-10-01 |
| Roadmap workshop | Prioritize with customer | 2026-10-07 |
| Version 2.0 sprint planning | Engineering capacity allocated | 2026-10-14 |
| Version 2.0 development start | If gate approved | 2026-10-14 |

---

## What Version 2.0 Must NOT Become

Based on Phase 28 instruction and production operations policy:

- ❌ Features built on hypotheses without customer demand data
- ❌ Rewrites of working modules without proven technical justification
- ❌ New AI features without AI adoption data from v1.0
- ❌ Mobile app without confirmed mobile usage demand
- ❌ Redesigns of UX without user session recordings or satisfaction scores
- ❌ Platform expansion before existing features are validated

---

## Evidence Checkpoint Dates

| Date | Evidence Collection Activity |
|---|---|
| 2026-07-08 | Week 1 satisfaction survey (9 users) |
| 2026-07-16 | 2-week operational review — first feature requests collected |
| 2026-08-01 | Month 1 retrospective — support log analyzed |
| 2026-09-01 | Month 2 retrospective — prioritization draft |
| 2026-10-01 | 90-day gate review — Version 2.0 roadmap finalized |

---

**Version 2.0 Status: 🔴 GATE NOT MET — Collection in progress. No development before 2026-10-01.**
