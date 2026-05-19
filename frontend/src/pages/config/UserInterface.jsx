import React, { useState } from 'react';
import toast from 'react-hot-toast';

/* ── Static data ──────────────────────────────────────────────── */
const LEVELS = [
  '--Select--', 'ACCOUNT MANGER', 'ACCOUNTANT', 'ADMIN', 'BILLING MANAGER',
  'BOOKING INCHARGE', 'BRANCH MANAGER', 'CRM', 'DATA ENTRY OPERATOR', 'DELIVERY INCHARGE',
  'DEMO', 'FTL', 'FTL - OPERATION-ACCOUNT-FLEET', 'K.ADINARAYANA',
  'OPERATION-ACCOUNT-PAYROLL', 'OPERATIONAL BRANCH', 'PAYROLL',
  'PTL-OPTERTATION+ACCOUNT', 'VASULI PAERSON',
];

const DASHBOARD_ITEMS = [
  'BAD / REJECT POD', 'Bill Submission Pending', 'BOOKING STOCK', 'Cash In Hand',
  'Customer Appointment', 'DAMAGE QTY', 'EDD Fail Shipments', 'EXCESS QTY',
  'Hold/Lost CN', 'LOCAL COLLECTION PENDING', 'Local Delivery Stock', 'Out For Delivery',
  'Over Due Outstanding', 'Paid Outstanding', 'POD Received Pending', 'POD Send Pending',
  'POD Submit Pending', 'POD Upload Pending', 'SHORT QTY', 'Todays EDD Shipment',
  'Todays Expiry Eway Bill', 'ToPay Outstanding', 'UN-DELIVERD LR(RETURN)', 'UP COMMING VEHICLES',
];

const ENTRY_LOCK_ITEMS = [
  { validOn: 'ADVANCE PAYMENT',  lockAfter: 'BANK RECO' },
  { validOn: 'BALANCE PAYMENT',  lockAfter: 'BANK RECO' },
  { validOn: 'BILL SUBMISSION',  lockAfter: 'MRBILLWITHLR' },
  { validOn: 'BILL SUBMISSION',  lockAfter: 'MRBILLWITHOUTLR' },
  { validOn: 'BILL SUBMISSION',  lockAfter: 'MRBILLWITHOPENREF' },
  { validOn: 'BILLING',          lockAfter: 'SALEPOSTING' },
  { validOn: 'BILLING',          lockAfter: 'MR' },
  { validOn: 'BILLSUBMISSION',   lockAfter: 'SALEPOSTING' },
  { validOn: 'LAR',              lockAfter: 'ACKNOWLEDGMENT' },
  { validOn: 'LCM',              lockAfter: 'BALANCE PAYMENT' },
  { validOn: 'LCM',              lockAfter: 'Advance PAYMENT' },
  { validOn: 'LDM',              lockAfter: 'BALANCE PAYMENT' },
  { validOn: 'LDM',              lockAfter: 'Advance PAYMENT' },
  { validOn: 'LR',               lockAfter: 'BILLING' },
  { validOn: 'LR',               lockAfter: 'MEMO' },
  { validOn: 'LR',               lockAfter: 'ACKNOWLEDGMENT' },
  { validOn: 'LR',               lockAfter: 'MR' },
  { validOn: 'MEMO',             lockAfter: 'LAR' },
  { validOn: 'MEMO',             lockAfter: 'ADVANCE PAYMENT' },
  { validOn: 'MEMO',             lockAfter: 'BALANCE PAYMENT' },
  { validOn: 'MR',               lockAfter: 'BANK RECO' },
  { validOn: 'MR',               lockAfter: 'DEDUCTIONAPPROVAL' },
  { validOn: 'TRIP CLOSING',     lockAfter: 'BANK RECO' },
  { validOn: 'VEHICLE ADVANCE',  lockAfter: 'GDMTRIP' },
  { validOn: 'VEHICLE ADVANCE',  lockAfter: 'LDMTRIP' },
  { validOn: 'VEHICLE ADVANCE',  lockAfter: 'LCMTRIP' },
  { validOn: 'VEHICLE ADVANCE',  lockAfter: 'EMPTYTRIP' },
  { validOn: 'VENDOR_CRDR_NOTE', lockAfter: 'BALANCE PAYMENT' },
  { validOn: 'VENDOR_CRDR_NOTE', lockAfter: 'BILLING' },
  { validOn: 'VOUCHER',          lockAfter: 'BANKRECO' },
];

