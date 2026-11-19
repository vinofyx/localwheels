/**
 * test-clerk-account-linking.js
 * Comprehensive regression tests for Clerk & Google OAuth account linking,
 * verified email enforcement, and mismatched Clerk ID resolution.
 */

const mongoose = require('./node_modules/mongoose');
const path = require('path');
const dotenv = require('./node_modules/dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');
const Company = require('./src/models/Company');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failed++;
  }
}

/**
 * Simulates the account resolution and linking logic of /api/auth/clerk-exchange
 */
async function simulateClerkExchange({ clerkUserId, clerkUser }) {
  // Target email resolution (prioritize verified primary, or match verified secondary)
  let targetEmailObj = clerkUser.emailAddresses?.find(
    e => e.id === clerkUser.primaryEmailAddressId
  ) || clerkUser.emailAddresses?.[0];

  if (targetEmailObj && clerkUser.emailAddresses?.length > 1) {
    const primaryCanonical = (targetEmailObj.emailAddress || '').toLowerCase().trim();
    const primaryExists = await User.exists({ email: primaryCanonical, is_active: true });
    if (!primaryExists) {
      const matchingVerified = clerkUser.emailAddresses.find(
        e => e.verification?.status === 'verified' && e.id !== targetEmailObj.id
      );
      if (matchingVerified) {
        const matchCanonical = (matchingVerified.emailAddress || '').toLowerCase().trim();
        if (await User.exists({ email: matchCanonical, is_active: true })) {
          targetEmailObj = matchingVerified;
        }
      }
    }
  }

  const primaryEmail = targetEmailObj?.emailAddress;
  if (!primaryEmail) {
    return { status: 400, error: 'Your Clerk account has no email address.' };
  }

  const emailVerified = targetEmailObj?.verification?.status === 'verified';
  if (!emailVerified) {
    return {
      status: 403,
      error: 'Your email address is not verified with Clerk. Please verify your email before signing in.',
      code: 'EMAIL_NOT_VERIFIED',
    };
  }

  const canonicalEmail = primaryEmail.toLowerCase().trim();
  const clerkFullName  = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

  // ── 3. Find by clerkId (returning user, fastest path) ────────────────────
  let lwUser = await User.findOne({ clerkId: clerkUserId });

  // ── 4. Find by email (existing LW user — account linking & migration) ───
  if (!lwUser) {
    const matchingUsers = await User.find({ email: canonicalEmail, is_active: true })
      .sort({ lastLogin: -1, createdAt: 1 });

    if (matchingUsers.length > 0) {
      lwUser = matchingUsers[0];

      // Ensure no other LocalWheels user already has this clerkUserId
      const conflict = await User.findOne({ clerkId: clerkUserId, _id: { $ne: lwUser._id } });
      if (conflict) {
        return {
          status: 409,
          error: 'This Clerk account is already linked to a different LocalWheels account. Contact your administrator.',
          code: 'CLERK_ACCOUNT_CONFLICT',
        };
      }

      // Secure account linking / migration
      await User.findByIdAndUpdate(lwUser._id, {
        clerkId:       clerkUserId,
        authProvider:  'clerk',
        emailVerified: true,
        lastLogin:     new Date(),
        ...(clerkFullName && !lwUser.full_name ? { full_name: clerkFullName } : {}),
      });
      lwUser = await User.findById(lwUser._id);
    }
  } else {
    // Returning Clerk user — verify email hasn't changed
    if (lwUser.email && lwUser.email.toLowerCase() !== canonicalEmail) {
      return {
        status: 409,
        error: 'Clerk email address has changed. Contact your administrator to update your account.',
        code: 'EMAIL_CHANGED_CONFLICT',
      };
    }
    await User.findByIdAndUpdate(lwUser._id, {
      lastLogin:     new Date(),
      emailVerified: true,
      ...(clerkFullName && !lwUser.full_name ? { full_name: clerkFullName } : {}),
    });
    lwUser = await User.findById(lwUser._id);
  }

  // ── 5. Auto-create LW user ─────────────────────────────────────────────
  let isNewUser = false;
  if (!lwUser) {
    const defaultCompany = await Company.findOne({ is_active: true }).lean();
    const username = `oauth_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    lwUser = await User.create({
      username,
      email:         canonicalEmail,
      full_name:     clerkFullName || username,
      role:          'staff',
      is_active:     true,
      company_id:    defaultCompany?._id || null,
      clerkId:       clerkUserId,
      authProvider:  'clerk',
      emailVerified: true,
      lastLogin:     new Date(),
    });
    isNewUser = true;
  }

  return {
    status: isNewUser ? 201 : 200,
    user: lwUser,
  };
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('LOCALWHEELS CLERK & GOOGLE OAUTH ACCOUNT LINKING REGRESSION SUITE');
  console.log('='.repeat(80));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  // Pre-test cleanup of any previous test runs
  await User.deleteMany({
    $or: [
      { username: { $regex: '^test_oauth_' } },
      { username: { $regex: '^oauth_' } },
      { email: { $regex: '^test_oauth_' } },
      { clerkId: { $regex: '^user_clerk_' } },
      { clerkId: { $regex: '^test_oauth_' } },
    ]
  });

  const testEmailPrefix = `test_oauth_${Date.now()}`;

  try {
    // ── SCENARIO 1: Existing local user signing in with Google (verified email)
    console.log('--- 1. EXISTING USER SIGNING IN WITH GOOGLE (VERIFIED EMAIL) ---');
    const email1 = `${testEmailPrefix}_local@example.com`;
    const localUser = await User.create({
      username: `${testEmailPrefix}_u1`,
      email: email1,
      role: 'staff',
      authProvider: 'local',
      clerkId: null,
      emailVerified: false,
    });

    const res1 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_clerk_111`,
      clerkUser: {
        firstName: 'Google',
        lastName: 'User',
        primaryEmailAddressId: 'idn_1',
        emailAddresses: [{
          id: 'idn_1',
          emailAddress: email1,
          verification: { status: 'verified', strategy: 'oauth_google' }
        }]
      }
    });

    assert(res1.status === 200, 'Returns 200 OK for existing local user');
    assert(res1.user.clerkId === `${testEmailPrefix}_clerk_111`, 'User clerkId successfully linked to Google OAuth ID');
    assert(res1.user.authProvider === 'clerk', 'authProvider updated to clerk');
    assert(res1.user.emailVerified === true, 'emailVerified set to true');

    // ── SCENARIO 2: New user signing in with Google (verified email)
    console.log('\n--- 2. NEW USER SIGNING IN WITH GOOGLE ---');
    const email2 = `${testEmailPrefix}_new@example.com`;
    const res2 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_clerk_222`,
      clerkUser: {
        firstName: 'New',
        lastName: 'GoogleUser',
        primaryEmailAddressId: 'idn_2',
        emailAddresses: [{
          id: 'idn_2',
          emailAddress: email2,
          verification: { status: 'verified', strategy: 'oauth_google' }
        }]
      }
    });

    assert(res2.status === 201, 'Returns 201 Created for new user');
    assert(res2.user.email === email2, 'New user created with verified email');
    assert(res2.user.role === 'staff', 'New user role strictly defaults to staff');
    assert(res2.user.clerkId === `${testEmailPrefix}_clerk_222`, 'New user clerkId assigned');

    // ── SCENARIO 3: Mismatched Clerk IDs with VERIFIED email (e.g. dev-to-prod migration)
    console.log('\n--- 3. MISMATCHED CLERK IDS WITH VERIFIED EMAIL (DEV-TO-PROD MIGRATION) ---');
    const email3 = `${testEmailPrefix}_migrated@example.com`;
    const devUser = await User.create({
      username: `${testEmailPrefix}_u3`,
      email: email3,
      role: 'staff',
      authProvider: 'clerk',
      clerkId: `${testEmailPrefix}_old_dev_333`,
      emailVerified: true,
    });

    // Production Google OAuth returns a new clerkId for the same verified email
    const res3 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_new_prod_444`,
      clerkUser: {
        firstName: 'Migrated',
        lastName: 'Owner',
        primaryEmailAddressId: 'idn_3',
        emailAddresses: [{
          id: 'idn_3',
          emailAddress: email3,
          verification: { status: 'verified', strategy: 'oauth_google' }
        }]
      }
    });

    assert(res3.status === 200, 'Returns 200 OK without 409 conflict');
    assert(res3.user.clerkId === `${testEmailPrefix}_new_prod_444`, 'clerkId securely migrated to new live production ID');
    assert(res3.user._id.toString() === devUser._id.toString(), 'Original LocalWheels user record preserved');

    // ── SCENARIO 4: Mismatched Clerk IDs with UNVERIFIED email (spoofing attempt)
    console.log('\n--- 4. MISMATCHED CLERK IDS WITH UNVERIFIED EMAIL (SPOOFING REJECTION) ---');
    const email4 = `${testEmailPrefix}_victim@example.com`;
    const victimUser = await User.create({
      username: `${testEmailPrefix}_u4`,
      email: email4,
      role: 'admin',
      authProvider: 'clerk',
      clerkId: `${testEmailPrefix}_legit_owner_555`,
      emailVerified: true,
    });

    // Attacker signs up with victim's email but has NOT verified it
    const res4 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_attacker_666`,
      clerkUser: {
        firstName: 'Malicious',
        lastName: 'Attacker',
        primaryEmailAddressId: 'idn_4',
        emailAddresses: [{
          id: 'idn_4',
          emailAddress: email4,
          verification: { status: 'unverified' } // UNVERIFIED!
        }]
      }
    });

    assert(res4.status === 403, 'Strictly rejected with 403 Forbidden');
    assert(res4.code === 'EMAIL_NOT_VERIFIED', 'Error code is EMAIL_NOT_VERIFIED');

    // Verify victim's database record is completely untouched
    const victimReloaded = await User.findById(victimUser._id);
    assert(victimReloaded.clerkId === `${testEmailPrefix}_legit_owner_555`, 'Victim account clerkId was NOT modified by attacker');

    // ── SCENARIO 5: New user with UNVERIFIED email
    console.log('\n--- 5. NEW USER WITH UNVERIFIED EMAIL ---');
    const email5 = `${testEmailPrefix}_unverified_new@example.com`;
    const res5 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_attacker_777`,
      clerkUser: {
        firstName: 'Fake',
        lastName: 'User',
        primaryEmailAddressId: 'idn_5',
        emailAddresses: [{
          id: 'idn_5',
          emailAddress: email5,
          verification: { status: 'unverified' }
        }]
      }
    });

    assert(res5.status === 403, 'Rejected with 403 Forbidden');
    const createdUserCheck = await User.findOne({ email: email5 });
    assert(createdUserCheck === null, 'No user record created for unverified email');

    // ── SCENARIO 6: Matching Clerk ID (Returning user fast path)
    console.log('\n--- 6. MATCHING CLERK ID (RETURNING USER FAST PATH) ---');
    const email6 = `${testEmailPrefix}_returning@example.com`;
    const returningUser = await User.create({
      username: `${testEmailPrefix}_u6`,
      email: email6,
      role: 'staff',
      authProvider: 'clerk',
      clerkId: `${testEmailPrefix}_returning_888`,
      emailVerified: true,
    });

    const res6 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_returning_888`,
      clerkUser: {
        firstName: 'Returning',
        lastName: 'User',
        primaryEmailAddressId: 'idn_6',
        emailAddresses: [{
          id: 'idn_6',
          emailAddress: email6,
          verification: { status: 'verified', strategy: 'oauth_google' }
        }]
      }
    });

    assert(res6.status === 200, 'Returns 200 OK');
    assert(res6.user._id.toString() === returningUser._id.toString(), 'Loads existing user by clerkId directly');

    // ── SCENARIO 7: Matching Clerk ID but email has changed on Clerk
    console.log('\n--- 7. MATCHING CLERK ID BUT EMAIL CHANGED ON CLERK ---');
    const res7 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_returning_888`,
      clerkUser: {
        firstName: 'Returning',
        lastName: 'User',
        primaryEmailAddressId: 'idn_7',
        emailAddresses: [{
          id: 'idn_7',
          emailAddress: `${testEmailPrefix}_different_email@example.com`,
          verification: { status: 'verified' }
        }]
      }
    });

    assert(res7.status === 409, 'Rejects with 409 Conflict when email changes on Clerk');
    assert(res7.code === 'EMAIL_CHANGED_CONFLICT', 'Code is EMAIL_CHANGED_CONFLICT');

    // ── SCENARIO 8: Existing email associated with another Clerk user / Conflict
    console.log('\n--- 8. CLERK ID ALREADY LINKED TO ANOTHER USER ---');
    const email8A = `${testEmailPrefix}_user_a@example.com`;
    const email8B = `${testEmailPrefix}_user_b@example.com`;

    const userA = await User.create({
      username: `${testEmailPrefix}_ua`,
      email: email8A,
      role: 'staff',
      authProvider: 'clerk',
      clerkId: `${testEmailPrefix}_claimed_999`,
      emailVerified: true,
    });

    const userB = await User.create({
      username: `${testEmailPrefix}_ub`,
      email: email8B,
      role: 'staff',
      authProvider: 'local',
      clerkId: null,
      emailVerified: false,
    });

    // Clerk token claims email of User B, but clerkId is already bound to User A!
    const res8 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_claimed_999`, // Already claimed by userA!
      clerkUser: {
        firstName: 'User',
        lastName: 'B',
        primaryEmailAddressId: 'idn_8',
        emailAddresses: [{
          id: 'idn_8',
          emailAddress: email8B,
          verification: { status: 'verified' }
        }]
      }
    });

    assert(res8.status === 409, 'Rejects cross-linking with 409 Conflict');
    assert(
      res8.code === 'CLERK_ACCOUNT_CONFLICT' || res8.code === 'EMAIL_CHANGED_CONFLICT',
      'Code indicates account conflict',
      res8.code
    );

    // ── SCENARIO 9: Duplicate LocalWheels accounts with same email
    console.log('\n--- 9. DUPLICATE LOCALWHEELS ACCOUNTS RESOLUTION ---');
    const email9 = `${testEmailPrefix}_dup@example.com`;
    const oldDup = await User.create({
      username: `${testEmailPrefix}_dup_old`,
      email: email9,
      role: 'staff',
      authProvider: 'local',
      clerkId: null,
      lastLogin: new Date(Date.now() - 100000),
      createdAt: new Date(Date.now() - 200000),
    });
    const recentDup = await User.create({
      username: `${testEmailPrefix}_dup_recent`,
      email: email9,
      role: 'staff',
      authProvider: 'local',
      clerkId: null,
      lastLogin: new Date(),
      createdAt: new Date(),
    });

    const res9 = await simulateClerkExchange({
      clerkUserId: `${testEmailPrefix}_dup_resolver_1010`,
      clerkUser: {
        firstName: 'Dup',
        lastName: 'User',
        primaryEmailAddressId: 'idn_9',
        emailAddresses: [{
          id: 'idn_9',
          emailAddress: email9,
          verification: { status: 'verified' }
        }]
      }
    });

    assert(res9.status === 200, 'Returns 200 OK for duplicate email scenario');
    assert(res9.user._id.toString() === recentDup._id.toString(), 'Deterministically links to the most recently active account');

  } finally {
    // Clean up all temporary test users
    console.log('\nCleaning up test artifacts...');
    await User.deleteMany({
      $or: [
        { username: { $regex: '^test_oauth_' } },
        { username: { $regex: '^oauth_' } },
        { email: { $regex: '^test_oauth_' } },
        { clerkId: { $regex: '^user_clerk_' } },
        { clerkId: { $regex: '^test_oauth_' } },
      ]
    });
    await mongoose.disconnect();
    console.log('Cleaned up and disconnected from MongoDB.');
  }

  console.log('\n' + '='.repeat(80));
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
