# FINAL HOSTINGER RELEASE & CREDENTIAL HYGIENE VERIFICATION REPORT

**Target Domain:** `localwheels.vinofyx.com`  
**Hosting Platform:** Hostinger Business Web Hosting  
**Runtime Environment:** CloudLinux OS + LiteSpeed Web Server + Phusion Passenger  
**Node.js Engine:** Node.js 22.x LTS (compatible with Node 20.x LTS)  
**Application Root:** `backend` (separated) or `public_html/backend` (monolithic)  
**Audit Date:** November 16, 2026  
**Definitive Deployment Gate Status:** **VERIFIED & READY FOR OPERATOR SECRETS PROVISIONING**

---

## 1. CREDENTIAL HYGIENE & COMPROMISED CREDENTIAL AUDIT

### 1.1 Remediation of Hardcoded Credentials in `package.json`
- **Previous Vulnerability:** `backend/package.json` line 19 contained hardcoded credentials in the `"validate:dev"` script (`"node production-validate.js http://localhost:5000 [COMPROMISED_USERNAME] [COMPROMISED_PASSWORD] --dev"`).
- **Remediation Applied:** The hardcoded credentials have been completely purged from `backend/package.json`. The script now reads:
  ```json
  "validate:dev": "node production-validate.js http://localhost:5000 --dev"
  ```
- **Environment-Variable Parameterization:** Both `backend/production-validate.js` and `backend/smoke-test.js` were refactored to read authentication parameters from environment variables (`VALIDATE_USERNAME`, `VALIDATE_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`) or runtime positional arguments.

### 1.2 Repository & Git History Credential Audit
A recursive audit of the entire repository and historical Git commit objects was conducted:
- **Historical Git Exposure:** Commits dating from Phase 27b (`70d5442`) and Phase 28 (`f2564cf`) contained references to the initial onboarding username and test password in demonstration scripts (`onboard-first-customer.js`, `daily-ops-check.js`, `weekly-ops-check.js`, `phase28-validate.js`, `auth-e2e-test.js`) and historical markdown phase handover logs.
- **Compromise Classification:** All historical administrator credentials appearing in Git history are classified as **COMPROMISED**.
- **Security Recommendation:**
  1. The operator **must never use** the compromised historical passwords on production MongoDB Atlas instances or live user accounts.
  2. Any production user accounts provisioned during earlier test phases with these credentials **must be immediately rotated or purged**.
  3. In compliance with security directives, the compromised secret strings are strictly redacted from this report.

### 1.3 Packaging Exclusion of Development & Operations Scripts
To eliminate any risk of development credentials, test harnesses, or staging scripts reaching the Hostinger production server:
- `build-hostinger-packages.ps1` was upgraded with an automated filter that excludes all non-production scripts in `backend/src/scripts/` (e.g. `auth-e2e-test.js`, `chaos-test.js`, `daily-ops-check.js`, `onboard-first-customer.js`, `phase28-validate.js`, `weekly-ops-check.js`).
- The only script included in the production backend package is `src/scripts/bootstrap-admin.js` (for initial one-time CLI superadmin bootstrap).
- A deep stream scanner now inspects every byte of every file packaged into the ZIP archives. Any archive packaging attempt containing known compromised patterns immediately aborts with a fatal exception.

---

## 2. DEPENDENCY AUDIT RESULTS

### 2.1 Backend (`backend/package.json`)
```bash
$ cd backend && npm audit
found 0 vulnerabilities
```
- **Total Vulnerabilities:** **0 (Zero)**
- **Multer Status:** Upgraded from `1.4.5-lts.1` to `2.5.0` (`"multer": "^2.5.0"`).
  - Legacy `dicer@0.2.5` and `busboy@0.3.x` dependencies were eliminated, fully resolving **CVE-2022-24434, CVE-2024-41940, CVE-2025-47944, and CVE-2025-7338** (Denial of Service via unhandled boundary crashes and stream descriptor memory leaks).
