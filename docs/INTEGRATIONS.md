# LocalWheels Platform — Integrations Configuration Guide
**Version:** 1.0 | **Date:** 2026-07-02 | **Audience:** DevOps, System Administrators

---

## Overview

LocalWheels integrates with the following external services. All integrations are optional — the platform degrades gracefully when a service is not configured (except MongoDB and JWT which are required).

| Integration | Required | Purpose | Provider Options |
|------------|----------|---------|-----------------|
| MongoDB Atlas | ✅ Required | Primary database | MongoDB Atlas |
| JWT Secret | ✅ Required | Authentication | (generate locally) |
| Redis | Recommended | Cache + rate limit | Redis Cloud, Upstash |
| Email SMTP | Recommended | Notifications | SendGrid, AWS SES |
| WhatsApp | Optional | Customer notifications | Twilio, WABA |
| SMS | Optional | Driver alerts, OTP | Twilio, MSG91 |
| AI (Claude) | Optional | AI features | Anthropic |
| File Storage | Optional | POD, documents | AWS S3, R2 |
| Payment Gateway | Optional | Online payments | Razorpay, Stripe |
| Monitoring | Optional | Error tracking | Sentry |

---

## 1. MongoDB Atlas (Required)

### Provision
1. Sign up at cloud.mongodb.com
2. Create Project → Build a Database
3. Select **M10** (minimum for production, $57/month)
4. Region: ap-south-1 (Mumbai) or closest to your users
5. Cluster Name: `localwheels-prod`

### Configure Access
1. **Database Access** → Add DB User
   - Username: `localwheels_prod`
   - Password: Generate Secure Password (save it)
   - Role: **readWrite** on `localwheels` database only
2. **Network Access** → Add IP Address
   - Add your backend server's IP(s)
   - Never use 0.0.0.0/0 in production

### Get Connection String
Cluster → Connect → Drivers → Node.js → Copy string:
```
mongodb+srv://localwheels_prod:<password>@cluster0.xxxxx.mongodb.net/localwheels?retryWrites=true&w=majority
```

### Enable Backups
Cluster → Backup tab → Enable Cloud Backup → Daily schedule

### Enable Monitoring Alerts
Project → Alerts → Add New Alert:
- Connections > 80% → Email
- Average query time > 200ms → Email
- Disk > 80% → Email + SMS

---

## 2. Redis Cloud (Recommended)

### Provision
1. Sign up at redis.com/try-free
2. Create Database
   - Name: `localwheels-cache`
   - Memory: 100MB (start) → scale as needed
   - Persistence: AOF (every second)
   - Eviction: `allkeys-lru`
3. Copy: Public Endpoint + Password

### Connection String Format
```
redis://:PASSWORD@redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com:PORT
```

### Verify
```bash
redis-cli -u $REDIS_URL ping
# Expected: PONG
```

**If Redis is not configured:** The platform works normally but slightly slower (no caching), and rate limiting uses in-process memory store (resets on restart).

---

## 3. Email / SMTP (Recommended)

### SendGrid Setup (Recommended)
1. Sign up at sendgrid.com
2. Settings → API Keys → Create API Key → Full Access
3. Configure sender: Settings → Sender Authentication → Verify your domain

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.XXXXXXXXXXXXXXXXXXXXXX
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=LocalWheels
```

### AWS SES Alternative
```env
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAXXXXXXXXXXXXXXXXXX
SMTP_PASS=BXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Test Email
```bash
# In backend directory:
node -e "
require('dotenv').config();
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
t.sendMail({
  from: process.env.SMTP_FROM,
  to: 'test@example.com',
  subject: 'LocalWheels SMTP Test',
  text: 'SMTP is working.'
}).then(i => console.log('Sent:', i.messageId)).catch(console.error);
"
```

**If Email is not configured:** Notifications are logged to console but not sent. System remains functional.

---

## 4. WhatsApp (Twilio) — Optional

### Setup
1. Sign up at twilio.com
2. Get Account SID and Auth Token from Console
3. For sandbox: Twilio → Messaging → Try WhatsApp
4. For production: Apply for WhatsApp Business Account (WABA)

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Test
```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  --data-urlencode "From=whatsapp:+14155238886" \
  --data-urlencode "To=whatsapp:+91XXXXXXXXXX" \
  --data-urlencode "Body=LocalWheels test message" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

**If WhatsApp is not configured:** Delivery notifications are queued but not sent. System remains functional.

---

## 5. SMS Gateway — Optional

### MSG91 (India — Recommended for domestic)
1. Sign up at msg91.com
2. Get Auth Key from Dashboard
3. Create Sender ID: `LCLWHL` (apply with DLT registration)

```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=XXXXXXXXXXXXXXXXXXXXXXXX
MSG91_SENDER_ID=LCLWHL
MSG91_ROUTE=4
```

### Twilio SMS (Global)
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_SMS_FROM=+1XXXXXXXXXX
```

**If SMS is not configured:** SMS alerts are logged but not sent.

---

## 6. AI — Anthropic Claude (Optional)

### Setup
1. Sign up at console.anthropic.com
2. API Keys → Create Key
3. Set usage limits to avoid runaway costs

```env
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXX
ANTHROPIC_MODEL=claude-sonnet-4-6
```

### Features that use AI
| Feature | Module | Fallback |
|---------|--------|---------|
| Lead Scoring | Sales CRM | Score = 50 (neutral) |
| Route Optimization | Control Tower | Static distance-based |
| Complaint Classification | Customer Support | Keyword matching |
| Finance Copilot | Finance | Disabled |
| Voice Intent Recognition | Voice Module | Disabled |
| Document OCR | Document Mgmt | Manual entry required |
| Maintenance Prediction | Fleet | Rule-based triggers |
| Digital Twin AI | Simulation | Static simulation |

**If AI is not configured:** All AI features degrade to rule-based fallback. No errors shown to users.

---

## 7. File Storage — AWS S3 (Optional)

### AWS S3 Setup
1. AWS Console → S3 → Create Bucket
   - Name: `localwheels-prod-uploads`
   - Region: ap-south-1
   - Block all public access: ✅
2. IAM → Create User `localwheels-s3`
   - Attach policy: `AmazonS3FullAccess` (or restricted policy below)
3. Create Access Key → Download

```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_REGION=ap-south-1
AWS_S3_BUCKET=localwheels-prod-uploads
```

### Restricted IAM Policy (recommended)
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::localwheels-prod-uploads/*"
  }]
}
```

**If Storage is not configured:** File uploads (POD photos, documents) are stored locally. Not suitable for multi-instance deployment.

---

## 8. Payment Gateway (Optional)

### Razorpay (India)
1. Sign up at razorpay.com
2. Settings → API Keys → Generate Key
3. Use Live keys for production (Test keys for testing)

```env
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**If Payment Gateway is not configured:** Online payment links are disabled. Invoice payments are recorded manually.

---

## 9. Environment Checklist

Before going live, verify each integration:

```bash
# Run the health check script
node backend/src/scripts/health-check.js --url https://api.yourdomain.com

# Check all env vars are set
node -e "
const required = ['MONGODB_URI','JWT_SECRET','ALLOWED_ORIGINS'];
const recommended = ['REDIS_URL','SMTP_HOST','ANTHROPIC_API_KEY'];
required.forEach(k => process.env[k]
  ? console.log('✅',k)
  : console.log('❌ MISSING:',k));
recommended.forEach(k => process.env[k]
  ? console.log('✅',k)
  : console.log('⚠️  optional:',k));
"
```
