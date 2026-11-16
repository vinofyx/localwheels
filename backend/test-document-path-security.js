require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'localwheels-dev-secret-key-change-in-production-123456';
const MONGO_URI = process.env.MONGODB_URI;

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
  console.log('DOCUMENT PATH SECURITY & RELATIVE CONTAINMENT VALIDATION');
  console.log('================================================================================');

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const Document = require('./src/models/Document');
  const Company = require('./src/models/Company');
  const User = require('./src/models/User');

  const compA = await Company.create({ name: 'PathSecurity Co A' });
  const compB = await Company.create({ name: 'PathSecurity Co B' });

  const userA = await User.create({
    username: 'user_a_' + Date.now(),
    role: 'admin',
    company_id: compA._id,
    is_active: true,
  });

  const userB = await User.create({
    username: 'user_b_' + Date.now(),
    role: 'admin',
    company_id: compB._id,
    is_active: true,
  });

  const tokenA = jwt.sign(
    { id: userA._id.toString(), username: userA.username, role: 'admin', company_id: compA._id.toString(), authTime: Date.now() },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const tokenB = jwt.sign(
    { id: userB._id.toString(), username: userB.username, role: 'admin', company_id: compB._id.toString(), authTime: Date.now() },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  const uploadsDir = path.resolve(__dirname, 'uploads/documents');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Create a real file inside uploadsDir
  const legitimateFile = path.join(uploadsDir, `legit_${Date.now()}.txt`);
  fs.writeFileSync(legitimateFile, 'Hello legitimate document');

  // Create legitimate doc in DB for Company A
  const legitDoc = await Document.create({
    company_id: compA._id,
    name: 'legit.txt',
    original_name: 'legit.txt',
    file_path: legitimateFile,
    mime_type: 'text/plain',
    size_bytes: 25,
  });

  // 1. Legitimate download by Company A succeeds
  const res1 = await fetch(`${BASE_URL}/api/documents/${legitDoc._id}/download`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(res1.status === 200, `Company A downloading own legitimate document returns 200 (got ${res1.status})`);

  // 2. Cross-company download by Company B returns 404 (isolation)
  const res2 = await fetch(`${BASE_URL}/api/documents/${legitDoc._id}/download`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  assert(res2.status === 404, `Company B downloading Company A's document returns 404 Not Found (got ${res2.status})`);

  // 3. Test ../ traversal
  const outsideFile = path.resolve(uploadsDir, '../outside.txt');
  fs.writeFileSync(outsideFile, 'outside data');
  const traverseDoc = await Document.create({
    company_id: compA._id,
    name: 'traverse.txt',
    original_name: 'traverse.txt',
    file_path: path.join(uploadsDir, '../outside.txt'),
    mime_type: 'text/plain',
    size_bytes: 10,
  });
  const res3 = await fetch(`${BASE_URL}/api/documents/${traverseDoc._id}/download`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(res3.status === 403, `../ traversal outside upload dir returns 403 Forbidden (got ${res3.status})`);

  // 4. Test sibling-directory prefix attack (e.g. uploads/documents_secret/confidential.txt)
  const siblingDir = path.resolve(uploadsDir + '_secret');
  if (!fs.existsSync(siblingDir)) fs.mkdirSync(siblingDir, { recursive: true });
  const siblingFile = path.join(siblingDir, 'secret.txt');
  fs.writeFileSync(siblingFile, 'confidential sibling data');

  const siblingDoc = await Document.create({
    company_id: compA._id,
    name: 'sibling.txt',
    original_name: 'sibling.txt',
    file_path: siblingFile,
    mime_type: 'text/plain',
    size_bytes: 25,
  });
  const res4 = await fetch(`${BASE_URL}/api/documents/${siblingDoc._id}/download`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(res4.status === 403, `Sibling-directory prefix attack returns 403 Forbidden (got ${res4.status})`);

  // 5. Test absolute system path traversal (e.g. C:\Windows\System32\drivers\etc\hosts or package.json)
  const sysDoc = await Document.create({
    company_id: compA._id,
    name: 'package.json',
    original_name: 'package.json',
    file_path: path.resolve(__dirname, 'package.json'),
    mime_type: 'application/json',
    size_bytes: 100,
  });
  const res5 = await fetch(`${BASE_URL}/api/documents/${sysDoc._id}/download`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(res5.status === 403, `Absolute path outside upload dir returns 403 Forbidden (got ${res5.status})`);

  // 6. Test Windows path separators with traversal (\..\..\)
  const winDoc = await Document.create({
    company_id: compA._id,
    name: 'win_traversal.txt',
    original_name: 'win_traversal.txt',
    file_path: `${uploadsDir}\\..\\..\\package.json`,
    mime_type: 'application/json',
    size_bytes: 100,
  });
  const res6 = await fetch(`${BASE_URL}/api/documents/${winDoc._id}/download`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  assert(res6.status === 403, `Windows backslash traversal (\\..\\..) returns 403 Forbidden (got ${res6.status})`);

  // Cleanup
  try {
    if (fs.existsSync(legitimateFile)) fs.unlinkSync(legitimateFile);
    if (fs.existsSync(outsideFile)) fs.unlinkSync(outsideFile);
    if (fs.existsSync(siblingFile)) fs.unlinkSync(siblingFile);
    if (fs.existsSync(siblingDir)) fs.rmdirSync(siblingDir);
    await Document.deleteMany({ _id: { $in: [legitDoc._id, traverseDoc._id, siblingDoc._id, sysDoc._id, winDoc._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await Company.deleteMany({ _id: { $in: [compA._id, compB._id] } });
  } catch (e) {
    console.warn('Cleanup warning:', e.message);
  }

  await mongoose.disconnect();
  console.log(`\nPath Security Tests: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
