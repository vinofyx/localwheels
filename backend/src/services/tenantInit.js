/**
 * Tenant Initialization Service
 * Called when a new company is created.
 * Seeds required master configuration — NO business transactions.
 */
const MasterConfig      = require('../models/MasterConfig');
const AppSettings       = require('../models/AppSettings');
const NotificationTemplate = require('../models/NotificationTemplate');
const ChartOfAccount    = require('../models/ChartOfAccount');

// ── Master Lookup Defaults ─────────────────────────────────────────────────────

const VEHICLE_TYPES = [
  { name: 'Mini Truck', code: 'MINI', meta: { capacity_tons: 1.5 } },
  { name: 'Small Truck', code: 'SMALL', meta: { capacity_tons: 3 } },
  { name: 'Medium Truck', code: 'MED', meta: { capacity_tons: 7 } },
  { name: 'Large Truck', code: 'LARGE', meta: { capacity_tons: 14 } },
  { name: 'Trailer', code: 'TRAIL', meta: { capacity_tons: 25 } },
  { name: 'Container (20ft)', code: 'CNT20', meta: { capacity_tons: 20 } },
  { name: 'Container (40ft)', code: 'CNT40', meta: { capacity_tons: 28 } },
  { name: 'Pickup Van', code: 'VAN', meta: { capacity_tons: 0.75 } },
  { name: 'Two Wheeler', code: '2W', meta: { capacity_tons: 0.1 } },
  { name: 'Auto Rickshaw', code: 'AUTO', meta: { capacity_tons: 0.25 } },
];

const SHIPMENT_TYPES = [
  { name: 'Full Truck Load', code: 'FTL', is_default: true },
  { name: 'Less Than Truck Load', code: 'LTL' },
  { name: 'Part Truck Load', code: 'PTL' },
  { name: 'Express Delivery', code: 'EXP' },
  { name: 'Door to Door', code: 'D2D' },
  { name: 'Port to Port', code: 'P2P' },
  { name: 'Air Freight', code: 'AIR' },
  { name: 'Rail Freight', code: 'RAIL' },
];

const PACKAGE_TYPES = [
  { name: 'Box / Carton', code: 'BOX' },
  { name: 'Bag / Sack', code: 'BAG' },
  { name: 'Pallet', code: 'PLT' },
  { name: 'Drum / Barrel', code: 'DRM' },
  { name: 'Bundle', code: 'BDL' },
  { name: 'Roll / Coil', code: 'ROLL' },
  { name: 'Loose', code: 'LOOSE' },
  { name: 'Crate', code: 'CRT' },
  { name: 'Container', code: 'CNT' },
];

const COMPLAINT_CATEGORIES = [
  { name: 'Delivery Delay', code: 'DELAY' },
  { name: 'Damaged Goods', code: 'DMG' },
  { name: 'Lost Shipment', code: 'LOST' },
  { name: 'Incorrect Delivery', code: 'WRONG' },
  { name: 'Billing Issue', code: 'BILL' },
  { name: 'Driver Behavior', code: 'DRV' },
  { name: 'Documentation Issue', code: 'DOC' },
  { name: 'Overcharging', code: 'OC' },
  { name: 'Tracking Issue', code: 'TRACK' },
  { name: 'Other', code: 'OTH' },
];

const DOCUMENT_TYPES = [
  { name: 'Lorry Receipt (LR)', code: 'LR' },
  { name: 'Delivery Note', code: 'DN' },
  { name: 'Invoice', code: 'INV' },
  { name: 'E-Way Bill', code: 'EWB' },
  { name: 'Proof of Delivery (POD)', code: 'POD' },
  { name: 'Loading Sheet', code: 'LS' },
  { name: 'Vehicle RC', code: 'RC' },
  { name: 'Driver License', code: 'DL' },
  { name: 'Insurance Certificate', code: 'INS' },
  { name: 'GST Invoice', code: 'GSTI' },
];

const WAREHOUSE_TYPES = [
  { name: 'Owned Warehouse', code: 'OWN' },
  { name: 'Rented Warehouse', code: 'RENT' },
  { name: 'Transit Hub', code: 'HUB' },
  { name: 'Cold Storage', code: 'COLD' },
  { name: 'Bonded Warehouse', code: 'BOND' },
];

