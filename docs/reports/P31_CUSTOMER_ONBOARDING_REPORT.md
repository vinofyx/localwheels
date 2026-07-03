# Customer Onboarding Report
## LocalWheels Enterprise v1.0 — Phase 31

**Date:** 2026-07-03  
**Customer:** Rajdhani Cargo Services Pvt Ltd  
**Onboarding Method:** `backend/src/db/seed-production.js`  
**Status:** ✅ Seed script validated | ⏳ Awaiting live VPS deployment

---

## Onboarding Summary

| Step | Method | Status |
|------|--------|--------|
| Company creation | seed-production.js | ✅ Script ready (idempotent) |
| Branch setup | seed-production.js | ✅ 2 branches configured |
| Admin user | seed-production.js | ✅ Script ready |
| Master data import | Manual via dashboard | ⏳ Post go-live |
| Customer login test | Browser | ⏳ Post go-live |
| Workflow walkthrough | Customer call | ⏳ Post go-live |

---

## Phase 1 — Company Seed

**Command to run on live VPS:**

```bash
cd /var/www/localwheels

# Ensure .env has SEED_* vars set
grep SEED_ backend/.env

# Run idempotent seed script
node backend/src/db/seed-production.js

# Expected output:
# ✅ MongoDB connected
# ✅ Company created: <ObjectId>
# ✅ Branch created: HEAD OFFICE (<ObjectId>)
# ✅ Branch created: BRANCH 1 (<ObjectId>)
# ✅ Admin user created: rajdhani_admin
# 
# 📋 Onboarding Summary
#    Company ID : <id>
#    Branches   : 2
#    Admin user : rajdhani_admin
#    Login URL  : https://app.yourdomain.com/login
```

**Seed configuration** (`backend/src/db/seed-production.js`):
- Idempotent: safe to run multiple times (skips existing records)
- Validates password strength (min 12 chars)
- Creates: 1 company → 2 branches → 1 admin user

---

## Phase 2 — Master Data Import

After the seed script, the customer's admin logs in and imports master data via the dashboard.

### Customers

| Import Method | Route | Notes |
|--------------|-------|-------|
| Dashboard → CRM → Customers → Add | `POST /api/customers` | One by one or bulk |
| Required fields | `name`, `phone`, `customer_type` | |

**Priority imports:**
1. Top 10 active customers (active shipments)
2. Top 5 key accounts (high-value contracts)
3. Remaining customers (within first week)

### Vehicles

| Field | Example |
|-------|---------|
| `registration_number` | `TS09AB1234` |
| `vehicle_type` | `truck` / `mini_truck` / `tempo` |
| `load_type` | `full_load` / `part_load` |
| `capacity_tons` | `5` |
| `make` | `TATA` |
| `model` | `LPT 1109` |
| `year` | `2022` |

### Drivers

| Field | Example |
|-------|---------|
| `name` | Full name |
| `phone` | Mobile number |
| `license_number` | DL number |
| `license_expiry` | ISO date |

### Chart of Accounts

The system includes default chart of accounts. The customer should:
1. Review default accounts (`GET /api/chart-of-accounts`)
2. Add company-specific accounts if needed
3. Confirm opening balances

---

## Phase 3 — Post-Onboarding Validation

After the customer logs in and imports initial master data:

```bash
# Verify company is in database
node -e "
require('dotenv').config({ path: '/var/www/localwheels/backend/.env' });
const mongoose = require('./backend/node_modules/mongoose');
const Company = require('./backend/src/models/Company');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const c = await Company.findOne({ name: process.env.SEED_COMPANY_NAME });
  console.log('Company:', c?._id, c?.name, c?.active);
  await mongoose.disconnect();
});
"

# Run production validation with customer admin credentials
node backend/production-validate.js https://api.yourdomain.com rajdhani_admin "<password>"
# Expected: 27/27 ALL CLEAR
```

---

## Onboarding Checklist

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Seed script executed on live VPS | Engineering | ⏳ |
| 2 | Company ID recorded | Engineering | ⏳ |
| 3 | Admin login tested in browser | Engineering | ⏳ |
| 4 | Login URL shared with customer | Engineering | ⏳ |
| 5 | Credentials delivered securely | Engineering | ⏳ |
| 6 | Welcome call scheduled | Engineering | ⏳ |
| 7 | Training session completed | Engineering | ⏳ |
| 8 | Top 10 customers imported | Customer | ⏳ |
| 9 | All vehicles imported | Customer | ⏳ |
| 10 | All drivers imported | Customer | ⏳ |
| 11 | Chart of accounts reviewed | Customer | ⏳ |
| 12 | First booking created | Customer | ⏳ |
| 13 | First invoice generated | Customer | ⏳ |
| 14 | Dashboard reviewed | Customer | ⏳ |
| 15 | SEED_* vars removed from .env | Engineering | ⏳ |

---

## Customer Training Plan

| Session | Topics | Duration | Format |
|---------|--------|----------|--------|
| 1 — Login & Navigation | Login, branches, dashboard tour | 30 min | Video call |
| 2 — Operations | Leads, quotes, bookings, shipments | 60 min | Screen share |
| 3 — Finance | Invoices, payments, reports | 45 min | Screen share |
| 4 — Fleet | Vehicles, drivers, maintenance | 30 min | Screen share |
| 5 — Reports | Executive dashboard, analytics | 30 min | Screen share |

---

## Onboarding Completion Criteria

All of the following must be true before onboarding is marked complete:

- ✅ Admin can log in and access dashboard
- ✅ At least 1 customer imported
- ✅ At least 1 vehicle imported
- ✅ At least 1 driver imported
- ✅ First complete booking → shipment → invoice cycle completed
- ✅ Executive dashboard shows live data
- ✅ Customer confirms system is usable

---

**Onboarding contact:** vinofyx@gmail.com  
**Customer contact:** _(fill in)_  
**Target onboarding date:** _(fill in — within 3 days of go-live)_
