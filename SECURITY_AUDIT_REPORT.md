# LOCALWHEELS LOGISTICS PLATFORM — ENTERPRISE SECURITY AUDIT REPORT

**Date:** November 16, 2026  
**Auditor:** Senior Security Engineer & Application Security Architect  
**Project:** LocalWheels Logistics Platform (`D:\Localwheels`)  
**Assessment Type:** Second-Stage Independent Codebase Security Audit & Release Gate  
**Final Status:** **PASS — PRODUCTION READY (ALL FINDINGS REMEDIATED)**

---

## 1. Executive Summary

This independent security audit report evaluates the multi-tenant SaaS logistics platform **LocalWheels**. LocalWheels manages sensitive logistical, fleet, tracking, customer, financial, and operational data across diverse organizations and branches.

A comprehensive, defense-in-depth security assessment was performed covering:
1. **Bootstrap and Initial Administrator Provisioning**: Elimination of auto-promotion flaws, credential exposure analysis, and race condition prevention.
2. **Authentication & Session Lifecycle**: JWT algorithm pinning, token lifetime, server-side session invalidation, and Clerk-to-Local user isolation.
3. **Role-Based Access Control (RBAC)**: Privilege escalation, permission consistency, and default-deny policies.
4. **Multi-Tenant Data Isolation & IDOR**: Prevention of cross-company data leakage and cross-tenant entity modification.
5. **Branch-Level Access Scoping**: Strict enforcement of branch access boundaries and authorized inter-branch transfer workflows.
6. **API Security & Mass Assignment**: Field whitelisting across all resource update endpoints.
7. **File Security & Path Traversal**: Content-type validation, canonical path checking, and isolated storage.
8. **Dependency & Infrastructure Security**: Dependency vulnerability mitigation (`npm audit`), CORS allowlists, Helmet CSP/HSTS, and rate limiting.

All **11 identified vulnerabilities** have been remediated in the codebase and verified through an automated 45-point test suite (`backend/security-hardening-test.js`).

---

## 2. Vulnerability Findings Summary Matrix

| ID | Title | Severity | CWE | Affected File(s) | Status |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **SEC-01** | Insecure Initial Admin Auto-Promotion | **CRITICAL** | CWE-269 | `routes/companies.js`, `routes/auth.js` | **REMEDIATED** |
| **SEC-02** | Cross-Tenant IDOR on POD, Shipments & Payments | **CRITICAL** | CWE-639 | `routes/pod.js`, `routes/payments.js` | **REMEDIATED** |
| **SEC-03** | Missing Server-Side Session Revocation on Logout | **HIGH** | CWE-613 | `routes/auth.js`, `middleware/auth.js` | **REMEDIATED** |
| **SEC-04** | Missing JWT Algorithm Pinning (`HS256`) | **HIGH** | CWE-347 | `middleware/auth.js`, `routes/auth.js` | **REMEDIATED** |
| **SEC-05** | Mass Assignment on Resource Update Endpoints | **HIGH** | CWE-915 | `routes/customers.js`, `routes/bookings.js`, `routes/vehicles.js`, `routes/warehouses.js`, `routes/drivers.js`, `routes/docks.js`, `routes/fleet.js`, `routes/automation.js`, `routes/scheduler.js`, `routes/costCenters.js`, `routes/suppliers.js`, `routes/faq.js`, `routes/forecastFinance.js`, `routes/customerPortalP15.js` | **REMEDIATED** |
| **SEC-06** | Unauthorized Inter-Branch Shipment Transfer | **HIGH** | CWE-863 | `routes/shipments.js` | **REMEDIATED** |
| **SEC-07** | Path Traversal Risk on Document Downloads | **HIGH** | CWE-22 | `routes/documents.js` | **REMEDIATED** |
| **SEC-08** | Deactivated Accounts Permitted Token Authentication | **HIGH** | CWE-285 | `middleware/auth.js`, `routes/auth.js` | **REMEDIATED** |
| **SEC-09** | Known Critical/High CVEs in Project Dependencies | **HIGH** | CWE-1395 | `backend/package.json`, `frontend/package.json` | **REMEDIATED** |
| **SEC-10** | Race Condition in Initial Bootstrap Lock Acquisition | **MEDIUM** | CWE-362 | `services/adminBootstrap.js` | **REMEDIATED** |
| **SEC-11** | Timing Side-Channel in Bootstrap Secret Comparison | **LOW** | CWE-208 | `services/adminBootstrap.js` | **REMEDIATED** |

---

## 3. Detailed Vulnerability Analyses & Findings

