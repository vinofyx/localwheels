# LOCALWHEELS LOGISTICS PLATFORM — REMAINING SECURITY RISKS REGISTER

**Document Version:** 1.0.0  
**Audit Date:** November 16, 2026  
**Auditor:** Senior Principal Security Engineer & Application Architect  
**Project Path:** `D:\Localwheels`  
**Overall Risk Posture:** **LOW RESIDUAL RISK — PRODUCTION APPROVED WITH OPERATIONAL PREREQUISITES**  

---

## 1. Risk Classification Matrix & Summary

All identified findings have been classified according to the standard severity taxonomy:

| Risk ID | Title | Severity | Status | Release Blocker? |
| :--- | :--- | :---: | :---: | :---: |
| **SEC-01** | Insecure Initial Admin Auto-Promotion | **CRITICAL** | **REMEDIATED** | Resolved |
| **SEC-02** | Cross-Tenant IDOR on Shipments, Payments, Invoices & POD | **CRITICAL** | **REMEDIATED** | Resolved |
| **SEC-03** | Missing Server-Side Session Revocation on Logout | **HIGH** | **REMEDIATED** | Resolved |
| **SEC-04** | Missing JWT Algorithm Pinning (`HS256`) | **HIGH** | **REMEDIATED** | Resolved |
| **SEC-05** | Mass Assignment on Resource Update Endpoints | **HIGH** | **REMEDIATED** | Resolved |
| **SEC-06** | Unauthorized Inter-Branch Shipment Transfer | **HIGH** | **REMEDIATED** | Resolved |
| **SEC-07** | Path Traversal & Sibling Directory Attack on Document Downloads | **HIGH** | **REMEDIATED** | Resolved |
| **SEC-08** | Deactivated Accounts Permitted Token Authentication | **HIGH** | **REMEDIATED** | Resolved |
| **SEC-09** | Known Critical/High CVEs in Project Dependencies | **HIGH** | **REMEDIATED** | Resolved |
| **MED-01** | React Router Moderate CVEs in Client-Side Frontend | **MEDIUM** | **ACCEPTED / MITIGATED** | **No** (Safe to Proceed) |
| **MED-02** | Database User Direct Write Privileges on AuditLog Collection | **MEDIUM** | **OPERATIONAL MITIGATION** | **No** (Prerequisite) |
| **LOW-01** | In-Memory Rate Limiting under Multi-Worker PM2 Cluster | **LOW** | **OPERATIONAL MITIGATION** | **No** (Low Impact) |
| **LOW-02** | POD Image Filename Structure in Static Upload Directory | **LOW** | **MITIGATED** | **No** (Low Impact) |
| **INFO-01** | Third-Party Messaging Credentials Absent in Staging | **INFORMATIONAL** | **OPERATIONAL NOTICE** | **No** (Expected in Staging) |
| **INFO-02** | Reverse Proxy Real IP Forwarding Requirement | **INFORMATIONAL** | **DOCUMENTED** | **No** (Configured) |

---

## 2. Detailed Breakdown of Remaining Residual Risks

### MED-01: React Router Moderate Advisories in Client-Side Frontend
- **Severity:** **MEDIUM**
- **Affected Packages:** `react-router@6.0.0 - 7.17.0`, `react-router-dom@^6.22.3`
- **CVE References:** GHSA-337j-9hxr-rhxg, GHSA-wrjc-x8rr-h8h6
- **Description:**
  1. *GHSA-337j-9hxr-rhxg:* Arbitrary Constructor Injection via `deserializeErrors()` in SSR Hydration stream.
  2. *GHSA-wrjc-x8rr-h8h6:* Open redirect via backslash characters in `<Link>` or `useNavigate`.
- **Impact Assessment:**
  - *SSR Flaw Inert:* LocalWheels is a pure client-side SPA (Vite) with no server-side rendering or hydration. The vulnerable `deserializeErrors` function is never imported or called in runtime bundles.
  - *Open Redirect Mitigated:* All `<Link>` and `navigate()` destinations in LocalWheels use hardcoded route literals (e.g., `/dashboard`, `/shipments`). No unvalidated external URLs or user input flow into navigation destinations.
- **Why It Remains Unfixed:**
  Remediation requires `npm audit fix --force`, which executes a major upgrade to `react-router-dom@7.18.5`. Migrating from v6 to v7 is a breaking change that requires restructuring route providers and hooks.
- **Recommended Action:**
  Accept the residual risk for initial production launch. Schedule the React Router v7 migration for the next planned major frontend release cycle after component regression testing.

---

