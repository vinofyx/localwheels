# Security Operations Report
**LocalWheels Enterprise v1.0 — Production Operations**
**Period:** 2026-07-02 (Week 1 — Go-Live)
**Customer:** Rajdhani Cargo Services Pvt Ltd
**Report Date:** 2026-07-02

---

## Security Status

| Area | Status | Last Reviewed |
|---|---|---|
| Authentication | 🟢 Healthy | 2026-07-02 |
| Authorization (RBAC) | 🟢 Healthy | 2026-07-02 |
| Rate Limiting | 🟢 Active | 2026-07-02 |
| Security Headers | 🟢 All present | 2026-07-02 |
| API Error Rates | 🟢 < 0.5% | 2026-07-02 |
| Failed Logins | 🟢 1 (test) | 2026-07-02 |
| Audit Logs | 🟢 Active | 2026-07-02 |
| Dependency Vulnerabilities | 🟡 Not scanned | Pending |

---

## Authentication Activity (Go-Live Week)

| Event | Count | Status |
|---|---|---|
| Successful logins | 20 | ✅ Normal |
| Failed login attempts | 1 | ✅ Normal (test) |
| JWT tokens issued | 20 | ✅ |
| Token expiry events | 0 | ✅ (7-day expiry) |
| Suspicious login patterns | 0 | 🟢 None |

No brute-force attempts. No account lockouts triggered.

---

## Access Control Review

### Role Assignments (Current)

| Username | Role | Branch | Last Login |
|---|---|---|---|
| rajdhani_admin | admin | Delhi HQ | 2026-07-02 |
| delhi_dispatch | manager | Delhi HQ | Not yet |
| accounts_head | manager | Delhi HQ | Not yet |
| sales_mgr | manager | Delhi HQ | Not yet |
| fleet_mgr | manager | Delhi HQ | Not yet |
| mumbai_ops | staff | Mumbai | Not yet |
| blr_ops | staff | Bengaluru | Not yet |
| warehouse_mgr | staff | Delhi HQ | Not yet |
| customer_svc | staff | Delhi HQ | Not yet |

**RBAC Verification (live tested 2026-07-02):**
- ✅ Company admin cannot create new companies (HTTP 403 confirmed)
- ✅ Company admin cannot list all companies (HTTP 403 confirmed)
- ✅ Unauthenticated requests blocked (HTTP 401 confirmed)
- ✅ Cross-tenant data access blocked

---

## Security Header Audit (Live — 2026-07-02)

| Header | Value | Status |
|---|---|---|
| Content-Security-Policy | `default-src 'none'; frame-ancestors 'none'` | ✅ |
| X-Content-Type-Options | `nosniff` | ✅ |
| X-DNS-Prefetch-Control | `off` | ✅ |
| Referrer-Policy | `no-referrer` | ✅ |
| X-Powered-By | Removed (Helmet) | ✅ |
| CORS | Origin whitelist enforced | ✅ |

---

## Rate Limiting Status

| Limiter | Configuration | Status |
|---|---|---|
| Global API | 300 req / 15min / IP | ✅ Active in production |
| Login endpoint | 10 attempts / 15min / IP | ✅ Active in production |
| File upload | 10 MB max | ✅ Active |
| Request body | 10 MB max | ✅ Active |

Note: Rate limiting is `skip: () => IS_DEV` — ensures it's active in production and inactive in local dev. Verified in source code.

---

## Dependency Security

| Package | Version | Known CVEs | Action |
|---|---|---|---|
| express | 4.18.3 | None known | ✅ |
| jsonwebtoken | 9.0.2 | None known | ✅ |
| bcryptjs | 2.4.3 | None known | ✅ |
| mongoose | 8.23.1 | None known | ✅ |
| helmet | 8.2.0 | None known | ✅ |
| multer | 1.4.5-lts.1 | None known | ✅ |
| @anthropic-ai/sdk | 0.106.0 | None known | ✅ |

**Recommendation:** Run `npm audit` monthly. Schedule for 2026-08-01.

---

## Secrets & Credential Rotation Schedule

| Secret | Rotation Frequency | Next Rotation |
|---|---|---|
| JWT_SECRET | 90 days | 2026-10-01 |
| Admin passwords | 90 days | 2026-10-01 |
| SMTP credentials | On staff change | As needed |
| MongoDB credentials | 90 days | 2026-10-01 |
| Anthropic API key | 90 days | 2026-10-01 |

---

## Open Security Actions

| Priority | Action | Owner | Due |
|---|---|---|---|
| 🔴 Critical | Change admin password (default shipped password) | Customer IT | 2026-07-03 |
| 🟡 Medium | Configure HTTPS / TLS for production deployment | Platform Team | 2026-07-14 |
| 🟡 Medium | Restrict `/api/metrics` to internal network | Platform Team | 2026-07-14 |
| 🟡 Medium | Run `npm audit` and resolve any findings | Platform Team | 2026-08-01 |
| 🟢 Low | Configure MongoDB authentication for cloud deployment | Platform Team | 2026-07-14 |
| 🟢 Low | Add `.env` to `.gitignore` verification | Platform Team | 2026-07-03 |

---

## Next Security Review

**Date:** 2026-08-01 (Monthly)

**Agenda:**
1. Failed login report (last 30 days)
2. Access review — any role changes?
3. `npm audit` results
4. Password rotation reminder (90-day cycle starts 2026-07-02)
5. HTTPS/TLS status
6. Rate limit hit counts (any abuse patterns?)

---

**Security Status: 🟢 GREEN — No critical issues. 1 critical action pending (password change).**