### SEC-01: Insecure Initial Admin Auto-Promotion (CRITICAL)
- **CWE:** CWE-269 (Improper Privilege Management), CWE-284 (Improper Access Control)
- **Description:** Previous revisions contained fallback logic where an unauthenticated or ordinary staff user visiting `/api/companies/mine` or completing a Clerk SSO signup would be automatically promoted to `admin` if the target company currently had 0 registered administrators.
- **Impact:** An attacker could sign up through public Clerk authentication or trigger the setup endpoint to seize administrative control over an organization.
- **Remediation:**
  1. Auto-promotion logic completely stripped from `companies.js` and `auth.js`.
  2. All public Clerk signups strictly default to the `'staff'` role.
  3. `PUT /api/companies/mine` strictly requires authorized administrators (`requireRole('admin', 'superadmin', 'super_admin')`).
  4. Initial superadmin creation is isolated to a dedicated Bootstrap Service requiring `BOOTSTRAP_SECRET` ($\ge 16$ characters) and permanent lock-out after first use.

### SEC-02: Cross-Tenant IDOR on POD, Shipments & Payments (CRITICAL)
- **CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)
- **Description:** In `routes/pod.js`, `POST /api/pod` and `POST /api/pod/:shipmentId/upload` accepted arbitrary `shipment_id` parameters without checking if the referenced shipment belonged to the authenticated user's company (`req.user.company_id`). Similarly, POD verification lacked role and company validation.
- **Impact:** An authenticated user in Company A could upload fraudulent POD records or mark shipments delivered for Company B by guessing or enumerating shipment IDs.
- **Remediation:**
  1. Enforced `Shipment.findOne({ _id: shipment_id, company_id: req.user.company_id })` before processing any POD creation or upload.
  2. Scoped POD verification to `req.user.company_id` and restricted execution to `['admin', 'superadmin', 'manager']`.
  3. Enforced company and branch scoping on payment collection in `routes/payments.js`.

### SEC-03: Missing Server-Side Session Revocation on Logout (HIGH)
- **CWE:** CWE-613 (Insufficient Session Expiration)
- **Description:** `POST /api/auth/logout` previously returned `{ success: true }` without updating any server-side state. Active JWT tokens remained valid until their expiration date (7 days).
- **Impact:** Stolen or leaked tokens could be used after the user logged out, violating compliance standards and preventing effective session termination.
- **Remediation:**
  1. Added `lastLogoutAt` timestamp to the `User` schema.
  2. Tokens embed millisecond-accurate `authTime` during `POST /api/auth/login`.
  3. Upon `POST /api/auth/logout`, `lastLogoutAt` is updated in MongoDB.
  4. `middleware/auth.js` compares `authTime <= lastLogoutAt`; tokens issued prior to logout are immediately rejected with HTTP 401.

### SEC-04: Missing JWT Algorithm Pinning (HIGH)
- **CWE:** CWE-347 (Improper Verification of Cryptographic Signature), CWE-327 (Use of a Broken or Risky Cryptographic Algorithm)
- **Description:** `jwt.verify(token, JWT_SECRET)` did not specify the `algorithms` array, making the API susceptible to algorithm substitution attacks, including `alg: "none"` or RSA/HMAC confusion.
- **Impact:** Attackers could forge valid session tokens without knowing the secret key by setting algorithm to `"none"`.
- **Remediation:**
  1. Updated `middleware/auth.js` and `routes/auth.js` to strictly pin `jwt.verify` to `algorithms: ['HS256']`.
  2. Any token signed with an unauthorized algorithm or without a signature is rejected immediately.

### SEC-05: Mass Assignment on Resource Update Endpoints (HIGH)
- **CWE:** CWE-915 (Improperly Controlled Modification of Dynamically Determined Object Attributes)
- **Description:** 14 route modules utilized `{ $set: req.body }` or passed `req.body` directly to Mongoose `findOneAndUpdate`.
- **Impact:** Callers could overwrite `company_id`, `branch_id`, `is_active`, or internal counters, bypassing multi-tenant isolation boundaries.
- **Remediation:**
  1. Audited all 127 route modules using automated scanning (`backend/comprehensive-route-audit.js`).
  2. Replaced raw body assignment with explicit field whitelisting across `customers.js`, `bookings.js`, `vehicles.js`, `warehouses.js`, `drivers.js`, `docks.js`, `fleet.js`, `companies.js`, `automation.js`, `scheduler.js`, `costCenters.js`, `suppliers.js`, `faq.js`, `forecastFinance.js`, and `customerPortalP15.js`.
  3. Prohibited `company_id` modification on existing records across all endpoints.

