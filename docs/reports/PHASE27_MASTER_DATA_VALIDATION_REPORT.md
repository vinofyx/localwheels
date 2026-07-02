# Phase 27 — Master Data Validation Report
**LocalWheels Enterprise Platform v1.0**
**Date:** 2026-07-02

---

## Overview

Validates that the master data seeded during tenant initialization is complete, correct, and sufficient for a new company to begin operations.

---

## Vehicle Types (10 records)

| Code | Name | Capacity (tons) |
|---|---|---|
| MINI | Mini Truck | 1.5 |
| SMALL | Small Truck | 3 |
| MED | Medium Truck | 7 |
| LARGE | Large Truck | 14 |
| TRAIL | Trailer | 25 |
| CNT20 | Container (20ft) | 20 |
| CNT40 | Container (40ft) | 28 |
| VAN | Pickup Van | 0.75 |
| 2W | Two Wheeler | 0.1 |
| AUTO | Auto Rickshaw | 0.25 |

**Coverage:** Full range from last-mile delivery (two-wheeler) to long-haul (container). ✅

---

## Shipment Types (8 records)

| Code | Name |
|---|---|
| FTL | Full Truck Load |
| LTL | Less Than Truck Load |
| PTL | Part Truck Load |
| EXP | Express Delivery |
| D2D | Door to Door |
| P2P | Port to Port |
| AIR | Air Freight |
| RAIL | Rail Freight |

**Coverage:** All standard Indian logistics shipment modes. ✅

---

## Package Types (9 records)

Box/Carton, Bag/Sack, Pallet, Drum/Barrel, Bundle, Roll/Coil, Loose, Crate, Container.  
**Coverage:** All standard cargo packaging forms used in Indian logistics. ✅

---

## Complaint Categories (10 records)

Delivery Delay, Damaged Goods, Lost Shipment, Incorrect Delivery, Billing Issue, Driver Behavior, Documentation Issue, Overcharging, Tracking Issue, Other.  
**Coverage:** Covers all typical logistics complaint scenarios. ✅

---

## Document Types (10 records)

LR, Delivery Note, Invoice, E-Way Bill, POD, Loading Sheet, Vehicle RC, Driver License, Insurance Certificate, GST Invoice.  
**Coverage:** All standard logistics documents required for compliance. ✅

---

## Tax Slabs (5 records)

| Code | Rate | CGST | SGST | IGST |
|---|---|---|---|---|
| GST0 | 0% | 0% | 0% | 0% |
| GST5 | 5% | 2.5% | 2.5% | 5% |
| GST12 | 12% | 6% | 6% | 12% |
| GST18 | 18% | 9% | 9% | 18% (default) |
| GST28 | 28% | 14% | 14% | 28% |

**Coverage:** Complete Indian GST rate structure. 18% marked as default for logistics services. ✅

---

## Departments (8 records)

Operations, Sales & Marketing, Finance & Accounts, Human Resources, Fleet Management, Customer Service, IT & Systems, Warehouse.  
**Coverage:** Standard logistics company department structure. ✅

---

## Chart of Accounts (42 accounts)

### Structure Overview

| Type | Accounts | Codes |
|---|---|---|
| Assets | 10 | 1000–1520 |
| Liabilities | 8 | 2000–2400 |
| Equity | 3 | 3000–3200 |
| Revenue | 6 | 4000–4300 |
| Expenses | 15 | 5000–6700 |
| **Total** | **42** | |

### Key Accounts

**Assets:** Current Assets, Cash in Hand, Petty Cash, Bank Accounts, Accounts Receivable, Advances Paid, Vehicles, Office Equipment

**Liabilities:** Accounts Payable, CGST/SGST/IGST Payable, TDS Payable, Advances Received

**Revenue:** Freight Income (Local/Outstation), Hire Income, Other Income

**Expenses:** Fuel, Driver Salary, Vehicle Maintenance, Toll & Highway, Loading/Unloading, Office Rent, Staff Salaries, Insurance, Depreciation, Bank Charges

**Coverage:** Complete standard chart of accounts for a mid-size Indian logistics company. ✅

---

## Notification Templates (9 records)

| Event | Channel | Template Name |
|---|---|---|
| shipment_created | SMS | Shipment Created SMS |
| shipment_created | Email | Shipment Booking Confirmation |
| shipment_created | WhatsApp | Shipment Created WhatsApp |
| shipment_delivered | SMS | Delivery Confirmation SMS |
| shipment_delivered | Email | Delivery Confirmation Email |
| invoice_generated | Email | Invoice Email |
| payment_received | SMS | Payment Receipt SMS |
| complaint_raised | Email | Complaint Acknowledgement |
| eway_expiring | In-App | E-Way Bill Expiry Alert |

All templates use `{{variable}}` tokens for dynamic substitution: `{{customer_name}}`, `{{lr_number}}`, `{{tracking_url}}`, etc.  
**Coverage:** All key business events covered across Email, SMS, WhatsApp, and In-App channels. ✅

---

## App Settings (1 record)

Default notification rule configuration:

| Event | Email | SMS | WhatsApp |
|---|---|---|---|
| Shipment Created | ✅ | ✅ | ❌ |
| Shipment Delivered | ✅ | ✅ | ❌ |
| Invoice Generated | ✅ | ❌ | ❌ |
| Payment Received | ✅ | ✅ | ❌ |
| Complaint Raised | ✅ | ❌ | ❌ |
| E-Way Expiring | ✅ | ✅ | ❌ |

WhatsApp disabled by default (requires WhatsApp Business API setup). Admin can enable from Settings.

Operational defaults:
- Payment terms: 30 days
- GST rate: 18%
- Invoice prefix: `INV`
- LR prefix: `LR`
- Require POD before invoice: Yes (best practice default)

---

## Validation Summary

| Category | Records | Status |
|---|---|---|
| Vehicle Types | 10 | ✅ Seeded |
| Shipment Types | 8 | ✅ Seeded |
| Package Types | 9 | ✅ Seeded |
| Complaint Categories | 10 | ✅ Seeded |
| Document Types | 10 | ✅ Seeded |
| Warehouse Types | 5 | ✅ Seeded |
| Departments | 8 | ✅ Seeded |
| Tax Slabs | 5 | ✅ Seeded |
| Chart of Accounts | 42 | ✅ Seeded |
| Notification Templates | 9 | ✅ Seeded |
| App Settings | 1 | ✅ Seeded |
| **Total** | **117** | **✅ All Verified** |

**Master Data Validation: COMPLETE ✅**