/* Entry Date Lock items */
const DATE_LOCK_ITEMS = [
  'BILLWITHLR', 'BILLWITHOUTLR', 'CUST_CR/DR_NOTE', 'DIESELISSUE',
  'GDM', 'LCM', 'LDM', 'LHS', 'LR', 'LRMEMOEXPENSES',
  'MR', 'VAR', 'VENDOR_PAYMENT', 'VOUCHERENTRY',
];

/* User Authority — sections with items */
const AUTHORITY_SECTIONS = [
  {
    label: '1.MASTER',
    items: [
      'BRANCH', 'PARTY(CUSTOMER)', 'VENDOR/AGENT', 'VEHICLE MASTER',
      'MATERIAL DESCRIPTION', 'ROUTE MASTER', 'LEDGER', 'LOAD TYPE',
      'PACKAGE TYPE', 'EXPENSE CHARGES', 'SALES CHARGES', 'REASON MASTER',
      'DRIVER', 'LR MASTER', 'SALE CONTRACT/HAMALI CONTRACT', 'PURCHASE CONTRACT',
      'ROUTE EXPENSES', 'DIESEL RATE', 'STATE MASTER', 'STATIONARY ALLOCATION',
      'PARTY LINK TO SUPERPARTY', 'DESIGNATION', 'DIVISION', 'ZONE', 'REGION',
      'LOCATION', 'VEHICLE CONTRACT', 'DRIVER MAPPING', 'LR OTHER DETAILS',
      'TRANSIT MODE', 'QUOTATION', 'COST CENTER', 'OPENING MEMOS',
      'BANK RECOOPENING', 'GROUP', 'COST CATEGORY', 'OPENING BILLS',
    ],
  },
  {
    label: '2.DAILY ENTRIES',
    items: [
      'LORRY RECEIPT(LR)', 'MEMO(MANIFEST)', 'VEHICLE ARRIVAL(VAR)',
      'BILLING(AGAINST LR)', 'BILLING(WITHOUT LR)', 'LHS', 'LCM', 'LDM',
      'ORDER/PICK REQUEST', 'INWARD ENTRY', 'DAMAGE AND SPLIT', 'EXTRAADVANCE',
      'MARKET LOAD(MEMO)', 'MARKET LOAD(BALANCE)', 'TRIP SETTLEMENT', 'DELIVERY',
      'POD SUBMIT', 'POD SEND', 'UPLOAD POD', 'OUTWARD ENTRY', 'BILL SUBMISSION',
      'LOADING SHEET', 'VEHICLE PLACEMENT', 'HOLD CN', 'LR STATUS', 'LR SETTLEMENT',
      'TOUCHING LR', 'PODSEND CUSTOMER', 'FASTAG IMPORT', 'POD RECEIVED',
    ],
  },
  {
    label: '3.ACCOUNT ENTRIES',
    items: [
      'VOUCHER ENTRY', 'DIESELISSUE', 'MONEY RECEIPT(MR)', 'HIRE VECHICLE PAYMENT',
      'LR EXPENSES', 'CUSTOMER CR/DR NOTE', 'BRANCH VOUCHER', 'MEMO EXPENSES',
      'VENDOR/SUPPLIER BILL', 'VENDOR BILL PAYMENT', 'BANK RECONCILIATION',
      'CREDIT CARDBILL', 'VENDOR CR/DR_NOTE',
    ],
  },
  {
    label: '4.FLEET',
    items: [
      'ITEM MASTER', 'ITEM CATEGORY', 'SERVICE MASTER', 'RTO INSURANCE',
      'SERVICE ALERT', 'PURCHASE INVOICE', 'SPARE PART ISSUE', 'REPAIR MAINTANCE',
      'RTO/INSURANCEENTRY/VEHICLE DOCUMENT', 'DIESEL ENTRY', 'DRIVER SALARY',
      'TYRE MASTER', 'TYRE ISSUE REMOVE', 'TYRE OUT ENTRY', 'JOB CARD',
      'LOAN INSTALLMENT', 'VEHICLEHIRE POSITION', 'RFID INTEGRATION',
    ],
  },
  {
    label: '5.PAYROLL',
    items: [
      'DEPARTMENT', 'EMPLOYEE', 'SALARYHEAD', 'SALARY DETAILS',
      'LEAVE', 'HOLIDAY', 'WEEKLYOFF', 'EMPLOYEE ATTENDANC',
      'IMPORT ATTENDANCY', 'LEAVE ENTRY', 'AUTOPAYSLIP ENTRY',
      'SALARY ADVANCE', 'SALARY PAYMENT',
    ],
  },
  {
    label: '6.STAFF TRANSPORT',
    items: [
      'TRIP LOGBOOK', 'TRIP LOGBOOKCONTRACT', 'BILLING LOGBOOK',
    ],
  },
];

