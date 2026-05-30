require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Company = require('../models/Company');
const Branch = require('../models/Branch');
const User = require('../models/User');

async function seed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Set MONGODB_URI or MONGO_URI in your environment');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB. Seeding...');

  // Company
  let company = await Company.findOne({ name: 'Local Wheels Pvt Ltd' });
  if (!company) {
    company = await Company.create({ name: 'Local Wheels Pvt Ltd', subscription_plan: 'pro' });
  }

  // Branches
  const branchDefs = [
    { branch_name: 'HYDERABAD-HEAD OFFICE', location: 'Hyderabad, Telangana', phone: '040-12345678', address: 'KPHB Colony, Hyderabad' },
    { branch_name: 'ADILABAD',   location: 'Adilabad, Telangana',   phone: '08732-123456', address: 'Main Road, Adilabad' },
    { branch_name: 'WARANGAL',   location: 'Warangal, Telangana',   phone: '0870-123456',  address: 'Hanamkonda, Warangal' },
    { branch_name: 'NIZAMABAD',  location: 'Nizamabad, Telangana',  phone: '08462-123456', address: 'Nizamabad Town' },
    { branch_name: 'KARIMNAGAR', location: 'Karimnagar, Telangana', phone: '0878-123456',  address: 'Karimnagar Town' },
    { branch_name: 'NALGONDA',   location: 'Nalgonda, Telangana',   phone: '08682-123456', address: 'Nalgonda Town' },
    { branch_name: 'KHAMMAM',    location: 'Khammam, Telangana',    phone: '08742-123456', address: 'Khammam Town' },
  ];

  const branches = [];
  for (const def of branchDefs) {
    let b = await Branch.findOne({ company_id: company._id, branch_name: def.branch_name });
    if (!b) b = await Branch.create({ company_id: company._id, ...def });
    branches.push(b);
  }

  const adminPass = bcrypt.hashSync('admin123', 10);
  const userPass  = bcrypt.hashSync('password123', 10);
  const allBranchIds = branches.map(b => b._id);

  const userDefs = [
    { username: 'admin',    password: adminPass, full_name: 'Administrator',  email: 'admin@localwheels.in',    role: 'admin',   branch_ids: allBranchIds },
    { username: 'dayakar',  password: adminPass, full_name: 'Dayakar',        email: 'dayakar@localwheels.in',  role: 'admin',   branch_ids: allBranchIds },
    { username: 'manager1', password: userPass,  full_name: 'Branch Manager', email: 'manager@localwheels.in',  role: 'manager', branch_ids: [branches[0]._id] },
    { username: 'staff1',   password: userPass,  full_name: 'Staff User',     email: 'staff@localwheels.in',    role: 'staff',   branch_ids: [branches[0]._id] },
  ];

  for (const def of userDefs) {
    const existing = await User.findOne({ username: def.username });
    if (!existing) {
      await User.create({ company_id: company._id, ...def });
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  dayakar  / admin123     → All branches');
  console.log('  admin    / admin123     → All branches');
  console.log('  manager1 / password123  → Hyderabad only');
  console.log('  staff1   / password123  → Hyderabad only');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