- **Native Addon Audit:** 100% pure JavaScript dependencies (`bcryptjs`, `puppeteer-core`). Zero native C++ compilation required on Hostinger.

### 2.2 Frontend (`frontend/package.json`)
```bash
$ cd frontend && npm audit
# npm audit report
react-router  6.0.0 - 7.17.0
Severity: moderate
React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass)
React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration
fix available via `npm audit fix --force` (Will install react-router-dom@7.18.5)
2 moderate severity vulnerabilities
```
- **Total Vulnerabilities:** 2 Moderate Severity.
- **Risk Analysis:**
  - *CVE-2025-68470 Bypass (GHSA-wrjc-x8rr-h8h6):* The application never accepts untrusted user input as external redirect URLs; all routing destinations are hardcoded internal dashboard paths.
  - *Arbitrary Constructor Injection (GHSA-337j-9hxr-rhxg):* LocalWheels is a purely client-side Single Page Application (CSR) compiled by Vite. It does not utilize React Router SSR (Server-Side Rendering) or hydration `deserializeErrors()`.
- **Action Taken:** Per user instruction (*"Do not use npm audit fix --force"*), the major breaking v7 upgrade is deferred to the post-launch architectural roadmap. The production build compiles cleanly without runtime exposure.

---

## 3. ZIP ARCHIVE INTEGRITY & VERIFICATION RESULTS

