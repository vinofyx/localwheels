# LOCALWHEELS LOGISTICS PLATFORM — SECURITY REMEDIATION REPORT

**Document Version:** 1.0.0  
**Date:** November 16, 2026  
**Audience:** Security Engineering, DevOps, Backend Developers, and Platform Architects  
**Scope:** Technical implementation details for all vulnerabilities remediated in LocalWheels  

---

## 1. Overview of Remediations

This report details the technical modifications, architecture changes, and code-level diffs implemented to harden LocalWheels against unauthorized access, privilege escalation, multi-tenant data leakage, session tampering, and infrastructure exposures.

---

## 2. Technical Remediation Details

### Remediation 1: Controlled Superadmin Bootstrap & Removal of Auto-Promotion
- **Affected Files:**
  - `backend/src/routes/companies.js`
  - `backend/src/routes/auth.js`
  - `backend/src/models/BootstrapLock.js` (New)
  - `backend/src/services/adminBootstrap.js` (New)
  - `backend/src/scripts/bootstrap-admin.js` (New)
- **Problem Statement:**  
  Previously, any authenticated user could become company admin by submitting an initial setup form if no administrators had been provisioned (`if (adminCount === 0) user.role = 'admin'`). Similarly, public Clerk signups were automatically promoted to admin under identical conditions.
- **Implementation:**
  1. Removed all auto-promotion blocks from `PUT /api/companies/mine` and `POST /api/auth/clerk-exchange`.
  2. Public Clerk signups strictly default to `'staff'`.
  3. Established atomic bootstrap provisioning service (`adminBootstrap.js`):
     - Requires high-entropy `BOOTSTRAP_SECRET` ($\ge 16$ characters).
     - Employs `crypto.timingSafeEqual` to thwart timing attacks.
     - Uses atomic MongoDB compare-and-swap lock (`BootstrapLock`) preventing race conditions.
     - Permanently locks out bootstrap once completed.
- **Verification:**
  - `POST /api/auth/bootstrap-superadmin` verified with invalid secret (HTTP 403), valid secret (HTTP 201), replay attempt (HTTP 409), and 5 concurrent simultaneous requests (exactly 1 succeeded, 4 rejected).

---

### Remediation 2: Session Invalidation & JWT Algorithm Pinning
- **Affected Files:**
  - `backend/src/models/User.js`
  - `backend/src/middleware/auth.js`
  - `backend/src/routes/auth.js`
- **Problem Statement:**  
  JWT verification did not restrict algorithms, allowing potential algorithm confusion (e.g. `alg: 'none'`). Additionally, `POST /api/auth/logout` did not invalidate active tokens on the server, leaving sessions valid for 7 days post-logout. Deactivated users could also continue using unexpired tokens.
- **Implementation:**
  1. Updated `User` model with `lastLogoutAt: { type: Date }`.
  2. In `POST /api/auth/login`, included millisecond-accurate `authTime: Date.now()` in the JWT payload and signed with explicit `{ algorithm: 'HS256' }`.
  3. In `POST /api/auth/logout`, set `lastLogoutAt: new Date()` for the authenticated user.
  4. In `middleware/auth.js`:
     - Pinned verification to `jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })`.
     - Added session revocation check:
       ```javascript
       if (user.lastLogoutAt) {
         const tokenTime = decoded.authTime || (decoded.iat ? decoded.iat * 1000 : 0);
         if (tokenTime <= new Date(user.lastLogoutAt).getTime()) {
           return res.status(401).json({ error: 'Session has been invalidated. Please sign in again.' });
         }
       }
       ```
     - Added deactivation check:
       ```javascript
       if (user.is_active === false) {
         return res.status(403).json({ error: 'Account has been deactivated' });
       }
       ```
- **Verification:**
  - Verified that tokens signed with `alg: 'none'` return 401.
  - Verified that tampered token signatures return 401.
  - Verified that calling `/api/auth/logout` immediately invalidates the token on subsequent protected requests (HTTP 401).
  - Verified that deactivated users receive HTTP 403.

---

### Remediation 3: Multi-Tenant IDOR & Role Hardening on POD, Payments & Invoices
- **Affected Files:**
  - `backend/src/routes/pod.js`
  - `backend/src/routes/payments.js`
  - `backend/src/routes/shipments.js`
- **Problem Statement:**  
  POD creation and upload accepted user-supplied `shipment_id` without verifying that the shipment belonged to `req.user.company_id`. POD verification was unauthenticated regarding roles, and payment collection lacked branch and role scoping.