const TABS = ['Dashboard', 'Entry Lock', 'Entry Date Lock', 'User Authority', 'Assign Dashboard'];

/* ── Shared icons ─────────────────────────────────────────────── */
function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
function SortIcon() {
  return (
    <svg className="w-3 h-3 opacity-70 inline ml-1" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

/* ── Dashboard tab ────────────────────────────────────────────── */
function DashboardTab() {
  const [editMode, setEditMode] = useState(false);
  const [active,   setActive]   = useState({});
  return (
    <>
      <div className="px-3 py-2 border-b border-gray-200">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={editMode}
            onChange={e => setEditMode(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0b8fd3]" />
          <span className="font-medium">Edit</span>
        </label>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 252px)' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-2 text-left font-semibold">Head Name</th>
              <th className="px-3 py-2 text-right pr-8 font-semibold w-32">Active <SortIcon /></th>
            </tr>
          </thead>
          <tbody>
            {DASHBOARD_ITEMS.map((item, idx) => (
              <tr key={item}
                className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-3 py-1.5 text-gray-800">{item}</td>
                <td className="px-3 py-1.5 text-right pr-8">
                  <input type="checkbox"
                    checked={!!active[item]}
                    onChange={() => setActive(p => ({ ...p, [item]: !p[item] }))}
                    disabled={!editMode}
                    className="w-3.5 h-3.5 accent-[#0b8fd3] cursor-pointer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Entry Lock tab ───────────────────────────────────────────── */
function EntryLockTab() {
  const [editMode, setEditMode] = useState(false);
  const [search,   setSearch]   = useState('');
  const [active,   setActive]   = useState({});

  const filtered = ENTRY_LOCK_ITEMS.filter(item =>
    !search ||
    item.validOn.toLowerCase().includes(search.toLowerCase()) ||
    item.lockAfter.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={editMode}
            onChange={e => setEditMode(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0b8fd3]" />
          <span className="font-medium">Edit</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Search:</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 px-2 py-1 focus:outline-none w-44" />
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 270px)' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-2 text-left font-semibold">Validation On <SortIcon /></th>
              <th className="px-3 py-2 text-left font-semibold">Lock After <SortIcon /></th>
              <th className="px-3 py-2 text-center font-semibold w-28">Is Active <SortIcon /></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const key = `${item.validOn}|${item.lockAfter}`;
              return (
                <tr key={key}
                  className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-3 py-1.5 text-gray-800">{item.validOn}</td>
                  <td className="px-3 py-1.5 text-gray-800">{item.lockAfter}</td>
                  <td className="px-3 py-1.5 text-center">
                    <input type="checkbox"
                      checked={!!active[key]}
                      onChange={() => setActive(p => ({ ...p, [key]: !p[key] }))}
                      disabled={!editMode}
                      className="w-3.5 h-3.5 accent-[#0b8fd3] cursor-pointer" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Entry Date Lock tab ──────────────────────────────────────── */
function EntryDateLockTab() {
  const [editMode, setEditMode] = useState(false);
  const [search,   setSearch]   = useState('');
  const [rows, setRows] = useState(
    () => Object.fromEntries(DATE_LOCK_ITEMS.map(k => [k, { active: false, addDays: 0, modifyDays: 0 }]))
  );

  const filtered = DATE_LOCK_ITEMS.filter(k =>
    !search || k.toLowerCase().includes(search.toLowerCase())
  );

  function updateRow(key, field, value) {
    setRows(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  return (
    <>
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={editMode}
            onChange={e => setEditMode(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0b8fd3]" />
          <span className="font-medium">Edit</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Search:</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 px-2 py-1 focus:outline-none w-44" />
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 270px)' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-2 text-left font-semibold">Page Head</th>
              <th className="px-3 py-2 text-center font-semibold w-28">
                Is Active <SortIcon />
              </th>
              <th className="px-3 py-2 text-center font-semibold w-36">
                Add Days <SortIcon />
              </th>
              <th className="px-3 py-2 text-center font-semibold w-36">
                Modify Days <SortIcon />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((key, idx) => (
              <tr key={key}
                className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-3 py-1.5 text-gray-800">{key}</td>
                <td className="px-3 py-1.5 text-center">
                  <input type="checkbox"
                    checked={rows[key].active}
                    onChange={() => updateRow(key, 'active', !rows[key].active)}
                    disabled={!editMode}
                    className="w-3.5 h-3.5 accent-[#0b8fd3] cursor-pointer" />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="number"
                    value={rows[key].addDays}
                    onChange={e => updateRow(key, 'addDays', e.target.value)}
                    disabled={!editMode}
                    className="border border-gray-300 w-20 px-2 py-0.5 text-center
                               text-orange-600 font-medium focus:outline-none
                               disabled:bg-white"
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="number"
                    value={rows[key].modifyDays}
                    onChange={e => updateRow(key, 'modifyDays', e.target.value)}
                    disabled={!editMode}
                    className="border border-gray-300 w-20 px-2 py-0.5 text-center
                               text-orange-600 font-medium focus:outline-none
                               disabled:bg-white"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── User Authority tab ───────────────────────────────────────── */
function UserAuthorityTab() {
  const [editMode, setEditMode] = useState(false);
  const [search,   setSearch]   = useState('');
  const [checks,   setChecks]   = useState({});

  /* flat list with section separators for rendering */
  const allRows = AUTHORITY_SECTIONS.flatMap(sec => [
    { type: 'section', label: sec.label },
    ...sec.items.map(item => ({ type: 'item', key: `${sec.label}|${item}`, label: item })),
  ]);

  const visible = search
    ? allRows.filter(r =>
        r.type === 'section' ||
        r.label.toLowerCase().includes(search.toLowerCase())
      )
    : allRows;

  function toggle(key, field) {
    const k = `${key}|${field}`;
    setChecks(p => ({ ...p, [k]: !p[k] }));
  }

  return (
    <>
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={editMode}
            onChange={e => setEditMode(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0b8fd3]" />
          <span className="font-medium">Edit</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Search:</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 px-2 py-1 focus:outline-none w-44" />
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 270px)' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-2 text-left font-semibold">
                Page Head <SortIcon />
              </th>
              <th className="px-3 py-2 text-center font-semibold w-36">
                Not Allow Add <SortIcon />
              </th>
              <th className="px-3 py-2 text-center font-semibold w-36">
                Not Allow Modify <SortIcon />
              </th>
              <th className="px-3 py-2 text-center font-semibold w-36">
                Not Allow View <SortIcon />
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, idx) => {
              if (row.type === 'section') {
                return (
                  <tr key={row.label}>
                    <td colSpan={4}
                      className="px-3 py-1.5 font-bold text-[13px] bg-[#b8dff0] text-gray-800 border-b border-gray-200">
                      {row.label}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={row.key}
                  className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-3 py-1.5 text-gray-800">{row.label}</td>
                  {['add', 'modify', 'view'].map(field => (
                    <td key={field} className="px-3 py-1.5 text-center">
                      <input type="checkbox"
                        checked={!!checks[`${row.key}|${field}`]}
                        onChange={() => toggle(row.key, field)}
                        disabled={!editMode}
                        className="w-3.5 h-3.5 accent-[#0b8fd3] cursor-pointer" />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Assign Dashboard tab ─────────────────────────────────────── */
const ASSIGN_DASH_ITEMS = ['Godown Stock', 'Main Dashboard'];

function AssignDashboardTab() {
  const [editMode, setEditMode] = useState(false);
  const [search,   setSearch]   = useState('');
  const [rows, setRows] = useState(
    () => Object.fromEntries(ASSIGN_DASH_ITEMS.map(k => [k, { isDefault: false, active: false }]))
  );

  const filtered = ASSIGN_DASH_ITEMS.filter(k =>
    !search || k.toLowerCase().includes(search.toLowerCase())
  );

  function updateRow(key, field, value) {
    setRows(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  return (
    <>
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={editMode}
            onChange={e => setEditMode(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0b8fd3]" />
          <span className="font-medium">Edit</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Search:</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 px-2 py-1 focus:outline-none w-44" />
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 270px)' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-2 text-left font-semibold">Dashboard Name</th>
              <th className="px-3 py-2 text-center font-semibold w-36">
                Is Default <SortIcon />
              </th>
              <th className="px-3 py-2 text-center font-semibold w-32">
                Active <SortIcon />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((key, idx) => (
              <tr key={key}
                className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-3 py-1.5 text-[#0b8fd3]">{key}</td>
                <td className="px-3 py-1.5 text-center">
                  <input type="checkbox"
                    checked={rows[key].isDefault}
                    onChange={() => updateRow(key, 'isDefault', !rows[key].isDefault)}
                    disabled={!editMode}
                    className="w-3.5 h-3.5 accent-[#0b8fd3] cursor-pointer" />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <input type="checkbox"
                    checked={rows[key].active}
                    onChange={() => updateRow(key, 'active', !rows[key].active)}
                    disabled={!editMode}
                    className="w-3.5 h-3.5 accent-[#0b8fd3] cursor-pointer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Main component ───────────────────────────────────────────── */
export default function UserInterface() {
  const [level,     setLevel]     = useState('--Select--');
  const [activeTab, setActiveTab] = useState('Dashboard');

  function handleSave() {
    if (!level || level === '--Select--') { toast.error('Please select a Level Name'); return; }
    toast.success('Settings saved');
  }
  function handleRefresh() {
    setLevel('--Select--');
    setActiveTab('Dashboard');
    toast('Refreshed');
  }

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
        <div className="flex-1" />
        <h1 className="font-bold text-[15px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>User Interface</h1>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={handleSave}
            className="bg-[#0b8fd3] text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-[#0a7ab8] transition-colors">
            <SaveIcon /> Save
          </button>
          <button onClick={handleRefresh}
            className="bg-gray-500 text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-gray-600 transition-colors">
            <RefreshIcon /> Refersh
          </button>
        </div>
      </div>

      {/* ── Level Name ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <label className="font-medium text-gray-700">Level Name</label>
          <select value={level} onChange={e => setLevel(e.target.value)}
            className="border border-gray-300 px-2 py-1.5 bg-white focus:outline-none
                       focus:border-[#0b8fd3] w-52">
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* ── Tabs + content ──────────────────────────────────── */}
      <div className="mx-3 mt-3 bg-white border border-gray-200 rounded shadow-sm flex-1">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 font-medium border-r border-gray-200 transition-colors
                ${activeTab === tab
                  ? 'bg-[#0b8fd3] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Dashboard'        && <DashboardTab />}
        {activeTab === 'Entry Lock'       && <EntryLockTab />}
        {activeTab === 'Entry Date Lock'  && <EntryDateLockTab />}
        {activeTab === 'User Authority'   && <UserAuthorityTab />}
        {activeTab === 'Assign Dashboard' && <AssignDashboardTab />}
      </div>
    </div>
  );
}