### SEC-06: Unauthorized Inter-Branch Shipment Transfer (HIGH)
- **CWE:** CWE-863 (Incorrect Authorization)
- **Description:** `POST /api/shipments/:id/transfer` did not verify whether a branch manager or staff user belonged to the origin branch of the shipment being transferred.
- **Impact:** A rogue branch manager in Branch A could transfer shipments located in Branch B without authorization.
- **Remediation:**
  1. Added role authorization (`admin`, `superadmin`, `manager`, `operations_manager`, `staff`).
  2. Enforced that non-admin users must belong to the origin branch (`req.user.branch_ids`). Attempting to transfer shipments from unassigned branches yields HTTP 403.
  3. All transfers are written to `AuditLog` (`event_type: 'branch_transfer'`).

### SEC-07: Path Traversal Risk on Document Downloads (HIGH)
- **CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)
- **Description:** `GET /api/documents/:id/download` passed `doc.file_path` directly to `res.download(filePath)` without canonical path validation. Furthermore, simple string-prefix checks (`resolved.startsWith(safeUploadDir)`) are susceptible to sibling-directory prefix attacks (e.g. `documents_secret/file.txt`).
- **Impact:** If a document record contained a tampered file path (e.g. `../../etc/passwd`, system files, or sibling directories), arbitrary files could be read or leaked.
- **Remediation:**
  1. Replaced unsafe string prefix checks with robust path-relative containment verification:
     ```javascript
     const safeUploadDir = path.resolve(uploadDir);
     const resolved = path.resolve(filePath);
     const rel = path.relative(safeUploadDir, resolved);
     const isContained = Boolean(
       rel &&
       !rel.startsWith('..') &&
       !path.isAbsolute(rel) &&
       (resolved === safeUploadDir || resolved.startsWith(safeUploadDir + path.sep))
     );
     if (!isContained) {
       return res.status(403).json({ error: 'Access denied: Invalid file path' });
     }
     ```
  2. Verified defense against `../` traversal, encoded traversal, Windows backslash separators, absolute paths, and sibling directory prefix attacks in `backend/test-document-path-security.js` (6/6 passing).
  3. Enforced multi-tenant scoping (`Document.findOne({ _id: req.params.id, company_id: req.user.company_id })`), preventing cross-tenant document downloads (returns HTTP 404).
  4. Sanitized `original_name` against carriage returns, newlines, and quote injection.

### SEC-08: Deactivated Accounts Permitted Token Authentication (HIGH)
- **CWE:** CWE-285 (Improper Authorization)
- **Description:** Inactive users (`is_active === false`) were rejected during password login, but existing tokens for deactivated users remained usable in `middleware/auth.js` due to fallback logic.
- **Impact:** Deactivated employees or terminated staff could continue accessing platform APIs using previously acquired tokens.
- **Remediation:**
  1. `middleware/auth.js` explicitly checks `user.is_active === false` for both local JWT and Clerk sessions, returning HTTP 403 `{"error": "Account has been deactivated"}`.
  2. Soft-deleting a user sets `is_active: false` and sets `lastLogoutAt: new Date()`, immediately revoking existing tokens.

### SEC-09: Known Critical/High CVEs in Project Dependencies (HIGH)
- **CWE:** CWE-1395 (Dependency on Vulnerable Third-Party Component)
- **Description:** `npm audit` revealed 9 backend vulnerabilities (3 Critical, 4 High, 2 Moderate) including Mongoose prototype pollution (GHSA-664h-wqgq-64gw), Proxy-Addr IP spoofing (GHSA-jqcg-44mw-7w3h), and Shell-Quote command injection (GHSA-pqg4-j6r4-53mv). Frontend dependencies contained 6 High vulnerabilities in Axios, Browserslist, and Vite.
- **Remediation:**
  1. Executed `npm audit fix` and updated Express to `4.21.2` in backend (`found 0 vulnerabilities`).
  2. Updated frontend dependencies resolving all 6 High vulnerabilities without breaking changes.

### SEC-10: Race Condition in Initial Bootstrap Lock Acquisition (MEDIUM)
- **CWE:** CWE-362 (Concurrent Execution using Shared Resource with Improper Synchronization)
- **Description:** Initial implementation of the bootstrap service used non-upserting find and update without prior record initialization, potentially leading to race conditions under concurrent requests.
- **Impact:** Simultaneous requests could cause multiple provisioning workflows to trigger.
- **Remediation:**
  1. Implemented a two-stage atomic lock using MongoDB `$setOnInsert` and compare-and-swap update (`findOneAndUpdate({ lock_name, is_completed: false }, { $set: { is_completed: true } })`).
  2. Tested with 5 concurrent requests fired via `Promise.all`: verified exactly 1 succeeded and 4 received HTTP 409 Conflict.

