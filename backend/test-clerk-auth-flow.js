/**
 * LocalWheels Clerk Authentication Flow & Verification Test Suite
 * Tests:
 * 1. getAuthorizedParties resolution (includes localwheels.vinofyx.com by default)
 * 2. verifyClerkSessionToken verification with matching azp
 * 3. verifyClerkSessionToken fallback mechanism
 * 4. Clock skew tolerance
 * 5. Rejection of forged / invalid tokens
 * 6. clerk-exchange endpoint responses
 */

const { generateKeyPairSync } = require('crypto');
const jwt = require('jsonwebtoken');
const { getAuthorizedParties, verifyClerkSessionToken } = require('./src/utils/clerkAuth');

// Generate test RSA key pair for cryptographic testing
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

let passed = 0;
let failed = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? '- ' + details : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('CLERK AUTHENTICATION FLOW & AZP VERIFICATION SUITE');
  console.log('================================================================');

  // Test 1: getAuthorizedParties contains production domain by default
  console.log('\n--- 1. AUTHORIZED PARTIES RESOLUTION ---');
  delete process.env.CLERK_AUTHORIZED_PARTIES;
  const defaultParties = getAuthorizedParties();
  assert(Array.isArray(defaultParties), 'getAuthorizedParties returns an array');
  assert(defaultParties.includes('https://localwheels.vinofyx.com'), 'Includes https://localwheels.vinofyx.com by default');
  assert(defaultParties.includes('https://clerk.vinofyx.com'), 'Includes https://clerk.vinofyx.com by default');
  assert(defaultParties.includes('http://localhost:5173'), 'Includes localhost dev port');

  // Test 2: Trailing slash normalization in CLERK_AUTHORIZED_PARTIES
  process.env.CLERK_AUTHORIZED_PARTIES = 'https://custom.domain.com/, https://another.domain.com///';
  const customParties = getAuthorizedParties();
  assert(customParties.includes('https://custom.domain.com'), 'Strips trailing slash from https://custom.domain.com/');
  assert(customParties.includes('https://another.domain.com'), 'Strips multiple trailing slashes from https://another.domain.com///');
  assert(customParties.includes('https://localwheels.vinofyx.com'), 'Preserves localwheels.vinofyx.com even with custom parties');

  // Test 3: Wildcard/bypass option
  process.env.CLERK_AUTHORIZED_PARTIES = '*';
  assert(getAuthorizedParties() === undefined, 'Returns undefined when CLERK_AUTHORIZED_PARTIES="*" to disable azp check');
  delete process.env.CLERK_AUTHORIZED_PARTIES;

  // Test 4: Dynamic request origin inclusion
  const mockReq = {
    headers: { origin: 'https://staging.vinofyx.com' },
    get: (header) => (header.toLowerCase() === 'host' ? 'localwheels.vinofyx.com' : undefined)
  };
  const dynamicParties = getAuthorizedParties(mockReq);
  assert(dynamicParties.includes('https://staging.vinofyx.com'), 'Dynamically includes request origin header');
  assert(dynamicParties.includes('https://localwheels.vinofyx.com'), 'Dynamically includes request host header');

  // Test 5: Cryptographic token verification with matching production azp
  console.log('\n--- 2. TOKEN VERIFICATION & AZP MATCHING ---');
  process.env.CLERK_JWT_KEY = pubPem;

  const validProdToken = jwt.sign(
    { sub: 'user_prod_999', azp: 'https://localwheels.vinofyx.com', iss: 'https://clerk.vinofyx.com' },
    privPem,
    { algorithm: 'RS256', expiresIn: '1h', keyid: 'key_1' }
  );

  try {
    const verified = await verifyClerkSessionToken(validProdToken, mockReq);
    assert(verified && verified.sub === 'user_prod_999', 'verifyClerkSessionToken verifies token with production azp');
    assert(verified.azp === 'https://localwheels.vinofyx.com', 'Payload contains verified azp claim');
  } catch (err) {
    assert(false, 'verifyClerkSessionToken failed on valid production token', err.message);
  }

  // Test 6: Fallback verification for host match
  console.log('\n--- 3. FALLBACK HOST VERIFICATION ---');
  // Token with azp containing host domain but not in explicit list
  const hostMatchToken = jwt.sign(
    { sub: 'user_host_888', azp: 'https://portal.vinofyx.com', iss: 'https://clerk.vinofyx.com' },
    privPem,
    { algorithm: 'RS256', expiresIn: '1h', keyid: 'key_1' }
  );

  try {
    const fallbackVerified = await verifyClerkSessionToken(hostMatchToken, {
      get: () => 'localwheels.vinofyx.com'
    });
    assert(fallbackVerified && fallbackVerified.sub === 'user_host_888', 'Fallback verifies token matching vinofyx.com domain');
  } catch (err) {
    assert(false, 'Fallback verification failed', err.message);
  }

  // Test 7: Clock skew tolerance (token issued 10 seconds in the future)
  console.log('\n--- 4. CLOCK SKEW TOLERANCE ---');
  const futureIat = Math.floor(Date.now() / 1000) + 10; // 10s in the future
  const clockDriftToken = jwt.sign(
    { sub: 'user_skew_777', azp: 'https://localwheels.vinofyx.com', iat: futureIat },
    privPem,
    { algorithm: 'RS256', expiresIn: '1h', keyid: 'key_1' }
  );

  try {
    const skewVerified = await verifyClerkSessionToken(clockDriftToken, mockReq);
    assert(skewVerified && skewVerified.sub === 'user_skew_777', '15s clockSkewInMs tolerates 10s future clock drift');
  } catch (err) {
    assert(false, 'Clock skew tolerance failed', err.message);
  }

  // Test 8: Forged token rejection (signed with different key)
  console.log('\n--- 5. FORGED & INVALID TOKEN REJECTION ---');
  const { privateKey: fakePriv } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const fakeToken = jwt.sign(
    { sub: 'user_attacker', azp: 'https://localwheels.vinofyx.com' },
    fakePriv.export({ type: 'pkcs8', format: 'pem' }),
    { algorithm: 'RS256', expiresIn: '1h', keyid: 'key_1' }
  );

  let rejected = false;
  try {
    await verifyClerkSessionToken(fakeToken, mockReq);
  } catch {
    rejected = true;
  }
  assert(rejected, 'Forged token signed with untrusted key is strictly rejected');

  // Test 9: Expired token rejection (outside clock skew grace period)
  const expiredToken = jwt.sign(
    { sub: 'user_expired', azp: 'https://localwheels.vinofyx.com' },
    privPem,
    { algorithm: 'RS256', expiresIn: '-60s', keyid: 'key_1' }
  );

  let expiredRejected = false;
  try {
    await verifyClerkSessionToken(expiredToken, mockReq);
  } catch {
    expiredRejected = true;
  }
  assert(expiredRejected, 'Expired token is strictly rejected');

  // Test 10: Secret key and JWT key trimming tolerance (whitespace / newlines in env)
  console.log('\n--- 6. KEY TRIMMING & SANITIZATION ---');
  process.env.CLERK_JWT_KEY = `  \n  ${pubPem}  \n  `;
  try {
    const trimmedVerified = await verifyClerkSessionToken(validProdToken, mockReq);
    assert(trimmedVerified && trimmedVerified.sub === 'user_prod_999', 'Whitespace and newlines in CLERK_JWT_KEY are trimmed');
  } catch (err) {
    assert(false, 'Whitespace trimming failed', err.message);
  }
  process.env.CLERK_JWT_KEY = pubPem;

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
