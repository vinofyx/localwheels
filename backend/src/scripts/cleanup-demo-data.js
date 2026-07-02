/**
 * LocalWheels — Production Data Cleanup Script
 * Removes ALL demo, seed, fake, test, and generated business data.
 * Preserves: nothing (no system-level config exists outside company scope).
 * Creates: a super_admin user for initial production access.
 *
 * Usage:
 *   node src/scripts/cleanup-demo-data.js           # dry run (shows what would be deleted)
 *   node src/scripts/cleanup-demo-data.js --execute  # actually deletes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const DRY_RUN  = !process.argv.includes('--execute');
const log      = (msg)  => console.log(`  ✅  ${msg}`);
const warn     = (msg)  => console.log(`  ⚠️   ${msg}`);
const info     = (msg)  => console.log(`  ℹ️   ${msg}`);
const head     = (msg)  => console.log(`\n── ${msg} ──`);
const drylog   = (msg)  => console.log(`  🔍  [DRY RUN] Would delete: ${msg}`);

// ── Collections to wipe completely ────────────────────────────────────────────
// These are purely business-data collections — safe to clear entirely.
const WIPE_COLLECTIONS = [
  // Companies and hierarchy
  'companies', 'branches',
  // Users (all are demo/seed users — super_admin will be recreated)
  'users',
  // CRM
  'leads', 'opportunities', 'quotes', 'salesactivities', 'salestasks',
  'customermeetings', 'customerpricings',
  // Customers & Suppliers
  'customers', 'suppliers',
  // Operations
  'shipments', 'pods', 'bookings', 'trips',
  'inboundshipments', 'outboundshipments',
  // Fleet
  'vehicles', 'vehicleassignments', 'vehicledocuments', 'vehicleexpenses',
  'vehiclefuels', 'vehiclehealths', 'vehicleinspections', 'vehiclemaintenances',
  'vehicletelemetries', 'fleetvehicles',
  // Drivers
  'drivers', 'drivernotifications', 'driverlocations', 'driverincidents',
  'driverdocuments', 'driverchecklists', 'driverfatigues', 'driverperformances',
  'driverbehaviours', 'driversos',
  // Warehouse
  'warehouses', 'inventories', 'inventorymovements', 'inbound', 'outbound',
  'warehousebins', 'warehouseracks', 'warehousezones', 'warehousetasks',
  'warehouseworkers', 'warehouseairecommendations', 'warehouseanalytics',
  'warehouseforecasts', 'docks',
  // Finance
  'invoices', 'payments', 'chartofaccounts', 'costcenters', 'budgets',
  'journals', 'journalentries', 'cashflows', 'bankaccounts', 'bankstatements',
  'expenses', 'purchaseorders', 'salesorders', 'taxentries', 'gsttransactions',
  'financialinvoices', 'accountsreceivables', 'accountspayables',
  // Complaints & Support
  'complaints', 'complaintactivities', 'supporttickets', 'chatsessions',
  'liveagents', 'notifications',
  // HR & Payroll
  'employees', 'payrollentries', 'attendance', 'leaves', 'salarystructs',
  // Maintenance
  'workorders', 'workshops', 'maintenanceschedules', 'maintenancepredictions',
  'maintenanceanalytics',
  // AI / Analytics outputs (generated, not config)
  'executivesnapshots', 'executivedashboards', 'forecasts', 'demandforecasts',
  'capacityforecasts', 'liveoperationssnapshots', 'warehouseforecasts',
  'biinsights', 'dashboardpreferences', 'simulationanalytics',
  // Integrations (instance-specific state, not config)
  'webhooks', 'webhookdeliveries', 'apikeys', 'apiapplications', 'apianalytics',
  'oauthtokens', 'synchistories', 'integrationjobs', 'integrationalerts',
  'integrationconnectors', 'eventbuses', 'eventsubscriptions',
  // Automation execution history
  'automationjobs', 'automationworkflows', 'automationrules', 'automationanalytics',
  'approvalrequests', 'approvalhistories',
  // Risk / incidents
  'incidents', 'riskassessments', 'operationalrisks', 'recoveryplans',
  'businesscontinuities', 'enterprisealerts', 'enterpriseschedulers',
  // Simulation (AI-generated)
  'simulations', 'simulationjobs', 'simulationresults', 'simulationevents',
  'simulationscenarios', 'simulationaudits', 'simulationresults', 'simulationsnapshots',
  // Misc generated/logged data
  'auditlogs', 'routeexpenses', 'routerisks', 'carbonemissions',
  'sustainabilityscores', 'iotdevices', 'batteryhealths', 'enginehealths',
  'tyrehealths', 'fuelintelligences', 'collaborationrooms',
  'decisionexecutions', 'autonomousdecisions', 'digitaltwins', 'digitalworkers',
  'customerportalsettings', 'partinventories', 'routeoptimizations',
  'customerpayments',
];

// ── Super admin credentials ────────────────────────────────────────────────────
const SUPER_ADMIN = {
  username:  'superadmin',
  email:     'superadmin@localwheels.com',
  password:  'LW@SuperAdmin#2026!',  // Must be changed on first login
  role:      'super_admin',
  full_name: 'Platform Administrator',
  name:      'Platform Administrator',
  is_active: true,
};

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('\n❌  MONGODB_URI is not set.\n');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  if (DRY_RUN) {
    console.log('  🔍  CLEANUP SCRIPT — DRY RUN (no data will be deleted)');
    console.log('  Run with --execute to perform actual cleanup.');
  } else {
    console.log('  🗑️   CLEANUP SCRIPT — EXECUTE MODE');
    console.log('  ⚠️   ALL business data will be permanently deleted.');
  }
  console.log('═'.repeat(60));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('\n✅  Connected to MongoDB');

  const db = mongoose.connection.db;
  const allCollections = new Set((await db.listCollections().toArray()).map(c => c.name));

  // ── Audit current state ─────────────────────────────────────────────────────
  head('Current Database State');
  let totalDocs = 0;
  const deleteStats = {};

  for (const col of WIPE_COLLECTIONS) {
    if (!allCollections.has(col)) continue;
    const count = await db.collection(col).countDocuments();
    if (count > 0) {
      deleteStats[col] = count;
      totalDocs += count;
      if (DRY_RUN) drylog(`${count} documents from '${col}'`);
    }
  }

  console.log(`\n  Total documents to delete: ${totalDocs.toLocaleString()} across ${Object.keys(deleteStats).length} collections`);

  if (DRY_RUN) {
    console.log('\n  ℹ️   Run with --execute to perform the actual cleanup.');
    info('Super admin will be created: ' + SUPER_ADMIN.username);
    await mongoose.disconnect();
    return;
  }

  // ── Execute cleanup ─────────────────────────────────────────────────────────
  head('Deleting Business Data');

  let deletedTotal = 0;
  for (const col of WIPE_COLLECTIONS) {
    if (!allCollections.has(col)) continue;
    const count = deleteStats[col] || 0;
    if (count === 0) continue;
    await db.collection(col).deleteMany({});
    log(`Cleared '${col}' — ${count} documents removed`);
    deletedTotal += count;
  }

  // ── Clear Redis cache ───────────────────────────────────────────────────────
  head('Cache Cleanup');
  try {
    const { initRedis, isRedisConnected } = require('../middleware/cache');
    if (process.env.REDIS_URL) {
      await initRedis();
      if (isRedisConnected()) {
        const { createClient } = require('redis');
        const client = createClient({ url: process.env.REDIS_URL });
        await client.connect();
        await client.flushDb();
        await client.disconnect();
        log('Redis cache flushed');
      }
    } else {
      info('REDIS_URL not set — skipping Redis flush (in-memory cache clears on restart)');
    }
  } catch (e) {
    warn('Redis flush skipped: ' + e.message);
  }

  // ── Create super admin ──────────────────────────────────────────────────────
  head('Creating Super Admin');
  const existing = await db.collection('users').findOne({ username: SUPER_ADMIN.username });
  if (existing) {
    warn('Super admin already exists: ' + SUPER_ADMIN.username);
  } else {
    const hash = await bcrypt.hash(SUPER_ADMIN.password, 10);
    await db.collection('users').insertOne({
      ...SUPER_ADMIN,
      password: hash,
      company_id: null,
      branch_id:  null,
      createdAt:  new Date(),
      updatedAt:  new Date(),
    });
    log('Super admin created: ' + SUPER_ADMIN.username);
  }

  // ── Verify empty state ──────────────────────────────────────────────────────
  head('Verification');
  const remainingUsers = await db.collection('users').countDocuments();
  const remainingCompanies = await db.collection('companies').countDocuments();
  const remainingShipments = await db.collection('shipments').countDocuments({ }).catch(() => 0);

  log(`Users remaining: ${remainingUsers} (should be 1 — super admin only)`);
  log(`Companies remaining: ${remainingCompanies} (should be 0)`);
  log(`Shipments remaining: ${remainingShipments} (should be 0)`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  CLEANUP COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\n  Documents deleted: ${deletedTotal.toLocaleString()}`);
  console.log(`  Collections cleared: ${Object.keys(deleteStats).length}`);
  console.log(`\n  Super Admin Credentials:`);
  console.log(`  Username: ${SUPER_ADMIN.username}`);
  console.log(`  Password: ${SUPER_ADMIN.password}`);
  console.log(`  ⚠️   Change this password immediately after first login!\n`);
  console.log(`  Next steps:`);
  console.log(`  1. Login as superadmin and change the password`);
  console.log(`  2. Create the first real company via Settings → Companies`);
  console.log(`  3. Create branches and invite real users`);
  console.log(`  4. Run the workflow test to verify zero-data behavior:`);
  console.log(`     node src/scripts/uat-workflow-test.js`);
  console.log('');

  await mongoose.disconnect();
}

main().catch(e => {
  console.error('\n❌  Cleanup failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});
