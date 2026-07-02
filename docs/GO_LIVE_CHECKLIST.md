# LocalWheels Platform — Production Go-Live Checklist
Version 1.0 | Phase 21 | Date: 2026-07-02

---

## PRE-LAUNCH INFRASTRUCTURE

### Database
- [x] MongoDB Atlas cluster provisioned (M10 minimum for production)
- [x] MongoDB Atlas backups enabled (daily, 7-day retention)
- [x] Point-in-time recovery enabled
- [x] MongoDB Atlas VPC peering or IP allowlist configured
- [x] Indexes created on all 217 collections (Phase 20 audit — 10 fixed)
- [ ] Perform baseline load test on Atlas M10+ tier
- [ ] Enable MongoDB Atlas Performance Advisor
- [ ] Atlas alerts configured (disk, connections, latency)

### Application Servers
- [x] Backend deployed on Render / AWS (Node.js 20 LTS)
- [x] Frontend deployed on Vercel
- [x] Environment variables set in production (see .env.example)
- [x] HTTPS/SSL active on all endpoints
- [x] Custom domain configured (api.your-domain.com + app.your-domain.com)
- [x] Health check probe: `/api/health` every 30s
- [ ] CDN configured for frontend static assets (Vercel handles this)
- [ ] Auto-scaling configured (Render: auto-scale instances)

### Caching & Queues
- [x] Redis Cloud instance provisioned
- [x] REDIS_URL set in backend environment
- [ ] Redis maxmemory policy set to `allkeys-lru`
- [ ] Test Redis failover behavior
- [ ] Redis persistence (AOF) enabled

### Monitoring
- [x] Prometheus scraping /api/metrics at 15s intervals
- [x] Grafana dashboards configured (API latency, error rate, DB health)
- [ ] Alerting rules configured (p99 > 2s, error rate > 5%, DB disconnect)
- [ ] PagerDuty / Slack webhook for critical alerts
- [ ] UptimeRobot monitoring /api/health every 5 minutes
- [ ] Log aggregation set up (Datadog / CloudWatch) for 90-day retention

---

## SECURITY CHECKLIST

- [x] JWT_SECRET is a random 64-byte secret (not a default value)
- [x] All API endpoints require authentication (131/131 verified)
- [x] NoSQL injection in auth login fixed (Phase 19.7)
- [x] Rate limiting active: 10 login/15min, 300 API/15min
- [x] CORS restricted to production domain (ALLOWED_ORIGINS in .env)
- [x] HTTPS enforced (HTTP → HTTPS redirect)
- [x] WhatsApp webhook requires authentication
- [x] Audit logs active for all mutations
- [x] npm audit: 0 vulnerabilities (Phase 20 — 2 critical fixed)
- [x] OWASP Top 10 — all controls verified (Phase 20)
- [ ] Admin default password changed on first login
- [ ] All user default passwords changed
- [ ] Penetration test scheduled with security team
- [ ] OWASP ZAP dynamic scan completed on staging
- [ ] Secrets rotation schedule defined and documented

---

## DEPLOYMENT VALIDATION

- [x] Docker build passes (backend + frontend)
- [x] Docker Compose stack starts cleanly
- [x] GitHub Actions CI pipeline configured (4 jobs)
- [x] Health check endpoint returns 200 within 5 seconds of start
- [x] Database connection verified in production
- [x] All 131 API route files responding (Phase 20 — 100% pass rate)
- [x] All 417 frontend pages routed (Phase 19.6)
- [x] Frontend build: 0 errors
- [ ] Blue-green deployment tested
- [ ] Rollback procedure tested (previous Docker image tag)
- [ ] render.yaml verified correct for production

---

## PRODUCTION DATA SETUP

- [x] Seed script created (backend/src/scripts/seed-production.js)
- [ ] Seed script run on production database
- [ ] Company profile configured (name, GSTIN, address, logo)
- [ ] Financial year set (2026-27: Apr 2026 – Mar 2027)
- [ ] LR series configured per branch
- [ ] At least one branch created per operational city
- [ ] All staff user accounts created (all 12 roles)
- [ ] Customer master data imported / seeded
- [ ] Vehicle master data imported / seeded
- [ ] Driver master data imported / seeded
- [ ] Chart of Accounts verified and complete
- [ ] Opening balances entered in accounts

---

## TRAINING & DOCUMENTATION

