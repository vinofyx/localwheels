import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const EditIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const BRANCH_TYPES = ['BRANCH', 'HEAD OFFICE', 'HUB', 'FRANCHISES/TRANSPORTER', 'CUSTOMER WAREHOUSE'];
const ALLOW_FOR    = ['BOTH', 'BOOKING', 'DELIVERY'];
const STATES = [
  'ANDAMAN AND NICOBAR ISLANDS','ANDHRA PRADESH','ANDHRA PRADESH-OLD','ARUNACHAL PRADESH',
  'ASSAM','BIHAR','CHANDIGARH','CHHATTISGARH',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU','DAMAN AND DIU','DELHI','GOA','GUJARAT',
  'HARYANA','HIMACHAL PRADESH','JAMMU AND KASHMIR','JHARKHAND','KARNATAKA','KERALA',
  'LADAKH','LAKSHADWEEP','MADHYA PRADESH','MAHARASHTRA','MANIPUR','MEGHALAYA',
  'MIZORAM','NAGALAND','ODISHA','PUDUCHERRY','PUNJAB','RAJASTHAN','SIKKIM',
  'TAMIL NADU','TELANGANA','TRIPURA','UTTAR PRADESH','UTTARAKHAND','WEST BENGAL',
];

const PER_OPTIONS = ['QTY', 'WEIGHT', 'FREIGHT(%)'];

const INITIAL = {
  branchType: 'BRANCH', branch: '', shortName: '',
  region: '--Select--', address1: '', address2: '',
  state: '--Select--', pincode: '', mailId: '',
  contactPerson: '', gstin: '', contactNo: '',
  allowFor: 'BOTH', hideBranch: false,
  // E-WayBill Limit
  withinStateLimit: '', outOfStateLimit: '',
  // GEO Location
  latitude: '', longitude: '',
  // Default Settings
  fromStation: '', cashLedger: '', controllingBranch: '',
  // Franchise Details
  vendorName: '', bookingPer: 'QTY', bookingRate: '', deliveryPer: 'QTY', deliveryRate: '',
};

const COL_KEYS = ['branchType','branch','shortName','address1','region','pincode','controllingBranch','cashLedger','hideBranch','createdUser','createdDate','lastModify','modifyDate'];

const TABS = ['Branch List', 'E-WayBill Limit', 'Frenchise Details', 'GEO Location', 'Default Settings'];

