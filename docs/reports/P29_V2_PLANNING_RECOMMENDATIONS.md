# LocalWheels Enterprise — Version 2.0 Planning Recommendations

**Program:** LocalWheels Enterprise v1.0 Production Execution  
**Phase:** 7 — Monthly Review (V2 Gate)  
**Date:** 2026-07-03 (initialized — not yet actionable)  
**Status:** 🔴 GATE CLOSED — Do not begin V2 until all requirements are met  

---

## Version 2.0 Gate Requirements

**CRITICAL: No V2 planning is to be executed until all 8 requirements below are satisfied.**

| # | Requirement | Target Date | Status | Evidence |
|---|-------------|-------------|--------|---------|
| 1 | Minimum 30 days production usage | 2026-08-02 | ⏳ Pending | — |
| 2 | Three pilot customers live and active | 2026-08-02 | ⏳ 0/3 | — |
| 3 | Customer acceptance signed (all 3) | 2026-08-02 | ⏳ 0/3 | — |
| 4 | Support metrics analyzed (30 days) | 2026-08-02 | ⏳ Pending | — |
| 5 | Performance metrics reviewed | 2026-08-02 | ⏳ Pending | — |
| 6 | Production bug trends analyzed | 2026-08-02 | ⏳ Pending | — |
| 7 | Feature requests prioritized from real usage | 2026-08-02 | ⏳ 0 collected | — |
| 8 | Executive approval received | 2026-08-02 | ⏳ Pending | — |

---

## Framework for V2 Planning (Activate After Gate Opens)

### Input Sources (Evidence Only)
All V2 features must be justified by one or more of these evidence sources:

1. **Customer feedback register** (`P29_CUSTOMER_FEEDBACK_ANALYSIS.md`) — directly requested features
2. **Incident register** (`P29_INCIDENT_REGISTER.md`) — patterns of production bugs
3. **Support metrics** (`P29_SUPPORT_METRICS_DASHBOARD.md`) — pain points visible in ticket categories
4. **Performance reports** — routes/features with measured latency or error problems
5. **NPS feedback** — qualitative themes from satisfied and dissatisfied customers

### What V2 Is NOT
- A list of features someone thought would be nice
- A rebuild of working V1 components
- A redesign of the data model without customer-evidence that V1 is limiting them
- An experimental technology adoption without a specific use case

---

## Known Constraints for V2 (Carry Forward from V1)

These are architectural decisions from V1 that V2 must respect or explicitly supersede with evidence:

| Constraint | Why It Was Made | V2 Consideration |
|------------|-----------------|-----------------|
| Multi-tenant by Company → Branch → User | Core business model | Maintain; no single-tenant shortcuts |
| JWT_EXPIRES_IN = 7d | Balance UX vs. security | Consider refresh token pattern if customers report frequent re-login |
| No client-side email trust (Clerk) | Security — neverTrustClientEmail | Maintain unconditionally |
| Single auth orchestrator (AuthContext) | Prevents race conditions | Maintain; proven correct |
| Rate limiting disabled in dev | Prevent dev friction | Maintain; ensure prod is always rate-limited |

---

## Potential V2 Directions (Unvalidated — Require Evidence)

*These are hypotheses only. None may be committed to until the V2 gate opens and evidence supports them.*

| Direction | Hypothesis | Evidence Needed |
|-----------|-----------|-----------------|
| Mobile app | Drivers want POD on mobile | Usage data showing driver portal usage; driver feedback |
| WhatsApp automation | Customers want booking confirmations on WhatsApp | WhatsApp feature usage rate + customer request |
| Advanced reporting | Customers need custom reports beyond built-ins | Specific reports requested × 2+ customers |
| Third-party integrations | Customers use other SaaS and want sync | Named SaaS + specific data they want synced |
| AI route optimization | Customers want cost-optimal routing | Route planning workflow usage + feedback |
| Multi-currency | Customers have cross-border shipments | Actual cross-border shipment volume in V1 |
| API access for customers | Customers want programmatic access | Specific integration request from technical customer |

---

## V2 Planning Process (When Gate Opens)

1. **Collect** — compile all evidence from 30-day pilot into a single document
2. **Categorize** — group feedback into themes
3. **Prioritize** — score by: frequency × severity × strategic value
4. **Validate** — present top 5 to pilot customers; confirm they match real pain
5. **Scope** — define V2 scope based on validated items only
6. **Gate** — executive approval before engineering work begins
7. **Plan** — sprint planning with evidence-backed user stories

---

## Version 1.0 Capabilities Summary (Baseline for V2 Scoping)

Before planning V2, understand what V1 delivers:

**Backend:** 131 API routes covering:
- Full logistics lifecycle: Leads → Quotes → Bookings → Shipments → Dispatch → POD → Invoicing → Payments
- Finance: Chart of Accounts, General Ledger, Journal, AR/AP, Financial Reports
- Fleet: Vehicles, Drivers, Maintenance, Work Orders, Fuel, Telematics
- Warehouse: Inbound, Outbound, Inventory
- CRM: Customers, Suppliers, Opportunities, Sales Orders
- Operations: Routing, Tracking, Control Tower, Driver Behavior
- AI: Chat assistant, Copilots, Decision Engine, Forecasting
- Admin: Multi-tenant, RBAC, Audit logs, Webhooks, Integrations

**Frontend:** 417 pages built

**Auth:** Dual-mode (local password + Clerk OAuth), production-certified (74/74)

---

*Gate keeper: CTO | Opens when: all 8 requirements satisfied | Do not begin V2 before then*
