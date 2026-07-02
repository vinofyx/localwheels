# LocalWheels Platform — Backup & Recovery Guide
**Version:** 1.0 | **Date:** 2026-07-02 | **Audience:** Operations, DevOps

---

## 1. Backup Strategy

### Recovery Objectives
| Objective | Target |
|-----------|--------|
| RPO (Recovery Point Objective) | ≤ 24 hours |
| RTO (Recovery Time Objective) | ≤ 4 hours |
| Data retention | 7 days (daily backups) |

### What is Backed Up

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| MongoDB Atlas | Atlas automated backups | Daily | 7 days |
| MongoDB Atlas | Point-in-time recovery | Continuous | 7 days |
| Redis | Persistence (AOF) | Continuous | Last state |
| Application code | Git (GitHub) | Every commit | Permanent |
| Environment variables | Render dashboard | Manual doc | Permanent |
| Docker images | Container registry | Every deploy | Last 10 |

---

## 2. MongoDB Atlas Backup

### Enable Automated Backups
1. Atlas Dashboard → Cluster → Backup tab
2. Enable: Cloud Backup (M10 tier and above)
3. Schedule: Daily at 02:00 UTC
4. Retention: 7 days

### Verify Backup Status
1. Atlas → Cluster → Backup → Snapshots
2. Confirm: Latest snapshot within last 24 hours
3. Confirm: Status = "Completed" (not "Failed")

### Take Manual Snapshot (before major operations)
```
Atlas → Cluster → Backup → Take Snapshot Now
Label: "pre-migration-2026-07-02"
```

### Point-in-Time Recovery (PITR)
Available for continuous backup (M10+):
1. Atlas → Cluster → Backup → Restore
2. Select: Point in Time
3. Enter: Exact timestamp to restore to
4. Target: New cluster (never restore to production directly)

---

## 3. Restore Procedure

### Restore to Staging (Verification Step)
**Always restore to staging first — never directly to production.**

1. **Create staging cluster** in Atlas (same region, M0 free tier for testing)
2. Atlas → Cluster (Production) → Backup → Restore
3. Select snapshot → Target: staging cluster
4. Wait ~10-30 minutes for restore to complete
5. **Verify data integrity** (see verification checklist below)
6. Only then restore to production (if required)

### Full Restore to Production
⚠️ **This will overwrite ALL production data. Requires manager approval.**

1. Confirm: Root cause of data loss is identified and fixed
2. Confirm: Application is in maintenance mode (set `MAINTENANCE=true` in env)
3. Atlas → Restore → Select snapshot → Target: production cluster
4. Wait for restore to complete
5. Verify data integrity
6. Remove maintenance mode
7. Notify all customers of data recovery window

---

## 4. Data Integrity Verification Checklist

After any restore, verify:

```bash
# Connect to restored cluster and run:
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.length);
  
  // Check key collections
  const companies  = await db.collection('companies').countDocuments();
  const users      = await db.collection('users').countDocuments();
  const shipments  = await db.collection('shipments').countDocuments();
  const invoices   = await db.collection('invoices').countDocuments();
  
  console.log({ companies, users, shipments, invoices });
  
  // Verify latest shipment timestamp
  const latest = await db.collection('shipments').findOne({}, { sort: { createdAt: -1 }});
  console.log('Latest shipment:', latest?.createdAt);
  
  await mongoose.disconnect();
});
"
```

Expected checks:
- [ ] Companies count matches expected
- [ ] Users count matches expected
- [ ] Shipments count within expected range
- [ ] Latest data timestamp matches RPO target
- [ ] Indexes are present (not lost in restore)

---

## 5. Application Backup

### Code / Configuration
- All code is in Git — push to GitHub on every commit
- No local-only code modifications allowed in production

### Environment Variables
Document all production environment variables (values only in secure vault):
```
MONGODB_URI=<Atlas connection string>
JWT_SECRET=<64-byte secret>
ANTHROPIC_API_KEY=<key>
VOICE_ENCRYPTION_KEY=<32-byte secret>
REDIS_URL=<Redis connection>
ALLOWED_ORIGINS=<frontend URL>
NODE_ENV=production
```

Store copies in:
- Primary: Render environment dashboard
- Secondary: Company password manager (1Password / Bitwarden)
- Tertiary: Printed in sealed envelope, locked cabinet

### Docker Images
- GitHub Actions builds and pushes image on every deploy
- Tag format: `localwheels/backend:main-<git-sha>`
- Keep last 10 images in registry

**Rollback to previous image:**
```bash
# Render: set Docker image tag in environment to previous SHA
# OR
docker run localwheels/backend:main-<previous-sha>
```

---

## 6. Disaster Recovery Scenarios

### Scenario 1: Backend Server Crash
**Impact:** API unavailable. Frontend shows "Unable to connect."
**RTO:** < 5 minutes

1. Render auto-restarts failed pods (< 1 minute)
2. If not auto-recovered: Manual redeploy in Render dashboard
3. Health check: `curl /api/health`
4. Alert customers if downtime > 5 minutes

### Scenario 2: Database Corruption / Accidental Delete
**Impact:** Data loss. Queries return wrong results.
**RTO:** 2-4 hours

1. Set maintenance mode immediately
2. Identify extent of data loss (Atlas audit log)
3. Restore to staging → verify → restore to production
4. Send customer communication with RCA

### Scenario 3: Redis Failure
**Impact:** Cache unavailable. System slower but functional.
**RTO:** < 1 minute (auto)

1. Application detects Redis unavailable — fails silently
2. All requests hit MongoDB directly (rate limiting uses memory fallback)
3. System is functional but may be 2-3x slower
4. No action required unless sustained (> 30 minutes)
5. If sustained: Restart Redis / provision new Redis instance

### Scenario 4: Full Region Outage (Cloud Provider)
**Impact:** Complete service unavailability.
**RTO:** 4-8 hours

1. MongoDB Atlas: Enable cross-region replica (pre-configured for DR tier)
2. Backend: Deploy to alternate region in Render
3. Frontend: Vercel is globally distributed — unaffected
4. DNS: Update `api.localwheels.com` to point to alternate region
5. Notify customers of extended outage

### Scenario 5: Security Breach / Data Exfiltration
**RTO:** Immediate response; full investigation ongoing

1. Rotate all secrets immediately (JWT_SECRET, DB password, API keys)
2. Disable affected user accounts
3. Preserve Atlas point-in-time snapshot for forensics
4. Engage legal team for breach notification requirements
5. Full audit log review in `auditlogs` collection

---

## 7. Backup Testing Schedule

| Test | Frequency | Procedure |
|------|-----------|-----------|
| Restore to staging | Monthly | Full Atlas snapshot restore → verify checklist |
| PITR test | Quarterly | Restore to 48h ago → compare document counts |
| Environment recovery | Annually | Rebuild from secrets + git → deploy to staging |
| DR simulation | Annually | Full region failover exercise |

**Important:** Log every test with date, result, and restoration time. Store in `docs/backup-test-log.md`.

---

## 8. Backup Test Log Template

```markdown
## Backup Test — [DATE]

**Type:** Monthly Restore Test
**Snapshot Used:** [snapshot ID]
**Snapshot Date:** [date/time]
**Restore Target:** Staging cluster
**Restore Start:** [time]
**Restore Complete:** [time]
**Total RTO:** [duration]

**Verification Results:**
- Companies: [count] ✅/❌
- Users: [count] ✅/❌
- Shipments: [count] ✅/❌
- Latest record timestamp: [timestamp] ✅/❌
- Indexes present: ✅/❌

**Issues Found:** [none / describe]
**Signed Off By:** [name, role]
```