export default function Branch() {
  const [form, setForm]           = useState(INITIAL);
  const [rows, setRows]           = useState([]);
  const [colSearch, setColSearch] = useState(Object.fromEntries(COL_KEYS.map(k => [k, ''])));
  const [page, setPage]           = useState(1);
  const [activeTab, setActiveTab] = useState('Branch List');
  const perPage = 10;

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.branch.trim())           { toast.error('Branch is required');      return; }
    if (!form.shortName.trim())        { toast.error('Short Name is required');  return; }
    if (form.region === '--Select--')  { toast.error('Region is required');      return; }
    if (!form.address1.trim())         { toast.error('Address1 is required');    return; }
    if (form.state === '--Select--')   { toast.error('State is required');       return; }
    if (!form.pincode.trim())          { toast.error('Pincode is required');     return; }
    if (!form.mailId.trim())           { toast.error('Mail Id is required');     return; }
    const now = new Date().toLocaleString('en-GB', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false,
    }).replace(',', '');
    setRows(r => [...r, {
      id: Date.now(),
      branchType: form.branchType, branch: form.branch.trim(),
      shortName: form.shortName.trim(), address1: form.address1.trim(),
      region: form.region, pincode: form.pincode.trim(),
      controllingBranch: '', cashLedger: '',
      hideBranch: form.hideBranch ? 'True' : 'False',
      createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '',
    }]);
    setForm(INITIAL);
    toast.success('Saved successfully');
  };

  const handleEdit = id => {
    const row = rows.find(r => r.id === id);
    if (row) {
      setForm({ branchType: row.branchType, branch: row.branch, shortName: row.shortName,
        region: row.region, address1: row.address1, address2: '', state: '--Select--',
        pincode: row.pincode, mailId: '', contactPerson: '', gstin: '', contactNo: '',
        allowFor: 'BOTH', hideBranch: row.hideBranch === 'True' });
      toast.success('Loaded for editing');
    }
  };

  const handleRefresh = () => {
    setForm(INITIAL);
    setColSearch(Object.fromEntries(COL_KEYS.map(k => [k, ''])));
    setPage(1);
  };

  const filtered = rows.filter(r => COL_KEYS.every(c => (r[c] ?? '').toString().toLowerCase().includes(colSearch[c].toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const sliced = filtered.slice((page - 1) * perPage, page * perPage);
  const from = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, filtered.length);

  const regionOptions = [...new Set(rows.map(r => r.region).filter(v => v && v !== '--Select--'))];

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Marked Fields are Compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Branch</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">

        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-24"><span className="text-red-600">* </span>Branch Type</label>
            <select name="branchType" value={form.branchType} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {BRANCH_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-16"><span className="text-red-600">* </span>Branch</label>
            <input name="branch" value={form.branch} onChange={set}
              className="border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-20"><span className="text-red-600">* </span>ShortName</label>
            <input name="shortName" value={form.shortName} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-24"><span className="text-red-600">* </span>Region</label>
            <select name="region" value={form.region} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              <option>--Select--</option>
              {regionOptions.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-16"><span className="text-red-600">* </span>Address1</label>
            <input name="address1" value={form.address1} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-20"><span className="text-red-600">* </span>Address2</label>
            <input name="address2" value={form.address2} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-24"><span className="text-red-600">* </span>State</label>
            <select name="state" value={form.state} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              <option>--Select--</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-16"><span className="text-red-600">* </span>Pincode</label>
            <input name="pincode" value={form.pincode} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-20"><span className="text-red-600">* </span>Mail Id</label>
            <input name="mailId" value={form.mailId} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-24">Contact Person</label>
            <input name="contactPerson" value={form.contactPerson} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-16">GSTIN</label>
            <input name="gstin" value={form.gstin} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-20">Contact No</label>
            <input name="contactNo" value={form.contactNo} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Row 5 */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-24">Allow For</label>
            <select name="allowFor" value={form.allowFor} onChange={set}
              className="border border-gray-400 px-2 py-1 w-44 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {ALLOW_FOR.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="hideBranch" checked={form.hideBranch} onChange={set}
              className="w-3.5 h-3.5 cursor-pointer" id="hideBranch" />
            <label htmlFor="hideBranch" className="text-[13px] cursor-pointer">Hide Branch</label>
          </div>
        </div>

      </div>

      {/* ── Tabs + Table panel ──────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">

        {/* Tab bar */}
        <div className="flex gap-0 mb-3 border-b border-gray-300">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[13px] font-medium border border-b-0 rounded-t transition-colors ${
                activeTab === tab
                  ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Branch List' ? (
          <>
            {/* Export */}
            <div className="flex justify-end mb-2">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-gray-600">Export as:</span>
                <select className="border border-gray-300 px-2 py-0.5 text-[13px] bg-white">
                  <option>-- Select --</option>
                  <option>Excel</option>
                  <option>PDF</option>
                  <option>CSV</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]" style={{ minWidth: '1100px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">BranchType {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Branch {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">ShortName {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Address1 {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Region {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Pincode {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Controlling Branch {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">CashLedger {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">HideBranch {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Created User {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Created Date {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Last Modify {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Modify Date {SortIcon}</th>
                    <th className="px-2 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Edit {SortIcon}</th>
                  </tr>
                  <tr className="bg-white">
                    {COL_KEYS.map(col => (
                      <td key={col} className="px-1 py-1 border border-gray-300">
                        <input
                          value={colSearch[col]}
                          onChange={e => { setColSearch(s => ({ ...s, [col]: e.target.value })); setPage(1); }}
                          placeholder="Search"
                          className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none focus:border-blue-400"
                        />
                      </td>
                    ))}
                    <td className="px-1 py-1 border border-gray-300">
                      <input placeholder="Search" className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none" />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {sliced.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-3 py-6 text-center text-gray-500 border border-gray-200">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    sliced.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0] font-medium whitespace-nowrap">{row.branchType}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0] font-medium whitespace-nowrap">{row.branch}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.shortName}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{row.address1}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.region}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{row.pincode}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{row.controllingBranch}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{row.cashLedger}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{row.hideBranch}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.createdUser}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200 whitespace-nowrap">{row.createdDate}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.lastModify}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{row.modifyDate}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200 text-center">
                          <button onClick={() => handleEdit(row.id)} className="text-gray-600 hover:text-blue-600">{EditIcon}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-2 text-[12px] text-gray-600">
              <span>
                Showing <span className="text-[#1565c0] font-medium">{from}</span> to{' '}
                <span className="text-[#1565c0] font-medium">{to}</span> of{' '}
                <span className="text-[#1565c0] font-medium">{filtered.length}</span> entries
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${p === page ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'border-gray-300 hover:bg-gray-100'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        ) : activeTab === 'E-WayBill Limit' ? (
          <div className="flex items-center gap-8 py-4 px-2">
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Within State Limit</label>
              <input name="withinStateLimit" value={form.withinStateLimit} onChange={set}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Out of State Limit</label>
              <input name="outOfStateLimit" value={form.outOfStateLimit} onChange={set}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
          </div>

        ) : activeTab === 'GEO Location' ? (
          <div className="flex items-center gap-8 py-4 px-2">
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Latitude</label>
              <input name="latitude" value={form.latitude} onChange={set}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Longitude</label>
              <input name="longitude" value={form.longitude} onChange={set}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
          </div>

        ) : activeTab === 'Frenchise Details' ? (
          <div className="py-4 px-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap w-24">Vendor Name</label>
              <input name="vendorName" value={form.vendorName} onChange={set}
                className="border border-gray-400 px-2 py-1 w-52 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap w-24">Booking Per</label>
              <select name="bookingPer" value={form.bookingPer} onChange={set}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] bg-white focus:outline-none focus:border-blue-500">
                {PER_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              <label className="text-[13px] whitespace-nowrap ml-4">Rate</label>
              <input name="bookingRate" value={form.bookingRate} onChange={set}
                className="border border-gray-400 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap w-24">Delivery Per</label>
              <select name="deliveryPer" value={form.deliveryPer} onChange={set}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] bg-white focus:outline-none focus:border-blue-500">
                {PER_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              <label className="text-[13px] whitespace-nowrap ml-4">Rate</label>
              <input name="deliveryRate" value={form.deliveryRate} onChange={set}
                className="border border-gray-400 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
          </div>

        ) : activeTab === 'Default Settings' ? (
          <div className="py-4 px-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap">From Station</label>
                <input name="fromStation" value={form.fromStation} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap">Cash Ledger</label>
                <input name="cashLedger" value={form.cashLedger} onChange={set}
                  className="border border-gray-300 bg-gray-100 px-2 py-1 w-44 text-[13px] focus:outline-none" readOnly />
                <button type="button"
                  className="w-6 h-6 rounded-full bg-[#1565c0] text-white text-[14px] font-bold flex items-center justify-center hover:bg-[#0d47a1]">+</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap">Controlling Branch</label>
                <input name="controllingBranch" value={form.controllingBranch} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

        ) : (
          <div className="py-10 text-center text-gray-400 text-[13px]">No data available</div>
        )}

      </div>
    </div>
  );
}
