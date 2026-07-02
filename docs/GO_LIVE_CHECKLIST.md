# LocalWheels Platform — Production Go-Live Checklist
Version 1.0 | Phase 19.7 | Date: 2026-07-02

## PRE-LAUNCH INFRASTRUCTURE

### Database
- [x] MongoDB Atlas cluster provisioned (M10 minimum for production)
- [x] MongoDB Atlas backups enabled (daily, 7-day retention)
- [x] MongoDB Atlas VPC peering or IP allowlist configured
- [x] Indexes created on all high-traffic collections (company_id, branch_id, status)
- [ ] Perform baseline load test on Atlas tier
- [ ] Enable MongoDB Atlas Performance Advisor

### Application Servers
- [x] Backend deployed on Render / AWS (Node.js 20 LTS)
- [x] Frontend deployed on Vercel / Nginx
- [x] Environment variables set in production (see .env.example)
- [x] HTTPS/SSL active on all endpoints
- [x] Custom domain configured (api.your-domain.com + app.your-domain.com)
- [ ] CDN configured for frontend static assets

### Caching & Queues
- [x] Redis Cloud instance provisioned
- [x] REDIS_URL set in backend environment
- [ ] Redis maxmemory policy set to `allkeys-lru`
- [ ] Test Redis failover

### Monitoring
- [x] Prometheus scraping /api/metrics at 15s intervals
- [x] Grafana dashboards active (API latency, error rate, DB health)
- [ ] Alerting rules configured (p99 > 2s, error rate > 5%, DB disconnect)
- [ ] PagerDuty / Slack webhook for critical alerts
- [ ] Uptime monitoring (UptimeRobot / Pingdom) on /api/health

## SECURITY CHECKLIST

- [x] JWT_SECRET is a random 64-byte secret (not a default value)
- [x] All API endpoints require authentication (verified in Phase 19.6)
- [x] NoSQL injection in auth login fixed (Phase 19.7)
- [x] Rate limiting active: 10 login/15min, 300 API/15min
- [x] CORS restricted to production domain (ALLOWED_ORIGINS in .env)
- [x] HTTPS enforced (HTTP → HTTPS redirect)
- [x] WhatsApp webhook requires authentication
- [x] Audit logs active for all mutations
- [ ] Penetration test scheduled with security team
- [ ] OWASP ZAP scan completed on staging
- [ ] Secrets rotation schedule defined

## DEPLOYMENT VALIDATION

- [x] Docker build passes (backend + frontend)
- [x] Docker Compose stack starts cleanly
- [x] GitHub Actions CI pipeline passing (4 jobs)
- [x] Health check endpoint returns 200 within 5 seconds of start
- [x] Database connection verified in production
- [x] All 100+ API routes responding
- [ ] Blue-green deployment tested
- [ ] Rollback procedure documented and tested

## BUSINESS READINESS

- [x] Admin account created and configured
- [x] Company profile configured
- [x] At least one branch created
- [x] Financial year set
- [x] User roles configured for all staff
- [ ] Customer master data imported
- [ ] Vehicle master data imported
- [ ] Driver master data imported
- [ ] Opening balances entered in accounts

## UAT SIGN-OFF

- [x] Phase 19.6 UAT: 417/417 nav paths working
- [x] Phase 19.6 UAT: All business module APIs validated
- [x] Phase 19.6 UAT: Security guard on all 16 critical endpoints
- [x] Phase 19.7 UAT: NoSQL injection fixed
- [x] Phase 19.7 UAT: Control Tower performance improved 6.7x
- [x] Phase 19.7 UAT: Frontend build clean
- [ ] UAT sign-off from: Dispatcher (2 users)
- [ ] UAT sign-off from: Finance (2 users)
- [ ] UAT sign-off from: Warehouse (3 users)
- [ ] UAT sign-off from: Executive (1 user)
- [ ] UAT sign-off from: Customer (5 users)

## DOCUMENTATION

- [x] API Reference (docs/API.md)
- [x] Deployment Guide (docs/DEPLOYMENT.md)
- [x] Operations Runbook (docs/OPERATIONS.md)
- [x] Admin Manual (docs/manuals/ADMIN_MANUAL.md)
- [x] Dispatcher Manual (docs/manuals/DISPATCHER_MANUAL.md)
- [x] Driver Manual (docs/manuals/DRIVER_MANUAL.md)
- [x] Finance Manual (docs/manuals/FINANCE_MANUAL.md)
- [x] Warehouse Manual (docs/manuals/WAREHOUSE_MANUAL.md)
- [x] Sales Manual (docs/manuals/SALES_MANUAL.md)

## SUPPORT READINESS

- [ ] Support team trained on the platform
- [ ] Helpdesk ticketing configured
- [ ] Customer onboarding email template ready
- [ ] WhatsApp support number configured in system

## GO/NO-GO DECISION

| Area | Status | Sign-off |
|------|--------|----------|
| Infrastructure | Ready | Pending |
| Security | Ready | Pending |
| UAT | Ready (pilot users pending) | Pending |
| Documentation | Complete | ✅ |
| Support | Pending | Pending |
| Data Migration | Pending | Pending |

**GO-LIVE DATE:** To be confirmed after pilot user sign-off
**ROLLBACK TRIGGER:** >10 critical bugs in first 24 hours of production
**ROLLBACK PROCEDURE:** Revert to previous Docker image tag, restore last MongoDB snapshot