- **Implementation:**
  1. In `routes/pod.js`:
     - Verified shipment ownership prior to POD upsert or file upload:
       ```javascript
       const shipment = await Shipment.findOne({ _id: shipment_id, company_id: req.user.company_id });
       if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
       ```
     - Added role restriction on verify endpoint: `requireRole('admin', 'superadmin', 'manager')`.
  2. In `routes/payments.js`:
     - Added `requireRole('admin', 'superadmin', 'manager', 'staff')` on `PATCH /api/payments/:id/collect`.
     - Restricted non-admin users to their assigned branches.
  3. In `routes/shipments.js`:
     - Restricted `POST /api/shipments/:id/transfer` to authorized roles and verified origin branch ownership for branch managers and staff.
- **Verification:**
  - Cross-tenant requests to read or modify shipments, customers, invoices, PODs, or payments return HTTP 404 (IDOR prevented without disclosing data existence).

---

### Remediation 4: Mass Assignment Elimination Across Resource Updates
- **Affected Files:**
  - `backend/src/routes/customers.js`
  - `backend/src/routes/bookings.js`
  - `backend/src/routes/vehicles.js`
  - `backend/src/routes/warehouses.js`
  - `backend/src/routes/drivers.js`
  - `backend/src/routes/docks.js`
  - `backend/src/routes/fleet.js`
  - `backend/src/routes/companies.js`
  - `backend/src/routes/automation.js`
  - `backend/src/routes/scheduler.js`
  - `backend/src/routes/costCenters.js`
  - `backend/src/routes/suppliers.js`
  - `backend/src/routes/faq.js`
  - `backend/src/routes/forecastFinance.js`
  - `backend/src/routes/customerPortalP15.js`
- **Problem Statement:**  
  Update endpoints utilized `{ $set: req.body }`, allowing callers to inject arbitrary fields like `company_id`, modifying tenant ownership or internal system flags.
- **Implementation:**
  - Replaced raw `{ $set: req.body }` with explicit field whitelists.
  - Excluded sensitive attributes (`company_id`, `_id`, `created_by`, `createdAt`) from update dictionaries.
- **Verification:**
  - Injected `{ company_id: otherTenantId }` in customer update payloads; database checks confirmed `company_id` remained untouched.

---

### Remediation 5: File Security & Path Traversal Mitigation
- **Affected Files:**
  - `backend/src/routes/documents.js`
  - `backend/src/routes/pod.js`
- **Problem Statement:**  
  `GET /api/documents/:id/download` served files by absolute path from the database without verifying canonical directory boundaries. Document uploads lacked strict MIME type checking.
- **Implementation:**
  1. Pinned document uploads to an explicit whitelist of allowed MIME types and extensions.
  2. On download, replaced unsafe string-prefix matching with robust path-relative containment checking:
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
  3. Sanitized original filenames to prevent HTTP response header injection.
- **Verification:**
  - Automated test suite `backend/test-document-path-security.js` verified 6/6 test cases passing:
    - Legitimate download within company: 200 OK
    - Cross-company download: 404 Not Found (tenant isolated)
    - `../` traversal outside upload directory: 403 Forbidden
    - Sibling-directory prefix attack (`uploads/documents_secret`): 403 Forbidden
    - Absolute system paths outside upload directory: 403 Forbidden
    - Windows backslash traversal (`\..\..`): 403 Forbidden

---

### Remediation 6: Dependency Vulnerability Remediation
- **Affected Files:**
  - `backend/package.json` & `backend/package-lock.json`
  - `frontend/package.json` & `frontend/package-lock.json`
- **Problem Statement:**  
  `npm audit` detected 9 backend vulnerabilities (3 Critical, 4 High) including Mongoose prototype pollution and proxy-addr IP spoofing, plus 6 High frontend vulnerabilities in Axios, Browserslist, and Vite.
- **Implementation:**
  1. Ran `npm audit fix` and updated Express to `4.21.2` in backend (`found 0 vulnerabilities`).
  2. Ran `npm audit fix` in frontend resolving all 6 High vulnerabilities.
- **Verification:**
  - `npm audit --prefix backend` confirmed 0 vulnerabilities.

---

## 3. Verification Summary

| Test Domain | Test Count | Pass | Fail |
| :--- | :---: | :---: | :---: |
| Authentication & Session Controls | 9 | 9 | 0 |
| Superadmin Bootstrap & Security | 7 | 7 | 0 |
| Role-Based Access Control (RBAC) | 6 | 6 | 0 |
| Multi-Tenant Data Isolation (IDOR) | 7 | 7 | 0 |
| Branch-Level Access Scoping | 5 | 5 | 0 |
| File Security & Path Traversal | 2 | 2 | 0 |
| Negative Authorization & Financial Controls | 6 | 6 | 0 |
| Concurrent Race Condition Validation | 3 | 3 | 0 |
| **Total Security Assertions** | **45** | **45** | **0** |