const DEPARTMENTS = [
  { name: 'Operations', code: 'OPS' },
  { name: 'Sales & Marketing', code: 'SALES' },
  { name: 'Finance & Accounts', code: 'FIN' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Fleet Management', code: 'FLEET' },
  { name: 'Customer Service', code: 'CS' },
  { name: 'IT & Systems', code: 'IT' },
  { name: 'Warehouse', code: 'WH' },
];

const TAX_SLABS = [
  { name: 'GST 0%', code: 'GST0', meta: { rate: 0 } },
  { name: 'GST 5%', code: 'GST5', meta: { rate: 5, cgst: 2.5, sgst: 2.5, igst: 5 } },
  { name: 'GST 12%', code: 'GST12', meta: { rate: 12, cgst: 6, sgst: 6, igst: 12 } },
  { name: 'GST 18%', code: 'GST18', meta: { rate: 18, cgst: 9, sgst: 9, igst: 18 }, is_default: true },
  { name: 'GST 28%', code: 'GST28', meta: { rate: 28, cgst: 14, sgst: 14, igst: 28 } },
];

// ── Notification Templates ─────────────────────────────────────────────────────

const DEFAULT_TEMPLATES = [
  // Shipment Created
  {
    event: 'shipment_created', channel: 'sms', name: 'Shipment Created SMS',
    body: 'Dear {{customer_name}}, your shipment {{lr_number}} has been booked. Track at {{tracking_url}}. - {{company_name}}',
    is_default: true,
  },
  {
    event: 'shipment_created', channel: 'email', name: 'Shipment Booking Confirmation',
    subject: 'Shipment Booked — {{lr_number}}',
    body: 'Dear {{customer_name}},\n\nYour shipment has been successfully booked.\n\nLR Number: {{lr_number}}\nFrom: {{origin}}\nTo: {{destination}}\nWeight: {{weight}} kg\n\nTrack your shipment: {{tracking_url}}\n\nRegards,\n{{company_name}}',
    is_default: true,
  },
  {
    event: 'shipment_created', channel: 'whatsapp', name: 'Shipment Created WhatsApp',
    body: '📦 *Shipment Booked*\nLR: {{lr_number}}\nFrom: {{origin}} → {{destination}}\nTrack: {{tracking_url}}',
    is_default: true,
  },
  // Shipment Delivered
  {
    event: 'shipment_delivered', channel: 'sms', name: 'Delivery Confirmation SMS',
    body: 'Dear {{customer_name}}, your shipment {{lr_number}} has been delivered successfully. Thank you! - {{company_name}}',
    is_default: true,
  },
  {
    event: 'shipment_delivered', channel: 'email', name: 'Delivery Confirmation Email',
    subject: 'Delivered — {{lr_number}}',
    body: 'Dear {{customer_name}},\n\nYour shipment {{lr_number}} has been delivered on {{delivery_date}}.\n\nThank you for choosing {{company_name}}.\n\nRegards,\n{{company_name}}',
    is_default: true,
  },
  // Invoice Generated
  {
    event: 'invoice_generated', channel: 'email', name: 'Invoice Email',
    subject: 'Invoice {{invoice_number}} — {{company_name}}',
    body: 'Dear {{customer_name}},\n\nPlease find attached Invoice {{invoice_number}} for ₹{{amount}}.\nDue Date: {{due_date}}\n\nRegards,\n{{company_name}}',
    is_default: true,
  },
  // Payment Received
  {
    event: 'payment_received', channel: 'sms', name: 'Payment Receipt SMS',
    body: 'Payment of ₹{{amount}} received against Invoice {{invoice_number}}. Balance: ₹{{balance}}. - {{company_name}}',
    is_default: true,
  },
  // Complaint Raised
  {
    event: 'complaint_raised', channel: 'email', name: 'Complaint Acknowledgement',
    subject: 'Complaint Registered — {{complaint_number}}',
    body: 'Dear {{customer_name}},\n\nYour complaint has been registered.\nComplaint #: {{complaint_number}}\nCategory: {{category}}\n\nWe will resolve this within 48 hours.\n\nRegards,\n{{company_name}}',
    is_default: true,
  },
  // E-Way Expiring
  {
    event: 'eway_expiring', channel: 'in_app', name: 'E-Way Bill Expiry Alert',
    body: 'E-Way Bill {{eway_number}} for shipment {{lr_number}} expires on {{expiry_date}}. Please renew immediately.',
    is_default: true,
  },
];

// ── Standard Chart of Accounts ─────────────────────────────────────────────────

const CHART_OF_ACCOUNTS = [
  // Assets
  { account_code: '1000', account_name: 'Current Assets',       account_type: 'asset',     level: 1, is_leaf: false },
  { account_code: '1100', account_name: 'Cash in Hand',         account_type: 'asset',     level: 2, is_leaf: true },
  { account_code: '1110', account_name: 'Petty Cash',           account_type: 'asset',     level: 2, is_leaf: true },
  { account_code: '1200', account_name: 'Bank Accounts',        account_type: 'asset',     level: 2, is_leaf: false },
  { account_code: '1210', account_name: 'Primary Bank Account', account_type: 'asset',     level: 3, is_leaf: true },
  { account_code: '1300', account_name: 'Accounts Receivable',  account_type: 'asset',     level: 2, is_leaf: true },
  { account_code: '1400', account_name: 'Advances Paid',        account_type: 'asset',     level: 2, is_leaf: true },
  { account_code: '1500', account_name: 'Fixed Assets',         account_type: 'asset',     level: 1, is_leaf: false },
  { account_code: '1510', account_name: 'Vehicles',             account_type: 'asset',     level: 2, is_leaf: true },
  { account_code: '1520', account_name: 'Office Equipment',     account_type: 'asset',     level: 2, is_leaf: true },
  // Liabilities
  { account_code: '2000', account_name: 'Current Liabilities',  account_type: 'liability', level: 1, is_leaf: false },
  { account_code: '2100', account_name: 'Accounts Payable',     account_type: 'liability', level: 2, is_leaf: true },
  { account_code: '2200', account_name: 'GST Payable',          account_type: 'liability', level: 2, is_leaf: true },
  { account_code: '2210', account_name: 'CGST Payable',         account_type: 'liability', level: 3, is_leaf: true },
  { account_code: '2220', account_name: 'SGST Payable',         account_type: 'liability', level: 3, is_leaf: true },
  { account_code: '2230', account_name: 'IGST Payable',         account_type: 'liability', level: 3, is_leaf: true },
  { account_code: '2300', account_name: 'TDS Payable',          account_type: 'liability', level: 2, is_leaf: true },
  { account_code: '2400', account_name: 'Advances Received',    account_type: 'liability', level: 2, is_leaf: true },
  // Equity
  { account_code: '3000', account_name: 'Owner\'s Equity',      account_type: 'equity',    level: 1, is_leaf: false },
  { account_code: '3100', account_name: 'Capital Account',      account_type: 'equity',    level: 2, is_leaf: true },
  { account_code: '3200', account_name: 'Retained Earnings',    account_type: 'equity',    level: 2, is_leaf: true },
  // Revenue
  { account_code: '4000', account_name: 'Revenue',              account_type: 'revenue',   level: 1, is_leaf: false },
  { account_code: '4100', account_name: 'Freight Income',       account_type: 'revenue',   level: 2, is_leaf: true },
  { account_code: '4110', account_name: 'Local Freight',        account_type: 'revenue',   level: 3, is_leaf: true },
  { account_code: '4120', account_name: 'Outstation Freight',   account_type: 'revenue',   level: 3, is_leaf: true },
  { account_code: '4200', account_name: 'Hire Income',          account_type: 'revenue',   level: 2, is_leaf: true },
  { account_code: '4300', account_name: 'Other Income',         account_type: 'revenue',   level: 2, is_leaf: true },
  // Expenses
  { account_code: '5000', account_name: 'Direct Expenses',      account_type: 'expense',   level: 1, is_leaf: false },
  { account_code: '5100', account_name: 'Fuel Expenses',        account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '5200', account_name: 'Driver Salary',        account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '5300', account_name: 'Vehicle Maintenance',  account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '5400', account_name: 'Toll & Highway',       account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '5500', account_name: 'Loading / Unloading',  account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '6000', account_name: 'Indirect Expenses',    account_type: 'expense',   level: 1, is_leaf: false },
  { account_code: '6100', account_name: 'Office Rent',          account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '6200', account_name: 'Staff Salaries',       account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '6300', account_name: 'Communication',        account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '6400', account_name: 'Insurance',            account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '6500', account_name: 'Depreciation',         account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '6600', account_name: 'Bank Charges',         account_type: 'expense',   level: 2, is_leaf: true },
  { account_code: '6700', account_name: 'Miscellaneous',        account_type: 'expense',   level: 2, is_leaf: true },
];

// ── Main initialization function ───────────────────────────────────────────────

async function initializeTenant(companyId) {
  const cid = companyId.toString ? companyId.toString() : companyId;

  // 1. App settings (one per company)
  const existingSettings = await AppSettings.findOne({ company_id: cid });
  if (!existingSettings) {
    await AppSettings.create({
      company_id: cid,
      notifications: {
        shipment_created:   { email: true,  sms: true,  whatsapp: false },
        shipment_delivered: { email: true,  sms: true,  whatsapp: false },
        invoice_generated:  { email: true,  sms: false, whatsapp: false },
        payment_received:   { email: true,  sms: true,  whatsapp: false },
        complaint_raised:   { email: true,  sms: false, whatsapp: false },
        pod_uploaded:       { email: false, sms: false, whatsapp: false },
        eway_expiring:      { email: true,  sms: true,  whatsapp: false },
      },
    });
  }

  // 2. Notification templates
  const existingTemplates = await NotificationTemplate.countDocuments({ company_id: cid });
  if (existingTemplates === 0) {
    await NotificationTemplate.insertMany(
      DEFAULT_TEMPLATES.map(t => ({ ...t, company_id: cid }))
    );
  }

  // 3. Master config (lookup lists)
  const existing = await MasterConfig.countDocuments({ company_id: cid });
  if (existing === 0) {
    const configs = [
      ...VEHICLE_TYPES.map((v, i) => ({ ...v, company_id: cid, category: 'vehicle_type', sort_order: i })),
      ...SHIPMENT_TYPES.map((v, i) => ({ ...v, company_id: cid, category: 'shipment_type', sort_order: i })),
      ...PACKAGE_TYPES.map((v, i) => ({ ...v, company_id: cid, category: 'package_type', sort_order: i })),
      ...COMPLAINT_CATEGORIES.map((v, i) => ({ ...v, company_id: cid, category: 'complaint_category', sort_order: i })),
      ...DOCUMENT_TYPES.map((v, i) => ({ ...v, company_id: cid, category: 'document_type', sort_order: i })),
      ...WAREHOUSE_TYPES.map((v, i) => ({ ...v, company_id: cid, category: 'warehouse_type', sort_order: i })),
      ...DEPARTMENTS.map((v, i) => ({ ...v, company_id: cid, category: 'department', sort_order: i })),
      ...TAX_SLABS.map((v, i) => ({ ...v, company_id: cid, category: 'tax_slab', sort_order: i })),
    ];
    await MasterConfig.insertMany(configs);
  }

  // 4. Chart of Accounts (only if none exist for this company)
  try {
    const existingCoA = await ChartOfAccount.countDocuments({ company_id: cid });
    if (existingCoA === 0) {
      await ChartOfAccount.insertMany(
        CHART_OF_ACCOUNTS.map(a => ({
          ...a,
          company_id: cid,
          opening_balance: 0,
          current_balance: 0,
          currency: 'INR',
          tags: [],
        }))
      );
    }
  } catch (e) {
    // ChartOfAccount model may have different schema — skip gracefully
    console.warn('tenantInit: CoA seed skipped:', e.message);
  }

  return { success: true, company_id: cid };
}

module.exports = { initializeTenant };
