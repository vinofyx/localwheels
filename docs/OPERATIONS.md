# LocalWheels — Operations Manual

## 1. Monitoring & Health

### Health Endpoint
```
GET /api/health
```
Returns DB state, memory usage, uptime. Any `"ready": false` means DB is disconnected — check MongoDB.

### Prometheus Metrics
```
GET /api/metrics
```
Grafana is pre-configured to scrape this at `http://backend:5000/api/metrics` every 15s.

Access Grafana: `http://your-server:3000` (admin / $GRAFANA_PASSWORD)

### Key Metrics to Watch
| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| `mongodb_connected` | = 0 | Restart MongoDB / check connection string |
| `process_heap_used_bytes` | > 400MB | Restart backend pod, check for memory leak |
| `http_requests_total` (5xx) | > 10/min | Check backend logs immediately |
| `process_uptime_seconds` | = 0 (reset) | Backend crashed — check PM2/Docker logs |

---

## 2. Log Management

### Backend Logs (Morgan)
```bash
# Docker
docker compose logs -f backend

# PM2
pm2 logs localwheels-backend --lines 200

# Live tail
pm2 logs localwheels-backend
```

### Log Patterns to Watch
- `[Redis] error:` — Redis unavailable; cache is disabled but app continues
- `[Cache] redis error:` — Transient cache error; requests still succeed
- `MongoNetworkError` — MongoDB connectivity issue
- `JWT expired` / `invalid signature` — Token issues (expected); only alert if rate is high

---

## 3. Common Issues & Fixes

### Backend returns 502 / not reachable
```bash
# Check if backend is running
docker compose ps backend
# Or PM2
pm2 list

# Restart
docker compose restart backend
# Or
pm2 restart localwheels-backend
```

### MongoDB connection failed
```bash
# Check connection string in .env
grep MONGODB_URI backend/.env

# Test connectivity
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"
```

### JWT errors (401 on all requests)
- Verify `JWT_SECRET` in `.env` matches the secret used to sign existing tokens
- If secret was rotated, all users must re-login

### AI endpoints returning errors
- Check `ANTHROPIC_API_KEY` in `.env`
- Verify the key is active at console.anthropic.com
- AI errors are graceful — other endpoints unaffected

### Redis not connecting
- App continues without cache — not a critical error
- Check `REDIS_URL` format: `redis://:password@host:6379`
- Verify Redis is running: `docker compose ps redis`

---

## 4. Performance Tuning

### MongoDB Indexes
All Phase indexes are defined in model files. Run this to verify:
```javascript
// In mongosh
use localwheels
db.shipments.getIndexes()
db.invoices.getIndexes()
```

### Redis Cache Hit Rate
Check `X-Cache: HIT` headers on GET requests. If hit rate < 30%, increase TTL or add cache to more routes.

### Node.js Memory
If `heap_used_mb` stays above 300MB for extended periods:
```bash
# Generate heap snapshot
kill -USR2 $(pm2 id localwheels-backend)
# Then analyze with Chrome DevTools
```

---

## 5. Security Checklist

Run these checks after any deployment:

- [ ] `JWT_SECRET` is 64+ chars, not default value
- [ ] `NODE_ENV=production` is set
- [ ] `ALLOWED_ORIGINS` lists only your domains
- [ ] `/api/whatsapp/send` requires auth (verify: `curl -X POST /api/whatsapp/send` → 401)
- [ ] Rate limiting active: 6 rapid requests to `/api/auth/login` → 429
- [ ] No secrets in git: `git log --all --oneline -- "*.env"` should be empty

---

## 6. Incident Response Playbook

### Severity 1 — Site Down
1. Check `/api/health` → determine if backend or DB issue
2. Check Docker: `docker compose ps`
3. Restart affected service: `docker compose restart <service>`
4. If DB down: check MongoDB Atlas dashboard or local mongod
5. Notify stakeholders within 15 minutes

### Severity 2 — Degraded (Slow / Partial)
1. Check Grafana dashboards for bottleneck
2. Check `process_heap_used_bytes` — if high, restart backend
3. Check MongoDB slow query logs
4. Check if Redis is down (cache miss storm)

### Severity 3 — Feature Not Working
1. Check browser console for errors
2. Reproduce with curl to isolate frontend vs backend
3. Check backend logs for the specific route
4. Check MongoDB for data integrity issues

---

## 7. On-Call Runbook

### Morning Check (daily)
```bash
curl https://yourdomain.com/api/health | jq .
# Verify: status=ok, db.ready=true, memory.heap_used_mb < 300
```

### Weekly
- Review Grafana dashboards for trends
- Check MongoDB storage usage in Atlas
- Run `npm audit` in backend and frontend
- Review error rate in Prometheus

### Monthly
- Rotate JWT_SECRET (plan for user re-login)
- Review and archive old audit logs
- Test backup restore procedure
- Review rate limit thresholds

---

## 8. Backup & Recovery

### Database Backup
```bash
# Manual backup
mongodump --uri="$MONGODB_URI" --gzip --out=/backups/manual-$(date +%Y%m%d)

# Restore
mongorestore --uri="$MONGODB_URI" --gzip /backups/manual-20260702
```

### Disaster Recovery
1. Provision new server/container
2. Restore latest backup
3. Copy `.env` from secrets vault
4. Run `docker compose up -d`
5. Verify with `/api/health`
6. Update DNS to point to new server
7. Estimated RTO: 30 minutes
