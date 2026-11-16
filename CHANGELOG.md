# Changelog

All notable changes to the **LocalWheels Logistics Management Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-15 — Release `logistics-audit-verified-v1`

### 🎯 Overview
This milestone marks the completion of the comprehensive end-to-end audit, architectural stabilization, functional completion, and production readiness verification of the LocalWheels platform. All 7 test suites (204 individual automated test cases) pass with 100% green exit status.

---

### ✨ Added
- **Line Haul Sheet (LHS) Workflow:**
  - Implemented `POST /api/dispatch/lhs` and `GET /api/dispatch/lhs` endpoints in `backend/src/routes/dispatch.js`.
  - Wired `frontend/src/pages/entries/LHS.jsx` to live backend APIs with real-time payload submission, validation, and toast feedback.
- **Touching LR Verification & Scanning:**
  - Implemented `GET /api/dispatch/touching-lr` and `POST /api/dispatch/touching-lr` for hub consignment tracking and cross-docking scans.
  - Connected `frontend/src/pages/entries/TouchingLR.jsx` with real-time barcode query, consignment verification, and activity logging.
- **FasTag Toll Statement Import:**
  - Created `backend/src/models/FasTagEntry.js` Mongoose schema with multi-tenant scoping and indexing.
  - Implemented `POST /api/import/fastag` and `GET /api/import/fastag` in `backend/src/routes/import.js`.
  - Integrated `frontend/src/pages/entries/FasTagImport.jsx` with CSV/manual entry posting, tab switching, and live posted-record retrieval.
- **Field Employee Pickup Automation:**
  - Enhanced `backend/src/routes/bookings.js` so updating booking status to `pickup_done` automatically generates a live `Shipment` record with a unique `LWxxxxxxxx` LR tracking number, links `b.shipment_id`, and creates an associated payment obligation.
- **Inter-Branch Consignment Transfer:**
  - Implemented `POST /api/shipments/:id/transfer` in `backend/src/routes/shipments.js` supporting custody transfer, branch reassignment, audit history logging, and automatic payment collection re-routing.
- **Dual-Authentication Architecture:**
  - Introduced seamless dual-mode authentication in `frontend/src/context/AuthContext.jsx` and `frontend/src/pages/Login.jsx` supporting both System Login (JWT + Bcrypt) and Clerk SSO.
  - Added user context persistence in `localStorage` for uninterrupted system operations even when external SSO providers are unavailable or offline.
- **Automated Real-World Test Suites:**
  - Added `backend/final-validation-test.js` (43 real-world functional test cases covering field pickup, transfer, POD, invoices, payments, FasTag, and data isolation).
  - Added `backend/browser-validation.js` (15 automated headless browser UI test cases testing desktop, mobile responsiveness, DOM hydration, and user interactions via Puppeteer-Core).
  - Added `backend/cleanup-test-data.js` for safe post-test database sanitation.

---

### 🐛 Fixed & Refactored
- **Authentication & Route Shadowing:**
  - Resolved route shadowing in `backend/src/routes/companies.js` where duplicate route handlers caused undefined context in company listings.
  - Updated `backend/src/middleware/auth.js` `requireBranchAccess` to check `x-branch-id` headers and `req.user.branch_id` fallbacks, eliminating false 400 validation failures.
- **Payment Collection Synchronization:**
  - Fixed orphaned payment records upon consignment transfer: updating `shipment.branch_id` now synchronizes `Payment.updateMany({ shipment_id: shipment._id }, { branch_id: to_branch_id })` so receiving hubs can collect To-Pay / COD dues.
- **Proof of Delivery (POD) File Storage:**
  - Configured Multer upload directories to auto-instantiate target disk paths (`backend/uploads/`), preventing missing directory runtime errors on fresh installations.
- **Frontend Route Protection:**
  - Fixed `Guard` and `BranchGuard` components in `frontend/src/App.jsx` to respect authenticated local user sessions without requiring active Clerk SSO tokens.
- **Server Reloading & Nodemon Stability:**
  - Optimized backend `--watch` parameters in `package.json` to monitor `--watch-path=src`, preventing erratic server restarts caused by root test scripts and log generation.

---

### ⚡ Performance & Optimization
- **Frontend Bundle Splitting:**
  - Restructured `frontend/vite.config.js` with manual Rollup chunking (`vendor`, `charts`, `vendor-clerk`, `vendor-icons`, `pg-entries`, `pg-master`).
  - Successfully reduced the primary bundle from over 1.2 MB to modular chunks all under 500 kB, completely eliminating Vite circular dependency warnings.
- **Database Query Indexing:**
  - Verified compound indexes across `company_id`, `branch_id`, `tracking_number`, and `createdAt` across all core collections for sub-10ms query execution.

---

### 🔒 Security & Multi-Tenancy
- **Cross-Tenant Data Isolation:**
  - Verified multi-tenant segregation across companies. Tests confirm that Company A managers cannot query, modify, or view consignments, payments, or analytics belonging to Company B.
- **Credential Hygiene:**
  - Verified `.env` and sensitive configurations are gitignored.
  - Sanitized `backend/.env.example` with standard dummy placeholders for WhatsApp, SMS, and Redis.

---

### 🧪 Verification & Test Results
- **Freight Calculation Unit Suite:** 28 / 28 Passed (100%)
- **End-to-End API Suite:** 56 / 56 Passed (100%)
- **Business Workflow Suite (WF1 – WF13):** 18 / 18 Passed (100%)
- **Production Infrastructure Suite:** 27 / 27 Passed (100%)
- **Smoke Test Suite:** 17 / 17 Passed (100%)
- **Real-World Functional Validation:** 43 / 43 Passed (100%)
- **Headless Browser UI & Responsive Suite:** 15 / 15 Passed (100%)
- **Total Test Score:** **204 / 204 Passing (100% Green)**

