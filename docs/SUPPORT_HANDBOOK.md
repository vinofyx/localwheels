# LocalWheels Platform — Support Handbook
**Version:** 1.0 | **Date:** 2026-07-02 | **Audience:** Customer Support Team

---

## 1. Support Overview

### SLA Tiers

| Priority | Definition | First Response | Resolution |
|----------|-----------|----------------|------------|
| P1 — Critical | System down, no workaround | 30 minutes | 4 hours |
| P2 — High | Core workflow blocked | 2 hours | 8 hours |
| P3 — Medium | Feature degraded, workaround exists | 4 hours | 24 hours |
| P4 — Low | Minor issue, enhancement request | 24 hours | 5 business days |

### Business Hours
- **Standard Support:** Mon–Sat, 9 AM–6 PM IST
- **Emergency (P1 only):** 24×7 via WhatsApp escalation hotline

---

## 2. Support Channels

| Channel | Use For | Contact |
|---------|---------|---------|
| In-app Help Desk | All issues | Gear icon → Help |
| Email | Non-urgent issues | support@localwheels.com |
| WhatsApp | Urgent issues | +91-XXXXXXXXXX |
| Phone | P1 emergencies | +91-XXXXXXXXXX |

---

## 3. Common Issues & Resolutions

### Authentication Issues

**"Invalid credentials" on login**
1. Verify username (lowercase, no spaces)
2. Check Caps Lock
3. Try password reset (Admin → Users → Reset Password)
4. Check if account is active (Admin → Users → Status)

**"Session expired" mid-workflow**
- JWT expires after 7 days. User must log in again.
- Sessions are stateless — no data is lost, just re-authenticate.

**User locked out (too many login attempts)**
- Rate limit: 10 attempts / 15 minutes
- Solution: Wait 15 minutes, or Admin resets the account

### LR / Shipment Issues

**LR not appearing in list**
- Check branch filter — LRs are branch-scoped
- Check date range filter
- Verify status filter (default: all active)

**Cannot generate LR number**
- LR series must be configured: Settings → LR Configuration
- Each branch has its own series

**POD not updating shipment status**
- POD upload triggers status change to "delivered"
- Verify file was actually uploaded (not just draft saved)

### Invoice / Finance Issues

**Invoice not generating**
- LR must be in "ready for billing" status
- Check if financial year is configured (Settings → Financial Year)
- Ensure chart of accounts is set up

**GST calculation wrong**
- Check tax rule applied to customer pricing
- Verify GST registration of customer (inter-state vs intra-state)

### Performance Issues

**Page loading slowly**
- Clear browser cache (Ctrl+Shift+Delete)
- Check internet connection
- If system-wide: check `/api/health` endpoint and Grafana dashboard

**Dashboard data not refreshing**
- Control Tower refreshes every 30s automatically
- Force refresh: Ctrl+Shift+R (hard reload)

---

## 4. Escalation Matrix

```
Level 1: Customer Support Agent
  └── Cannot resolve in 2 hours → Escalate to L2

Level 2: Senior Support / Team Lead
  └── Requires code change → Escalate to L3
  └── P1 active → Notify Engineering immediately

Level 3: Engineering On-Call
  └── Backend/database issue → Fix and deploy
  └── Data corruption → Invoke DR procedure

Level 4: Engineering Manager
  └── Breach of P1 SLA
  └── Multiple customers affected
  └── Security incident
```

**On-call contacts:** Maintained in the private support Slack channel.

---

## 5. Incident Response Procedure

### P1 Incident Steps
1. **Acknowledge** — Respond to customer within 30 minutes
2. **Assess** — Is it isolated (one user, one company) or system-wide?
3. **Communicate** — Post status update in status page + notify affected customers
4. **Diagnose** — Check logs: `GET /api/health`, Grafana error rate dashboard
5. **Fix or Workaround** — Provide workaround immediately; fix underlying cause
6. **Verify** — Confirm with customer that issue is resolved
7. **Post-Mortem** — Within 48 hours: root cause, timeline, prevention

### Status Page Template
```
[INVESTIGATING] We are aware of an issue affecting [module].
Our team is investigating. Next update in 30 minutes.

[UPDATE] Root cause identified: [brief description].
Expected resolution: [time]. All data is safe.

[RESOLVED] The issue has been resolved at [time].
Duration: [X] minutes. Root cause: [brief]. Full post-mortem to follow.
```

---

## 6. Common Diagnostics

### Check System Health
```bash
curl https://api.localwheels.com/api/health
# Expected: {"status":"ok","uptime":...,"database":"connected"}
```

### Check Backend Logs (Render)
1. Render Dashboard → localwheels-backend → Logs
2. Filter by: ERROR, WARN

### Check Frontend Errors
1. Open browser DevTools → Console
2. Look for red errors — collect full stack trace

### MongoDB Check (Atlas)
1. Atlas Dashboard → Cluster → Performance Advisor
2. Look for slow queries (>100ms)

---

## 7. Account Management

### Creating a New Company (Super Admin only)
1. Admin Panel → Companies → New Company
2. Fill: Name, GSTIN, Address, Contact
3. Assign Super Admin user
4. Configure: Financial Year, LR Series, Tax Rules
5. Run seed data if needed (optional)

### Adding a Branch
1. Admin → Branches → New Branch
2. Assign branch code, city, state
3. Assign Branch Manager user
4. Configure branch-level settings

### User Password Reset
```
Admin → Users → [Select User] → Reset Password
```
System sends temporary password to user's email.

### Deactivating a User
```
Admin → Users → [Select User] → Toggle Active → Confirm
```
Active JWT tokens remain valid until expiry (7 days). For immediate revocation, contact engineering.

---

## 8. Data & Privacy

### Data Export (Customer Request)
All company data can be exported from:
- **Reports → Export** (per module)
- **Admin → Data Export** (full company export — Engineering assisted)

### Data Deletion (GDPR/Right to Erasure)
Data deletion requires Engineering involvement. Process:
1. Customer submits written request
2. Support verifies identity and company ownership
3. Engineering schedules soft delete (30-day hold)
4. Hard delete after hold period

### Backup Information
- MongoDB Atlas: Daily automated backups, 7-day retention
- Point-in-time recovery: Available on M10+ tier
- Backup location: Same region as primary cluster, encrypted at rest

---

## 9. Support Metrics to Track

| Metric | Target |
|--------|--------|
| First Response Time (P1) | < 30 min |
| First Response Time (P2) | < 2 hours |
| Resolution Rate (first contact) | > 70% |
| Customer Satisfaction (CSAT) | > 4.5/5 |
| SLA Breach Rate | < 5% |
| Open tickets > 7 days | < 10 |

---

## 10. Maintenance Windows

| Type | Frequency | Time | Duration |
|------|-----------|------|---------|
| Backend deployments | As needed | Off-peak (2–4 AM IST) | < 5 min (rolling) |
| MongoDB maintenance | Monthly | Sunday 2 AM IST | 30 min |
| Security patches | Weekly (automated) | CI/CD pipeline | 0 downtime |
| Major upgrades | Quarterly | Saturday 2 AM IST | 2 hours |

Customer notification: 48 hours advance for planned maintenance.
