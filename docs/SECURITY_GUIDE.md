# LocalWheels Platform — Security Guide
**Version:** 1.0 | **Date:** 2026-07-02 | **Audience:** Administrators, DevOps

---

## 1. Security Architecture

### Defense-in-Depth Layers

```
Layer 1 — Network:    Cloudflare WAF, DDoS protection, IP allowlist
Layer 2 — Transport:  HTTPS/TLS 1.2+ enforced on all endpoints
Layer 3 — Application: JWT authentication, RBAC, rate limiting
Layer 4 — Data:        Tenant isolation (company_id), field-level encryption
Layer 5 — Audit:       Full mutation audit trail, anomaly detection
```

---

## 2. Authentication

### JWT Configuration
- **Algorithm:** HS256 with 64-byte randomly generated secret
- **Expiry:** 7 days (configurable via `JWT_EXPIRES_IN` env var)
- **Secret rotation:** Change `JWT_SECRET` to invalidate all active sessions

**Generate a production-grade JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Login Security
- Rate limit: **10 attempts per 15 minutes per IP** (enforced in production)
- NoSQL injection guard: username and password validated as strings before any DB query
- Passwords: bcrypt hashed with cost factor 12

### Session Management
- JWT is stateless — no server-side session storage
- To force-logout a user: change their password (invalidates next token use indirectly)
- To invalidate all sessions company-wide: rotate `JWT_SECRET`

---

## 3. Authorization (RBAC)

### Roles and Permissions

| Role | Access Scope |
|------|-------------|
| `admin` | Full company access — all modules, all branches |
| `branch_manager` | Own branch — all operations within branch |
| `dispatcher` | Fleet, trips, dispatch, live operations |
| `warehouse_manager` | Warehouse module — all warehouses |
| `warehouse_staff` | Own warehouse — inbound, inventory, tasks |
| `driver` | Mobile app only — own trips, POD |
| `sales_executive` | CRM, leads, quotes, customers |
| `finance_manager` | Finance module — invoices, payments, reports |
| `customer_support` | Complaints, tickets, customer queries |
| `executive` | Read-only — all dashboards, reports |
| `customer` | Customer portal — own shipments only |

### Branch Isolation
Users with branch-scoped roles cannot see data from other branches, even within the same company. Branch isolation is enforced at the query level (not the UI level).

---

## 4. API Security

### Headers (set by `helmet` middleware)
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CORS
Configure `ALLOWED_ORIGINS` in `.env`:
```env
ALLOWED_ORIGINS=https://app.localwheels.com,https://localwheels.vercel.app
```
Never set `ALLOWED_ORIGINS=*` in production.

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 10 requests | 15 minutes |
| `/api/*` (global) | 300 requests | 15 minutes |

---

## 5. Data Security

### Tenant Isolation
Every query to a business collection includes `company_id`:
```js
// Example — enforced in every route handler
const results = await Shipment.find({ company_id: req.user.company_id });
```
Cross-tenant data access is architecturally impossible through the API.

### Sensitive Data Handling
| Data | Storage |
|------|---------|
| Passwords | bcrypt hash (cost 12) — never stored in plain text |
| JWT secret | Environment variable only — never in code or DB |
| API keys | SHA-256 hash stored; raw key shown once on creation |
| Voice transcripts | AES-256 encrypted at rest (VOICE_ENCRYPTION_KEY) |
| Payment data | Not stored — integrate with payment gateway for PCI compliance |

### MongoDB Security
- **Network:** Atlas VPC peering or IP allowlist (never allow 0.0.0.0/0)
- **Authentication:** Dedicated DB user per environment with least-privilege access
- **Encryption:** Atlas encrypts at rest and in transit by default
- **Backups:** Daily automated, 7-day retention, encrypted

---

## 6. Vulnerability Management

### npm Audit
Run weekly (automated in CI):
```bash
cd backend && npm audit
# Must return: found 0 vulnerabilities
```

Fix vulnerabilities:
```bash
npm audit fix          # safe fixes
npm audit fix --force  # breaking change allowed (test after)
```

### OWASP Top 10 Compliance Status (Phase 20 Audit)