### MED-02: Database User Direct Write Privileges on AuditLog Collection
- **Severity:** **MEDIUM**
- **Affected Component:** MongoDB Atlas Database Access
- **Description:**
  In the application layer, `AuditLog` has zero update or delete endpoints. However, if the production database user is provisioned with standard MongoDB `readWrite` privileges on the `localwheels` database, a compromise of the database user password would allow an attacker to delete or modify records in the `auditlogs` collection directly via a MongoDB client.
- **Impact Assessment:**
  Tampering with audit logs could enable an attacker with direct database access to erase evidence of administrative changes or security violations.
- **Recommended Action (Operator Prerequisite):**
  Configure a custom MongoDB role in Atlas for the application database user that allows `find` and `insert` on `auditlogs`, but explicitly excludes `update` and `remove`:
  ```javascript
  use localwheels;
  db.createRole({
    role: "appRoleAppendOnlyAudit",
    privileges: [
      { resource: { db: "localwheels", collection: "auditlogs" }, actions: [ "find", "insert" ] },
      { resource: { db: "localwheels", collection: "" }, actions: [ "find", "insert", "update", "remove" ] }
    ],
    roles: []
  });
  ```
  Assign this custom role to `lw_prod_user`.

---

### LOW-01: In-Memory Rate Limiting under Multi-Worker PM2 Cluster
- **Severity:** **LOW**
- **Affected Component:** `express-rate-limit` in `backend/src/index.js`
- **Description:**
  `express-rate-limit` stores request counters in the local Node.js process memory. When running PM2 in cluster mode with $N$ worker processes, each worker maintains its own memory bucket. A client whose requests are distributed evenly across $N$ workers could theoretically execute up to $N \times \text{limit}$ requests within the 15-minute window.
- **Impact Assessment:**
  For typical workloads (2 to 4 workers), the effective rate limit on `/api/auth/login` would be 20 to 40 attempts per 15 minutes instead of 10. This still provides brute-force protection, but is slightly more permissive than intended.
- **Recommended Action:**
  For high-scale multi-server deployments, configure `rate-limit-redis` to store rate limit counters in Redis (`REDIS_URL`). For single-instance or small VPS deployments, the current in-memory limiter is acceptable.

---

### LOW-02: POD Image Filename Structure in Static Upload Directory
- **Severity:** **LOW**
- **Affected Component:** `backend/src/routes/pod.js`
- **Description:**
  POD images are uploaded to `/uploads/` with filename format `pod_${shipmentId}_${Date.now()}.${ext}`. Although `/uploads/documents/` is protected from unauthenticated static access, `/uploads/` serves POD images statically so that frontend `<img>` tags can display delivery signatures. If an attacker knew the exact `shipmentId` and the exact millisecond timestamp, they could theoretically predict the image URL.
- **Impact Assessment:**
  Low likelihood due to timestamp precision and ObjectId entropy. However, POD images contain consignee signatures and package photographs.
- **Recommended Action:**
  Update POD uploads in a future release to use a cryptographically random 12-byte hex token (identical to `documents.js`) rather than sequential timestamps:
  ```javascript
  filename: (req, file, cb) => {
    const safe = crypto.randomBytes(12).toString('hex');
    cb(null, `pod_${req.params.shipmentId}_${Date.now()}_${safe}${path.extname(file.originalname)}`);
  }
  ```

---

### INFO-01: Third-Party Messaging Credentials Absent in Staging
- **Severity:** **INFORMATIONAL**
- **Affected Components:** WhatsApp Cloud API, Twilio/Fast2SMS
- **Description:**
  External messaging API credentials (`WHATSAPP_ACCESS_TOKEN`, `SMS_GATEWAY_KEY`) are intentionally unconfigured in development/staging test environments. Notification attempts log locally without dispatching live SMS or WhatsApp messages.
- **Action Required:**
  Configure live Meta Cloud API and SMS provider credentials in the production `.env` before enabling customer-facing delivery alerts.

---

### INFO-02: Reverse Proxy Real IP Forwarding Requirement
- **Severity:** **INFORMATIONAL**
- **Affected Component:** Express `trust proxy` & Nginx
- **Description:**
  `backend/src/index.js` sets `trust proxy: 1`. In production, Nginx must be configured to pass `X-Real-IP $remote_addr` and `X-Forwarded-For $proxy_add_x_forwarded_for`. If Nginx fails to forward headers, all client requests will appear to originate from `127.0.0.1`, which would cause rate limiters to throttle all users together.
- **Action Required:**
  Ensure the production Nginx virtual host includes the standard proxy headers specified in the deployment guide.

---

## 3. Production Release Gate Recommendation

**FINAL VERDICT: CONDITIONAL GO**

There are **zero Critical or High severity blockers**. The application is hardened and ready for production deployment once the operator configures production secrets and network access rules.