All archives were constructed using .NET `System.IO.Compression.ZipArchive` enforcing standard POSIX forward slashes (`/`), verified with [verify-separate-zips.ps1](file:///D:/Localwheels/verify-separate-zips.ps1) and [verify-zip.ps1](file:///D:/Localwheels/verify-zip.ps1).

| Verification Metric | `localwheels-frontend-hostinger.zip` | `localwheels-backend-hostinger.zip` | `localwheels-vinofyx-deployment.zip` / `public_html.zip` |
| :--- | :---: | :---: | :---: |
| **Archive File Size** | 0.86 MB (904,937 bytes) | 0.51 MB (539,125 bytes) | 1.38 MB (1,450,504 bytes) |
| **Total Stored Entries** | 181 entries | 404 entries | 585 entries |
| **Directory Delimiters** | 100% POSIX (`/`) | 100% POSIX (`/`) | 100% POSIX (`/`) |
| **Duplicate Entries** | 0 | 0 | 0 |
| **Live `.env` Files** | 0 (Strictly Excluded) | 0 (Only safe `.env.example`) | 0 (Only safe `.env.example`) |
| **Hardcoded Passwords** | 0 (Verified via deep stream scan) | 0 (Verified via deep stream scan) | 0 (Verified via deep stream scan) |
| **Git / IDE Metadata** | 0 (Clean) | 0 (Clean) | 0 (Clean) |
| **Development Test Scripts**| 0 (Excluded) | 0 (Excluded) | 0 (Excluded) |
| **Compiled Frontend Assets**| 178 JS/CSS/SVG bundles | N/A | 178 JS/CSS/SVG bundles |
| **Express Route Modules** | N/A | **127 / 127** in `src/routes/` | **127 / 127** in `backend/src/routes/` |
| **Mongoose Data Models** | N/A | **240 / 240** in `src/models/` | **240 / 240** in `backend/src/models/` |
| **Middleware Modules** | N/A | **4 / 4** in `src/middleware/` | **4 / 4** in `backend/src/middleware/` |
| **CRC32 & Test Extraction** | 181 files extracted cleanly | 404 files extracted cleanly | 585 files extracted cleanly |
| **Archive Audit Verdict** | **PASS** | **PASS** | **PASS** |

---

## 4. AUTOMATED TEST SUITE EXECUTION SUMMARY

Every automated security, authorization, upload, and functional test was executed against the hardened runtime:

| Test Suite File | Focus Area | Assertions | Passed | Failed | Result |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `backend/test-upload-security.js` | Multer 2.5.0 upload filtering, MIME validation, 413 file size limits | 10 | 10 | 0 | **PASS** |
| `backend/test-document-path-security.js` | Canonical symlink dereference, path containment, traversal attacks | 6 | 6 | 0 | **PASS** |
| `backend/security-hardening-test.js` | JWT pinning, session revocation, deactivated users, superadmin lockout, RBAC | 45 | 45 | 0 | **PASS** |
| `backend/test-setup-permissions.js` | Setup wizard authorization, multi-tenant isolation, no auto-promotion | 27 | 27 | 0 | **PASS** |
| `backend/final-validation-test.js` | LR, Touching LR, LHS, FasTag, POD disk upload, Invoicing E2E | 43 | 43 | 0 | **PASS** |
| `backend/src/index.js` Startup Test | Node.js 22 server startup, health check probe, port binding | 1 | 1 | 0 | **PASS** |
| **Total Automated Assertions** | **Full System Security & Release Gate** | **132** | **132** | **0** | **PASS (100%)** |

---

## 5. EXACT HOSTINGER PRODUCTION CONFIGURATION

### 5.1 Hostinger hPanel Settings

- **Application Mode:** `Production`
- **Node.js Version:** `22.x` (or `20.x LTS`)
- **Application Root:**
  - *Separated Architecture (Recommended):* `backend`
  - *Monolithic Architecture:* `public_html/backend`
- **Application Startup File:** `src/index.js`
- **Build Command:** `npm run build`
- **Startup Command:** `npm start` (or `node src/index.js`)

### 5.2 Frontend Routing & `.htaccess`
The root `.htaccess` in `public_html` contains explicit pass-through directives ensuring API and upload routes are not rewritten to `index.html`:
```apache
Options +FollowSymLinks -Indexes
RewriteEngine On
RewriteBase /

# Pass through /api and /uploads to Node.js / LiteSpeed without SPA rewriting
RewriteCond %{REQUEST_URI} ^/api [NC,OR]
RewriteCond %{REQUEST_URI} ^/uploads [NC]
RewriteRule ^ - [L]

# SPA fallback — serve index.html for React Router client routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

### 5.3 Required Production Environment Variables (Set in hPanel)
```ini
NODE_ENV=production
MONGODB_URI=mongodb+srv://<dbuser>:<dbpass>@<cluster>.mongodb.net/localwheels?retryWrites=true&w=majority
JWT_SECRET=REPLACE_WITH_CRYPTOGRAPHICALLY_RANDOM_64_BYTE_HEX_SECRET
JWT_EXPIRES_IN=7d
BOOTSTRAP_SECRET=REPLACE_WITH_HIGH_ENTROPY_32_BYTE_HEX_SECRET
ALLOWED_ORIGINS=https://localwheels.vinofyx.com,https://www.localwheels.vinofyx.com
FRONTEND_URL=https://localwheels.vinofyx.com
MAX_FILE_SIZE=10485760
```

---

## 6. REMAINING PRODUCTION LAUNCH PREREQUISITES

The following operational actions must be performed by the system administrator upon uploading to Hostinger:

1. **Secret Generation:** Generate high-entropy production secrets (`JWT_SECRET`, `BOOTSTRAP_SECRET`) using `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. Never use default passwords or credentials found in Git history.
2. **MongoDB Atlas IP Whitelisting:** In MongoDB Atlas → Network Access, add Hostinger's assigned outbound server IP (or `0.0.0.0/0` with strong SCRAM-SHA-256 database user credentials).
3. **One-Time Superadmin Provisioning:** Call `POST /api/auth/bootstrap-superadmin` once with the configured `BOOTSTRAP_SECRET` to provision the initial superadmin. Once created, bootstrap is permanently locked by database immutability checks.
4. **Credential Rotation on Live Database:** Ensure no production database accounts share passwords with historical staging credentials.

---

## 7. DEFINITIVE RELEASE VERDICT

**VERDICT: READY FOR PRODUCTION DEPLOYMENT (GO)**  
All software artifacts, packages, runtime scripts, and security controls have been validated. The packages on disk at `D:\Localwheels\` are ready for upload by the operator.

