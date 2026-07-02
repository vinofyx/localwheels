# Master Data Import Report
**Phase 27b — First Enterprise Customer Onboarding**
**Customer:** Rajdhani Cargo Services Pvt Ltd
**Date:** 2026-07-02

---

## Overview

All master data for Rajdhani Cargo Services Pvt Ltd was imported through the production onboarding script (`backend/src/scripts/onboard-first-customer.js`). This report documents the import results for every entity type.

---

## Auto-Seeded Configuration (Tenant Initialization)

The following records were automatically created when the company was provisioned via `POST /api/companies`. No manual import was required.

| Category | Count | Method |
|---|---|---|
| Vehicle Types | 10 | Auto-seeded (MasterConfig) |
| Shipment Types | 8 | Auto-seeded (MasterConfig) |
| Package Types | 9 | Auto-seeded (MasterConfig) |
| Complaint Categories | 10 | Auto-seeded (MasterConfig) |
| Document Types | 10 | Auto-seeded (MasterConfig) |
| Warehouse Types | 5 | Auto-seeded (MasterConfig) |
| Departments | 8 | Auto-seeded (MasterConfig) |
| Tax Slabs | 5 | Auto-seeded (MasterConfig) |
| Chart of Accounts | 42 | Auto-seeded (ChartOfAccount) |
| Notification Templates | 9 | Auto-seeded (NotificationTemplate) |
| App Settings | 1 | Auto-seeded (AppSettings) |
| **Total** | **117** | |

---

## Customer Master Import

**Target Branch:** Delhi Head Office (6a46876adbb074ca5f6f7e23)
**Import Method:** Direct MongoDB insert (production onboarding script)

| # | Customer Name | City | State | Phone | GST | Credit Limit | Status |
|---|---|---|---|---|---|---|---|
| 1 | Bharat Electronics Ltd | New Delhi | Delhi | 9811001001 | 07AABCB1234A1Z9 | ₹5,00,000 | ✅ Imported |
| 2 | National Textiles Corp | Mumbai | Maharashtra | 9822001002 | 27AABCN5678B2Z8 | ₹3,00,000 | ✅ Imported |
| 3 | South India Pharma Ltd | Bengaluru | Karnataka | 9845001003 | 29AABCS9012C3Z7 | ₹4,00,000 | ✅ Imported |
| 4 | Punjab Agro Industries | Ludhiana | Punjab | 9815001004 | 03AABCP3456D4Z6 | ₹2,00,000 | ✅ Imported |
| 5 | Gujarat Steel Works | Ahmedabad | Gujarat | 9824001005 | 24AABCG7890E5Z5 | ₹7,50,000 | ✅ Imported |
| 6 | Chennai Auto Parts | Chennai | Tamil Nadu | 9844001006 | 33AABCC2345F6Z4 | ₹2,50,000 | ✅ Imported |
| 7 | Kolkata Jute Mills | Kolkata | West Bengal | 9833001007 | 19AABCK6789G7Z3 | ₹1,80,000 | ✅ Imported |
| 8 | Hyderabad Ceramics Ltd | Hyderabad | Telangana | 9849001008 | 36AABCH1234H8Z2 | ₹3,20,000 | ✅ Imported |
| 9 | Rajasthan Marble Exports | Jaipur | Rajasthan | 9829001009 | 08AABCR5678I9Z1 | ₹1,50,000 | ✅ Imported |
| 10 | Odisha Minerals Corp | Bhubaneswar | Odisha | 9861001010 | 21AABCO9012J1Z9 | ₹6,00,000 | ✅ Imported |
| 11 | UP Fertilizers Ltd | Kanpur | Uttar Pradesh | 9839001011 | 09AABCU3456K2Z8 | ₹2,80,000 | ✅ Imported |
| 12 | Bihar Food Industries | Patna | Bihar | 9835001012 | 10AABCB7890L3Z7 | ₹1,20,000 | ✅ Imported |

**Summary:**
- Total Attempted: 12
- Imported: 12
- Skipped (duplicates): 0
- Errors: 0

---

## Vehicle Fleet Import

**Target Branch:** Assigned per vehicle home location
**Import Method:** Direct MongoDB insert

