require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const request = require('http');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'localwheels-dev-secret-key-change-in-production-123456';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localwheels_test';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================================');
  console.log('MULTER 2.x UPLOAD & SECURITY VALIDATION SUITE');
  console.log('================================================================================');

  // Verify Multer version loaded
  const multerPkg = require('multer/package.json');
  console.log(`Loaded Multer version: ${multerPkg.version}`);
  assert(multerPkg.version.startsWith('2.'), `Multer is upgraded to v2.x (active: ${multerPkg.version})`);

  // Connect to DB
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');
  } catch (e) {
    console.log('MongoDB connection skipped/failed:', e.message);
  }

  // Create test user in DB
  const User = require('./src/models/User');
  const Company = require('./src/models/Company');
  const comp = await Company.create({ name: 'UploadTest Co' });
  const user = await User.create({
    username: 'upload_tester_' + Date.now(),
    role: 'admin',
    company_id: comp._id,
    is_active: true,
  });

  const testCompanyId = comp._id;
  const testUserId = user._id;
  const token = jwt.sign(
    { id: testUserId.toString(), username: user.username, role: 'admin', company_id: testCompanyId.toString(), authTime: Date.now() },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  // Require Express app from src/index.js (or create a dedicated mini test app using our routes)
  const app = express();
  app.use(express.json());
  
  // Mount routes
  app.use('/api/documents', require('./src/routes/documents'));
  app.use('/api/import', require('./src/routes/import'));
  app.use('/api/pod', require('./src/routes/pod'));

  // Global error handler matching index.js
  app.use((err, req, res, _next) => {
    if (err.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size exceeds allowed limit' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    if (err.message?.startsWith('Invalid file type') || err.message?.startsWith('Disallowed file')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  });

  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Test CSV Import with invalid file extension (.png)
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const invalidBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="malicious.png"\r\n` +
      `Content-Type: image/png\r\n\r\n` +
      `PNG_FAKE_BYTES\r\n` +
      `--${boundary}--\r\n`;

    const res1 = await fetch(`${baseUrl}/api/import/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: invalidBody,
    });
    const data1 = await res1.json();
    assert(res1.status === 400, `Import rejected disallowed .png file with 400 (got ${res1.status})`);
    assert(data1.error && data1.error.includes('Only CSV files'), `Import error specifies CSV requirement: ${data1.error}`);

    // 2. Test CSV Import with valid CSV
    const validCsvBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="customers.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `name,phone,email\nAcme Corp,9999988888,acme@test.com\r\n` +
      `--${boundary}--\r\n`;

    const res2 = await fetch(`${baseUrl}/api/import/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: validCsvBody,
    });
    // Will be 200 (or 400 if validation requires more fields, but NOT file rejection)
    assert(res2.status !== 500, `Valid CSV passed Multer filter without crashing (status: ${res2.status})`);

    // 3. Test POD with disallowed file (.exe)
    const exeBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="exploit.exe"\r\n` +
      `Content-Type: application/x-msdownload\r\n\r\n` +
      `MZ_FAKE_BINARY\r\n` +
      `--${boundary}--\r\n`;

    const res3 = await fetch(`${baseUrl}/api/pod/ship123/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: exeBody,
    });
    const data3 = await res3.json();
    assert(res3.status === 400, `POD rejected .exe file with 400 (got ${res3.status})`);
    assert(data3.error && data3.error.includes('Invalid file type'), `POD returned clean error: ${data3.error}`);

    // 4. Test Documents upload with disallowed extension (.sh)
    const shBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="script.sh"\r\n` +
      `Content-Type: application/x-sh\r\n\r\n` +
      `#!/bin/bash\r\necho hi\r\n` +
      `--${boundary}--\r\n`;

    const res4 = await fetch(`${baseUrl}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: shBody,
    });
    const data4 = await res4.json();
    assert(res4.status === 400, `Documents rejected .sh script with 400 (got ${res4.status})`);
    assert(data4.error && data4.error.includes('Disallowed file'), `Documents returned clean error: ${data4.error}`);

    // 5. Test Multer oversized file rejection (POD limit is 5MB)
    // We send a body that exceeds 5MB
    const bigChunk = 'X'.repeat(1024 * 1024 * 6); // 6MB
    const bigBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="large.jpg"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n` +
      `${bigChunk}\r\n` +
      `--${boundary}--\r\n`;

    const res5 = await fetch(`${baseUrl}/api/pod/ship123/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bigBody,
    });
    const data5 = await res5.json();
    assert(res5.status === 413 || res5.status === 400, `Oversized file rejected with 413 or 400 (got ${res5.status})`);
    assert(data5.error && (data5.error.includes('File size') || data5.error.includes('limit') || data5.error.includes('large')), `Clean limit error message returned: ${data5.error}`);

  } finally {
    server.close();
    try {
      const User = require('./src/models/User');
      const Company = require('./src/models/Company');
      await User.deleteMany({ username: /^upload_tester_/ });
      await Company.deleteMany({ name: 'UploadTest Co' });
    } catch {}
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  console.log('================================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================================');
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
