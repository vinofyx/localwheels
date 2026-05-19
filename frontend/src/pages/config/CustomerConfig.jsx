import React, { useState } from 'react';
import toast from 'react-hot-toast';

/* ── shared input style ─────────────────────────────────────── */
const inp = 'border border-gray-300 px-2 py-1.5 text-[13px] focus:outline-none ' +
            'focus:border-[#0b8fd3] bg-white';

function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

/* ── mock customer list ─────────────────────────────────────── */
const MOCK_CUSTOMERS = [
  { id: 1, name: 'ABC LOGISTICS PVT LTD',      code: 'CUST001', city: 'HYDERABAD',   active: true  },
  { id: 2, name: 'XYZ TRANSPORT CO.',           code: 'CUST002', city: 'VIJAYAWADA',  active: true  },
  { id: 3, name: 'PAVAN CARGO SERVICES',        code: 'CUST003', city: 'GUNTUR',      active: false },
  { id: 4, name: 'SRINIVASA DISTRIBUTORS',      code: 'CUST004', city: 'KURNOOL',     active: true  },
  { id: 5, name: 'RAMA KRISHNA ENTERPRISES',    code: 'CUST005', city: 'NELLORE',     active: true  },
  { id: 6, name: 'BALAJI TRADERS',              code: 'CUST006', city: 'TIRUPATHI',   active: false },
  { id: 7, name: 'NATIONAL FREIGHT CARRIERS',   code: 'CUST007', city: 'WARANGAL',    active: true  },
];

export default function CustomerConfig() {
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  /* ── form state ─── */
  const [custCode,     setCustCode]     = useState('');
  const [custName,     setCustName]     = useState('');
  const [city,         setCity]         = useState('');
  const [phone,        setPhone]        = useState('');
  const [email,        setEmail]        = useState('');
  const [creditLimit,  setCreditLimit]  = useState('');
  const [creditDays,   setCreditDays]   = useState('');
  const [isActive,     setIsActive]     = useState(true);
  const [portalAccess, setPortalAccess] = useState(false);
  const [mobileAccess, setMobileAccess] = useState(false);

  function loadCustomer(c) {
    setSelected(c.id);
    setCustCode(c.code);
    setCustName(c.name);
    setCity(c.city);
    setPhone(''); setEmail(''); setCreditLimit(''); setCreditDays('');
    setIsActive(c.active);
    setPortalAccess(false); setMobileAccess(false);
  }

  function handleSave() {
    if (!custName.trim()) { toast.error('Customer Name is required'); return; }
    toast.success('Customer saved successfully');
  }

  function handleRefresh() {
    setSelected(null); setSearch('');
    setCustCode(''); setCustName(''); setCity(''); setPhone(''); setEmail('');
    setCreditLimit(''); setCreditDays('');
    setIsActive(true); setPortalAccess(false); setMobileAccess(false);
    toast('Refreshed');
  }

  const filtered = MOCK_CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
        <div className="flex-1" />
        <h1 className="font-bold text-[15px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>Customer Configuration</h1>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={handleSave}
            className="bg-[#0b8fd3] text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-[#0a7ab8] transition-colors">
            <SaveIcon /> Save
          </button>
          <button onClick={() => toast('Searching…')}
            className="bg-[#0b8fd3] text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-[#0a7ab8] transition-colors">
            <SearchIcon /> Search
          </button>
          <button onClick={handleRefresh}
            className="bg-gray-500 text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-gray-600 transition-colors">
            <RefreshIcon /> Refersh
          </button>
        </div>
      </div>

      <div className="flex gap-4 mx-4 mt-4 flex-1">

        {/* ── Left panel: Customer list ──────────────────────── */}
        <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded shadow-sm
                        flex flex-col overflow-hidden">
          <div className="bg-[#0b8fd3] px-3 py-2 text-white font-bold text-[13px]">
            Customer List
          </div>
          {/* Search */}
          <div className="px-2 py-2 border-b border-gray-200">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customer…"
              className="w-full border border-gray-300 px-2 py-1 text-[13px]
                         focus:outline-none focus:border-[#0b8fd3]"
            />
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => loadCustomer(c)}
                className={`w-full text-left px-3 py-2 border-b border-gray-100 transition-colors
                            ${selected === c.id ? 'bg-[#dbeeff] text-[#0b6fcc]' : 'hover:bg-gray-50'}`}
              >
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-gray-400 text-[11px] flex items-center justify-between">
                  <span>{c.code}</span>
                  <span className={c.active ? 'text-green-500' : 'text-red-400'}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-gray-400 text-center py-6 text-[12px]">No customers found</p>
            )}
          </div>
        </div>

        {/* ── Right panel: Form ────────────────────────────────── */}
        <div className="flex-1 bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#0b8fd3] px-4 py-2 text-white font-bold text-[13px]">
            {selected ? 'Edit Customer' : 'Customer Details'}
          </div>

          <div className="px-5 py-5 flex flex-col gap-4">

            {/* Row 1 */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-gray-700 w-28 whitespace-nowrap">Customer Code</label>
                <input value={custCode} onChange={e => setCustCode(e.target.value)}
                  className={`${inp} w-40`} />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-red-600 font-medium whitespace-nowrap">* Customer Name</label>
                <input value={custName} onChange={e => setCustName(e.target.value)}
                  className={`${inp} flex-1`} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-gray-700 w-28 whitespace-nowrap">City</label>
                <input value={city} onChange={e => setCity(e.target.value)}
                  className={`${inp} w-40`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-700 whitespace-nowrap">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className={`${inp} w-40`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-700 whitespace-nowrap">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  className={`${inp} w-48`} />
              </div>
            </div>

            {/* Row 3 – Credit */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-gray-700 w-28 whitespace-nowrap">Credit Limit</label>
                <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)}
                  className={`${inp} w-36`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-700 whitespace-nowrap">Credit Days</label>
                <input type="number" value={creditDays} onChange={e => setCreditDays(e.target.value)}
                  className={`${inp} w-24`} />
              </div>
            </div>

            {/* Row 4 – Checkboxes */}
            <div className="flex items-center gap-8 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0b8fd3]" />
                Is Active
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={portalAccess}
                  onChange={e => setPortalAccess(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0b8fd3]" />
                Portal Access
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={mobileAccess}
                  onChange={e => setMobileAccess(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0b8fd3]" />
                Mobile Access
              </label>
            </div>

          </div>
        </div>
      </div>

      <div className="pb-8" />
    </div>
  );
}