| OWASP Category | Control | Status |
|----------------|---------|--------|
| A01 Broken Access Control | JWT + RBAC + tenant isolation | ✅ PASS |
| A02 Cryptographic Failures | bcrypt (12), AES-256, HTTPS | ✅ PASS |
| A03 Injection | NoSQL type guards, Mongoose parameterized | ✅ PASS |
| A04 Insecure Design | Rate limiting, audit logs | ✅ PASS |
| A05 Security Misconfiguration | helmet, CORS, no debug in prod | ✅ PASS |
| A06 Vulnerable Components | npm audit — 0 vulnerabilities | ✅ PASS |
| A07 Auth Failures | Rate limit, strong secrets | ✅ PASS |
| A08 Software Integrity | GitHub Actions, Docker digest | ✅ PASS |
| A09 Logging Failures | morgan + audit trail | ✅ PASS |
| A10 SSRF | No user-controlled URL fetching | ✅ PASS |

---

## 7. Incident Response

### Security Incident Classification

| Severity | Example | Response |
|----------|---------|---------|
| Critical | Data breach, privilege escalation | Immediately isolate, notify legal, Engineering on-call |
| High | Brute force attempt, anomalous data access | Block IP, rotate secrets, audit logs |
| Medium | Failed login spike, unusual API patterns | Monitor, alert, investigate |
| Low | Single failed auth, crawler traffic | Log, monitor |

### Immediate Response Checklist (Data Breach)
1. [ ] Identify scope — which company, which data, what time period
2. [ ] Isolate — disable affected API keys or company account
3. [ ] Preserve — snapshot MongoDB atlas point-in-time before any changes
4. [ ] Rotate — JWT_SECRET (invalidates all sessions), API keys
5. [ ] Notify — affected customers within 72 hours (GDPR requirement)
6. [ ] Investigate — audit logs in `auditlogs` collection
7. [ ] Remediate — fix root cause, deploy patch
8. [ ] Post-mortem — root cause, timeline, prevention

---

## 8. Secrets Management

### Required Secrets (never commit to git)
```env
MONGODB_URI=mongodb+srv://...    # Atlas connection string
JWT_SECRET=<64-byte-hex>         # Authentication signing key
ANTHROPIC_API_KEY=sk-ant-...     # AI features
VOICE_ENCRYPTION_KEY=<32-byte>  # Voice data encryption
REDIS_URL=redis://...            # Cache connection
```

### Secret Rotation Schedule
| Secret | Rotation Frequency |
|--------|-------------------|
| JWT_SECRET | Every 90 days (or on suspicion of compromise) |
| MONGODB_URI password | Every 180 days |
| ANTHROPIC_API_KEY | Annually or on suspected exposure |
| API Keys (per customer) | Customer-managed; auto-expire support coming |

### How to Rotate JWT_SECRET
```bash
# 1. Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Update in Render/environment dashboard
# (all active JWT tokens become invalid immediately)

# 3. Notify users that they will need to log in again
```

---

## 9. Audit Logs

All mutations are recorded in the `auditlogs` collection:
```json
{
  "company_id": "...",
  "user_id": "...",
  "username": "admin",
  "resource": "shipments",
  "action": "create",
  "entity_id": "...",
  "changes": { "before": {}, "after": {} },
  "ip_address": "...",
  "createdAt": "2026-07-02T10:00:00Z"
}
```

Query audit logs:
```js
// In MongoDB Atlas or via API
db.auditlogs.find({ company_id: ObjectId("..."), action: "delete" }).sort({ createdAt: -1 })
```

---

## 10. Production Security Checklist

- [ ] `JWT_SECRET` is a random 64-byte secret
- [ ] `NODE_ENV=production` is set
- [ ] `ALLOWED_ORIGINS` is set to exact production domain(s)
- [ ] MongoDB Atlas IP allowlist — only app server IPs
- [ ] MongoDB Atlas user has minimum required privileges
- [ ] Redis has AUTH password set
- [ ] HTTPS enforced (HTTP → HTTPS redirect at load balancer)
- [ ] Grafana admin password changed from default
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] Rate limiting active (verify by hitting login 11 times → 429)
- [ ] Audit logs enabled and shipping to monitoring
- [ ] Backup tested (restore verified on staging)
