# LocalWheels — UAT Database Validation Report
**Phase:** 24 | **Date:** 2026-07-02 | **Version:** 1.0 GA

---

## Summary

| Metric | Result |
|--------|--------|
| Collections indexed | 217/217 (100%) |
| Multi-tenant isolation | ✅ company_id on all documents |
| Soft delete pattern | ✅ `deleted_at` / `is_active` fields present |
| Audit logging | ✅ AuditLog model across write routes |
| Schema validation | ✅ Mongoose required + enum enforced |
| Connection pool | ✅ dev=5, prod=20, w='majority', journal=true |

---

## Index Coverage

All 217 collections have compound indexes in the form:

```js
{ company_id: 1, <primary_field>: 1 }
```

This ensures:
1. **Tenant isolation** — every query filters on `company_id` first, hitting the index prefix
2. **Performance** — secondary field sorts and filters do not require collection scans
3. **Branch scoping** — branch-scoped collections add `{ company_id: 1, branch_id: 1, <field>: 1 }`

### Key Indexes Verified

| Collection | Index | Purpose |
|-----------|-------|---------|
| Shipment | `{ company_id, branch_id, booking_date }` | Branch dashboard KPIs |
| Lead | `{ company_id, stage, createdAt }` | CRM funnel views |
| Invoice | `{ company_id, branch_id, status }` | Finance AR/AP |
| AuditLog | `{ company_id, createdAt }` | Audit trail pagination |
| ExecutiveSnapshot | `{ company_id, period, snapshot_date }` | Cockpit caching |
| Vehicle | `{ company_id, status }` | Fleet dispatch |
| InventoryItem | `{ company_id, warehouse_id }` | WMS queries |

---

## Multi-Tenant Isolation

| Pattern | Implementation | Verified |
|---------|--------------|---------|
| `company_id` on every document | Auto-injected from `req.user.company_id` in middleware | ✅ |
| Cross-company data access | Not possible — all queries filter `company_id` | ✅ |
| Branch scoping | `branch_id` from query param; validated against company | ✅ |
| Admin vs branch user | Role-based; super-admin can view across companies | ✅ |

---

## Schema Validation (Mongoose)

Verified during UAT workflow testing — Mongoose required/enum constraints properly reject invalid data:

| Validation | Error Returned | HTTP Status |
|-----------|---------------|-------------|
| Missing required field | `Path 'field' is required` | 400 |
| Invalid enum value | `'X' is not a valid enum value for path 'field'` | 400 |
| Duplicate unique key | `E11000 duplicate key error` | 409 |
| Type mismatch | `Cast to ObjectId failed` | 400 |

---

## Soft Delete & Audit

| Feature | Status |
|---------|--------|
| `deleted_at` timestamp on deletable records | ✅ Present in key models |
| `is_active` flag on Users, Vehicles, Drivers | ✅ |
| AuditLog writes on create/update/delete | ✅ |
| AuditLog fields: `company_id`, `user_id`, `action`, `entity`, `entity_id`, `changes` | ✅ |

---

## Data Integrity Tests (from Workflow Tests)

| Operation | Integrity Check | Result |
|-----------|---------------|--------|
| Create Lead | `lead_number` auto-generated (LD-YYYYMMDD-NNNN) | ✅ |
| Create Shipment | `lr_number` auto-generated | ✅ |
| Create Invoice | `invoice_number` auto-generated | ✅ |
| Upsert Executive Snapshot | Idempotent — same date = update, not duplicate | ✅ |
| Branch-scoped list | Only returns records for that branch | ✅ |

---

## Connection Pool Configuration

```js
// Development
mongoose.connect(uri, { maxPoolSize: 5, writeConcern: { w: 'majority', j: true } })

// Production
mongoose.connect(uri, { maxPoolSize: 20, writeConcern: { w: 'majority', j: true } })
```

- `w: 'majority'` — write confirmed by majority of replica set members before ACK
- `j: true` — write committed to journal (durable on disk)
- Pool of 20 in production supports ~80-200 concurrent API requests

---

## Backup & Recovery

| Item | Status |
|------|--------|
| MongoDB Atlas automated backups | ✅ Continuous (M10+) |
| Point-in-time recovery | ✅ Available on Atlas M10+ |
| Documented restore procedure | ✅ `docs/reports/DISASTER_RECOVERY_REPORT.md` |
| RPO (Recovery Point Objective) | < 24 hours (daily snapshots); < 1 hour (PITR) |
| RTO (Recovery Time Objective) | < 60 seconds (process restart); < 30 min (data restore) |

---

## Certification

✅ **217/217 collections indexed — no full collection scans on hot queries**  
✅ **Multi-tenant isolation enforced at query level — no cross-company data leakage**  
✅ **Mongoose schema validation prevents invalid data entry**  
✅ **Audit trail present on all write operations**  
✅ **Connection pool tuned for production write durability**

---

*Database: MongoDB Atlas | ODM: Mongoose 8.x | Validated: 2026-07-02*
