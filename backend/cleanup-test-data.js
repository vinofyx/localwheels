/**
 * cleanup-test-data.js
 * Removes only temporary test-generated records from test executions.
 * Leaves standard seed data (admin, dayakar, manager1, staff1, branches, company) intact.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function cleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);
  console.log('Connected to database for test record cleanup...');

  const User = require('./src/models/User');
  const Company = require('./src/models/Company');
  const Branch = require('./src/models/Branch');
  const Shipment = require('./src/models/Shipment');
  const POD = require('./src/models/POD');
  const Payment = require('./src/models/Payment');
  const Booking = require('./src/models/Booking');
  const FasTagEntry = require('./src/models/FasTagEntry');
  const Invoice = require('./src/models/Invoice');
  const Trip = require('./src/models/Trip');

  // 1. Identify temporary test companies
  const testCompanies = await Company.find({ name: /Competitor Logistics/i });
  const testCompanyIds = testCompanies.map(c => c._id);
  console.log(`Found ${testCompanies.length} temporary test companies to remove`);

  // Remove branches of test companies
  if (testCompanyIds.length > 0) {
    const deletedBranches = await Branch.deleteMany({ company_id: { $in: testCompanyIds } });
    console.log(`Deleted ${deletedBranches.deletedCount} temporary branches belonging to test companies`);
  }

  // Remove test companies
  if (testCompanyIds.length > 0) {
    await Company.deleteMany({ _id: { $in: testCompanyIds } });
  }

  // 2. Remove temporary test user accounts (mgr_a_*, mgr_b_*, user_c2_*)
  const deletedUsers = await User.deleteMany({
    username: { $regex: /^(mgr_a_|mgr_b_|user_c2_|temp_test_)/i }
  });
  console.log(`Deleted ${deletedUsers.deletedCount} temporary test user accounts`);

  // 3. Remove test FasTag validation entries
  const deletedFasTag = await FasTagEntry.deleteMany({
    $or: [
      { entry_no: /VALIDATION/i },
      { tag_id: { $in: ['TAG5001', 'TAG5002', 'TAG100234', 'TAG100889'] } },
    ]
  });
  console.log(`Deleted ${deletedFasTag.deletedCount} temporary test FasTag entries`);

  // 4. Remove test bookings & shipments with Alpha Electronics or Hyderabad Pharma Corp
  const testShipments = await Shipment.find({
    $or: [
      { sender_name: /Alpha Electronics Ltd|Hyderabad Pharma Corp/i },
      { receiver_name: /Omega Retail Hub|Vijayawada Medical Distributors/i },
    ]
  });
  const testShipmentIds = testShipments.map(s => s._id);

  if (testShipmentIds.length > 0) {
    await POD.deleteMany({ shipment_id: { $in: testShipmentIds } });
    await Payment.deleteMany({ shipment_id: { $in: testShipmentIds } });
    await Invoice.deleteMany({ shipment_id: { $in: testShipmentIds } });
    await Booking.deleteMany({ shipment_id: { $in: testShipmentIds } });
    await Shipment.deleteMany({ _id: { $in: testShipmentIds } });
    console.log(`Deleted ${testShipments.length} temporary test shipments and associated POD/Payment/Invoice records`);
  }

  // Also clean any bookings with Alpha Electronics Ltd
  await Booking.deleteMany({ sender_name: /Alpha Electronics Ltd/i });

  // 5. Clean test LHS trips
  const deletedTrips = await Trip.deleteMany({
    $or: [
      { vehicle_number: 'TS09UB1234' },
      { driver_name: 'Ramesh Reddy' },
    ]
  });
  console.log(`Deleted ${deletedTrips.deletedCount} temporary test LHS trips`);

  console.log('\n✅ Cleanup complete! Standard seed accounts and production records remain intact.');
  await mongoose.disconnect();
}

cleanup().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
