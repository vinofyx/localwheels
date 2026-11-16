require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { bootstrapSuperAdmin, getBootstrapStatus } = require('../services/adminBootstrap');
const connectDB = require('../db/connect');

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  const username = getArg('username') || process.env.ADMIN_BOOTSTRAP_USER || 'superadmin';
  const password = getArg('password') || process.env.ADMIN_BOOTSTRAP_PASS;
  const secret = getArg('secret') || process.env.BOOTSTRAP_SECRET;
  const email = getArg('email') || 'superadmin@localwheels.com';
  const fullName = getArg('name') || 'Platform Administrator';

  if (!password) {
    console.error('❌ Error: Password is required. Usage:');
    console.error('   node backend/src/scripts/bootstrap-admin.js --username <user> --password <pass> [--secret <secret>]');
    process.exit(1);
  }

  if (!secret) {
    console.error('❌ Error: BOOTSTRAP_SECRET must be provided or configured in .env');
    process.exit(1);
  }

  await connectDB();
  console.log('🔗 Connected to database.');

  const status = await getBootstrapStatus();
  if (!status.allowed) {
    console.error(`❌ Bootstrap blocked: ${status.reason}`);
    process.exit(1);
  }

  try {
    const result = await bootstrapSuperAdmin({
      secret,
      username,
      password,
      email,
      full_name: fullName,
      ip_address: '127.0.0.1 (CLI)',
    });
    console.log('✅ ' + result.message);
    console.log('👤 Created Superadmin:', result.user.username, `(${result.user.id})`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Bootstrap failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