| # | Registration | Type | Make & Model | Capacity | Branch | Status |
|---|---|---|---|---|---|---|
| 1 | DL01AB1001 | Large Truck | Tata LPT 1615 | 14 T | Delhi HQ | ✅ |
| 2 | DL01AB1002 | Large Truck | Ashok Leyland 1615 | 14 T | Delhi HQ | ✅ |
| 3 | DL01AB1003 | Medium Truck | Tata 1109 | 7 T | Delhi HQ | ✅ |
| 4 | DL01AB1004 | Medium Truck | Mahindra Blazo | 7 T | Delhi HQ | ✅ |
| 5 | DL01CD2001 | Trailer | Volvo FH | 25 T | Delhi HQ | ✅ |
| 6 | DL01CD2002 | Trailer | Tata Signa 4025 | 25 T | Delhi HQ | ✅ |
| 7 | MH01EF3001 | Container 20ft | Eicher Pro 6031 | 20 T | Mumbai | ✅ |
| 8 | MH01EF3002 | Small Truck | Tata 407 | 3 T | Mumbai | ✅ |
| 9 | MH01EF3003 | Mini Truck | Tata Ace HT | 1.5 T | Mumbai | ✅ |
| 10 | KA01GH4001 | Large Truck | Bharat Benz 1217 | 12 T | Bengaluru | ✅ |
| 11 | KA01GH4002 | Medium Truck | Tata LPT 709 | 6 T | Bengaluru | ✅ |
| 12 | KA01GH4003 | Mini Truck | Mahindra Jeeto | 1.5 T | Bengaluru | ✅ |

**Fleet Capacity by Type:**

| Type | Count | Total Capacity |
|---|---|---|
| Trailers | 2 | 50 T |
| Large Trucks | 3 | 40 T |
| Container | 1 | 20 T |
| Medium Trucks | 3 | 20 T |
| Small Trucks | 1 | 3 T |
| Mini Trucks | 2 | 3 T |
| **Total** | **12** | **136 T** |

**Summary:** 12 imported / 0 skipped / 0 errors

---

## Driver Roster Import

**Target Branch:** Delhi Head Office
**Import Method:** Direct MongoDB insert

| # | Name | Phone | License No. | Expiry | Status |
|---|---|---|---|---|---|
| 1 | Raju Kumar Singh | 9811101001 | DL0119850001234 | 2027-03-31 | ✅ |
| 2 | Mohan Lal Sharma | 9811101002 | DL0120001234567 | 2028-06-30 | ✅ |
| 3 | Suresh Prasad | 9811101003 | HR0119951234567 | 2026-12-31 | ✅ |
| 4 | Ramesh Yadav | 9811101004 | UP0119901234567 | 2027-09-30 | ✅ |
| 5 | Dinesh Chandra | 9811101005 | RJ0120051234567 | 2029-03-31 | ✅ |
| 6 | Ajay Thakur | 9822201001 | MH0120001234567 | 2028-12-31 | ✅ |
| 7 | Vijay Patil | 9822201002 | MH0119951234567 | 2026-09-30 | ✅ |
| 8 | Sanjay Kumar | 9845301001 | KA0120051234567 | 2029-06-30 | ✅ |
| 9 | Gopal Reddy | 9845301002 | AP0120001234567 | 2028-03-31 | ✅ |
| 10 | Bhaskar Rao | 9845301003 | KA0119951234567 | 2027-06-30 | ✅ |

**License Expiry Risk:**
- Within 6 months (by Jan 2027): 2 drivers (Suresh Prasad, Vijay Patil) — action required
- 6–12 months: 0
- Beyond 12 months: 8 drivers

**Summary:** 10 imported / 0 skipped / 0 errors

---

## Branch and User Import

| Type | Created | Details |
|---|---|---|
| Branches | 3 | Delhi HQ, Mumbai, Bengaluru |
| Admin Users | 1 | rajdhani_admin |
| Manager Users | 4 | delhi_dispatch, accounts_head, sales_mgr, fleet_mgr |
| Staff Users | 4 | mumbai_ops, blr_ops, warehouse_mgr, customer_svc |
| **Total Users** | **9** | |

---

## Import Summary

| Entity | Attempted | Imported | Skipped | Errors |
|---|---|---|---|---|
| Auto-seeded config | 117 | 117 | 0 | 0 |
| Customers | 12 | 12 | 0 | 0 |
| Vehicles | 12 | 12 | 0 | 0 |
| Drivers | 10 | 10 | 0 | 0 |
| Users | 9 | 9 | 0 | 0 |
| Branches | 3 | 3 | 0 | 0 |
| **Total** | **163** | **163** | **0** | **0** |

**Master Data Import: 100% SUCCESS — 163/163 records ✅**