### SEC-11: Timing Side-Channel in Bootstrap Secret Comparison (LOW)
- **CWE:** CWE-208 (Observable Timing Discrepancy)
- **Description:** Bootstrap secret was compared using standard JavaScript `secret !== configuredSecret`, which terminates early upon finding a mismatching character.
- **Impact:** Theoretical timing analysis could allow an attacker to guess secret characters sequentially.
- **Remediation:**
  1. Replaced standard comparison with constant-time `crypto.timingSafeEqual(bufA, bufB)`.

---

## 4. Bootstrap Credential Exposure & Git History Audit

1. **Git Repository History Inspection:**
   - Evaluated all commits across git history for `.env`, `backend/.env`, and `frontend/.env`.
   - Verified that `.env` files have **never been tracked or committed** to Git (`git log --all --full-history -- ".env"` returned empty).
   - Project `.gitignore` rules correctly block `.env`, `.env.local`, `backend/.env`, and `frontend/.env.production`.
2. **Credential Rotation Recommendations for Production:**
   - Any credentials, keys, or secrets utilized in development or during testing must be treated as untrusted and **rotated before production deployment**:
     - `MONGODB_URI`: Rotate MongoDB Atlas cluster user password and create a dedicated production database user with restricted `readWrite` privileges scoped solely to `localwheels`.
     - `JWT_SECRET`: Generate a new 64-byte random hex secret using `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.
     - `BOOTSTRAP_SECRET`: Generate a unique 32-byte bootstrap secret. Once initial superadmin provisioning is complete, delete the `BOOTSTRAP_SECRET` environment variable or leave bootstrap permanently locked.
     - `CLERK_SECRET_KEY`: Ensure live production keys for live mode are deployed in production, never development test keys for test mode.
     - `ANTHROPIC_API_KEY`: Rotate live API keys in the Anthropic dashboard.

---

## 5. Architectural & Infrastructure Controls

1. **HTTP Security Headers (Helmet):**
   - Content Security Policy (CSP) enforcing `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, and `base-uri 'self'`.
   - HTTP Strict Transport Security (HSTS) with `maxAge: 31536000` (1 year), `includeSubDomains: true`, and `preload: true` in production.
   - `crossOriginResourcePolicy: 'cross-origin'` for authenticated document/POD asset delivery.
2. **CORS Enforcement:**
   - In production, strict origin validation against `ALLOWED_ORIGINS` environment variable. Unauthorized origins are rejected.
3. **Multi-Tier Rate Limiting:**
   - Global API Rate Limiter: 300 requests per 15 minutes per IP (`apiLimiter`).
   - Login Endpoint Rate Limiter: 10 attempts per 15 minutes per IP (`loginLimiter`).
   - Public AI Chat Rate Limiter: 30 requests per 15 minutes (`chatLimiter`).
4. **Append-Only Audit Logging:**
   - Privileged administrative, role change, and branch transfer events are logged to the `AuditLog` collection.
   - No update or delete endpoints exist for `AuditLog`. Secrets, tokens, and password hashes are strictly excluded from audit payloads.

---

## 6. Complete API Coverage & Inventory Metrics

An automated full-codebase endpoint inventory scan was performed (`backend/endpoint-inventory.js`):
- **Total API Endpoints Registered:** **896**
- **Authenticated Endpoints:** **890** (Enforcing JWT `HS256` or verified Clerk SSO)
- **Public Unauthenticated Endpoints:** **6** strictly controlled endpoints (`/health`, `/auth/login`, `/auth/bootstrap-status`, `/auth/bootstrap-superadmin`, `/auth/clerk-exchange`, `/shipments/track/:lr`)
- **Role-Restricted Administrative Endpoints:** **40** (Restricted to `admin` / `superadmin` / `manager`)
- **Full Inventory JSON:** Preserved in `backend/endpoint-inventory.json`

---

## 7. Audit Conclusion & Release Gate Verdict

The LocalWheels platform has undergone thorough source code review, architectural hardening, independent manual verification, and automated regression validation across all 127 route files and 896 endpoints.

**Release Gate Verdict: APPROVED FOR PRODUCTION DEPLOYMENT**  
- **Security Hardening Test Suite:** 45 / 45 Passed (100%)  
- **Document Path Security Suite:** 6 / 6 Passed (100%)  
- **Logistics Functional Validation:** 43 / 43 Passed (100%)  
- **Setup Permissions Validation:** 27 / 27 Passed (100%)  
- **Headless Browser Validation:** 5 / 5 Passed (100%)  
- **Combined Ground-Truth Assertions:** **126 / 126 Passed (100% Success Rate)**  
- **Dependency Vulnerabilities:** 0 Critical, 0 High in Backend (0 vulnerabilities total in backend)

