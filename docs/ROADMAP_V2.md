# LocalWheels Platform — Version 2.0 Roadmap Framework
**Document Status:** Framework Only | **Date:** 2026-07-02

> ⚠️ **IMPORTANT:** This document is a planning framework, NOT a committed roadmap.
> Version 2.0 features will be finalized only after:
> 1. 4-week pilot program completion
> 2. Customer Acceptance Report analysis
> 3. Production usage analytics (60+ days)
> 4. Business ROI measurement
> 5. Executive approval
>
> **Do not begin any v2.0 development until pilot data is collected and reviewed.**

---

## Why This Framework Exists

After every major software release, it is tempting to immediately plan "what's next" based on internal assumptions. This leads to building features customers don't need.

LocalWheels v2.0 must be driven by:
- **Actual usage patterns** from v1.0 production analytics
- **Validated customer feedback** from the pilot program
- **Measured pain points** — not assumed ones
- **Business impact** — features that improve real KPIs

---

## Data Sources for v2.0 Scoping

Collect the following before making any v2.0 commitment:

### 1. Usage Analytics (MongoDB queries after 60 days)
```js
// Most-used modules
db.auditlogs.aggregate([
  { $group: { _id: "$resource", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Least-used modules (candidates for removal or improvement)
// Most common error patterns
// Peak usage hours (capacity planning)
// Average session duration by role
```

### 2. Customer Feedback (from Pilot Feedback Template)
- User satisfaction scores by module
- Bug frequency by module
- Feature requests ranked by frequency
- Workflow completion rates
- Time-to-complete each workflow

### 3. Business KPIs to Measure
- Time saved per LR booking vs manual process
- Invoice generation time reduction
- Dispatcher efficiency (trips per day)
- On-time delivery improvement
- Complaint resolution time change
- Finance reconciliation time reduction

### 4. Support Ticket Analysis
- Most common support issues → product improvement opportunities
- Categories of escalations → training vs product gaps
- P1/P2 incident patterns

---

## Candidate Feature Areas (Unvalidated)

The following are hypotheses only. Each must be validated against pilot data before inclusion in v2.0 scope.

### A — Mobile App Enhancement (Hypothesis: drivers want native app)
- **Hypothesis:** Web-based driver interface has friction on mobile
- **Validate with:** Driver satisfaction scores, mobile session data
- **Effort:** High (native iOS + Android development)

### B — Multi-Currency Support (Hypothesis: cross-border customers)
- **Hypothesis:** Customers with international operations need INR + USD + EUR
- **Validate with:** Customer profile data, billing complexity feedback
- **Effort:** Medium

### C — Customer Self-Service LR Booking (Hypothesis: reduces dispatcher load)
- **Hypothesis:** Customers want to book their own shipments
- **Validate with:** Dispatcher workload data, customer portal usage
- **Effort:** Medium

### D — Advanced Analytics / Custom Dashboards (Hypothesis: executives want more)
- **Hypothesis:** Executive dashboard lacks customization
- **Validate with:** Executive module usage frequency, feedback
- **Effort:** Medium

### E — Dynamic Pricing Engine (Hypothesis: manual pricing is slow)
- **Hypothesis:** Dispatchers spend significant time on custom pricing
- **Validate with:** Quote creation time, pricing override frequency
- **Effort:** High

### F — Multi-Company / Franchise Management (Hypothesis: growth)
- **Hypothesis:** Customers want to manage group companies under one login
- **Validate with:** Company creation requests, enterprise customer size
- **Effort:** Very High (fundamental architecture change)

### G — WhatsApp Two-Way Bot (Hypothesis: customers want to track via chat)
- **Hypothesis:** Customer portal underused; WhatsApp preferred
- **Validate with:** Customer portal session data, WhatsApp message volumes
- **Effort:** Medium

### H — Marketplace / Partner Network (Hypothesis: load exchange)
- **Hypothesis:** Transporters want access to spot freight loads
- **Validate with:** Market research, customer interviews
- **Effort:** Very High (new business model)

---

## v2.0 Scoping Process

After pilot completion (target: Week 6 from go-live):

1. **Data Collection** (Week 5–6)
   - Pull all analytics queries above
   - Compile pilot feedback reports
   - Aggregate support tickets by category

2. **Analysis Workshop** (Week 7)
   - Product + Engineering + Sales + Support
   - Score each candidate: Impact × Frequency ÷ Effort
   - Eliminate hypotheses not supported by data

3. **Customer Interviews** (Week 7–8)
   - 1-hour call with each pilot company's primary user
   - Validate top 5 feature requests from data

4. **v2.0 Scope Document** (Week 8)
   - Prioritized list of validated features
   - Estimated effort per feature
   - MVP scope for v2.0

5. **Executive Approval** (Week 9)
   - Business case presentation
   - Resource allocation
   - Timeline commitment

6. **v2.0 Kickoff** (Week 10 or later)
   - Only after all above steps complete

---

## What NOT to Do

- ❌ Do not add features based on what competitors have
- ❌ Do not add features because they seem technically interesting
- ❌ Do not promise customers features before they are in scope
- ❌ Do not scope v2.0 before collecting 60 days of production data
- ❌ Do not implement features for assumed use cases

---

## Version History

| Version | Date | Status | Scope Source |
|---------|------|--------|-------------|
| 1.0 | 2026-07-02 | GA Released | Internal product vision (Phases 1–22) |
| 2.0 | TBD | Planning | Pilot data + customer feedback (target: Q4 2026) |