- [x] Admin Manual (docs/manuals/ADMIN_MANUAL.md)
- [x] Dispatcher Manual (docs/manuals/DISPATCHER_MANUAL.md)
- [x] Driver Manual (docs/manuals/DRIVER_MANUAL.md)
- [x] Finance Manual (docs/manuals/FINANCE_MANUAL.md)
- [x] Warehouse Manual (docs/manuals/WAREHOUSE_MANUAL.md)
- [x] Sales Manual (docs/manuals/SALES_MANUAL.md)
- [x] Quick Start: Admin (docs/training/QUICK_START_ADMIN.md)
- [x] Quick Start: Dispatcher (docs/training/QUICK_START_DISPATCHER.md)
- [x] Quick Start: Warehouse (docs/training/QUICK_START_WAREHOUSE.md)
- [x] Quick Start: Driver (docs/training/QUICK_START_DRIVER.md)
- [x] Quick Start: Finance (docs/training/QUICK_START_FINANCE.md)
- [x] Quick Start: Customer (docs/training/QUICK_START_CUSTOMER.md)
- [x] Architecture Documentation (docs/ARCHITECTURE.md)
- [x] API Reference (docs/API.md)
- [x] Deployment Guide (docs/DEPLOYMENT.md)
- [x] Operations Runbook (docs/OPERATIONS.md)
- [x] Support Handbook (docs/SUPPORT_HANDBOOK.md)
- [x] Security Guide (docs/SECURITY_GUIDE.md)
- [x] Monitoring Guide (docs/MONITORING_GUIDE.md)
- [x] Backup & Recovery Guide (docs/BACKUP_RECOVERY.md)
- [x] Release Notes v1.0 (docs/RELEASE_NOTES_v1.0.md)
- [x] Version 1.0 Release Certificate (docs/VERSION_1_RELEASE_CERTIFICATE.md)
- [ ] Training sessions conducted with all staff roles
- [ ] Video tutorials recorded (future)

---

## UAT SIGN-OFF

- [x] Phase 19.6 UAT: 417/417 nav paths working
- [x] Phase 19.6 UAT: All business module APIs validated
- [x] Phase 19.7 UAT: Security hardening complete
- [x] Phase 19.7 UAT: Performance optimization complete
- [x] Phase 20: Final certification — 131/131 APIs, 217 indexes, 0 vulns
- [ ] Pilot Company 1 sign-off (4-week pilot)
- [ ] Pilot Company 2 sign-off (4-week pilot)
- [ ] Pilot Company 3 sign-off (4-week pilot)
- [ ] UAT sign-off from: Dispatcher role
- [ ] UAT sign-off from: Finance role
- [ ] UAT sign-off from: Warehouse role
- [ ] UAT sign-off from: Executive role
- [ ] UAT sign-off from: Customer role

---

## SUPPORT READINESS

- [x] Support Handbook documented
- [x] Escalation matrix defined
- [x] SLA tiers defined (P1-P4)
- [x] Incident response procedure documented
- [x] Backup & recovery guide created
- [ ] Support team trained (2-day session)
- [ ] Helpdesk ticketing system configured
- [ ] Customer onboarding email template ready
- [ ] WhatsApp support number configured in system
- [ ] On-call schedule set up

---

## GO/NO-GO DECISION

| Area | Engineering Status | Pilot Status | Sign-off |
|------|-------------------|--------------|---------|
| Infrastructure | ✅ Ready | Pending pilot | Pending |
| Security | ✅ Ready | Pending ZAP scan | Pending |
| API Coverage | ✅ 100% (131/131) | Pending pilot | Pending |
| Frontend | ✅ 100% (417/417) | Pending pilot | Pending |
| Documentation | ✅ Complete (20 docs) | — | ✅ |
| Seed Data | ✅ Script ready | Pending run | Pending |
| Training Materials | ✅ Complete | Pending delivery | Pending |
| Support | ✅ Documented | Pending team training | Pending |
| Monitoring | ✅ Configured | Pending production | Pending |
| Pilot Users | — | 3 companies targeted | Pending |

**GO-LIVE DATE:** To be confirmed after pilot user sign-off
**ROLLBACK TRIGGER:** >5 Critical bugs in first 48 hours of production
**ROLLBACK PROCEDURE:** Revert to previous Docker image tag, restore last MongoDB Atlas snapshot
