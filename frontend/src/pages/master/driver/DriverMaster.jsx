import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const EditIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const TABS         = ['Upload Driver Photo', 'Driver Account Details', 'Document Upload', 'Salary Details', 'Import Data', 'Vehicle Load Type'];
const SALARY_TYPES      = ['Per Day', 'Per KM', 'Monthly'];
const VEHICLE_LOAD_TYPES = ['HCV', 'LCV', 'LCV-L'];

const INITIAL = {
  driverName: '', address: '',
  aadharCardNo: '', phoneNo: '',
  licenseNo: '', birthDate: '',
  licenseDate: '', licenseExpiryDate: '',
  referencePerson: '', joiningDate: '',
  linkLedger: '', driverCode: '',
  deactive: false,
  // Driver Account Details
  benificiaryName: '', bankName: '',
  bankBranch: '', ifscCode: '',
  accountNo: '', openingBalance: '', openingBalanceDate: '',
  // Salary Details
  salaryType: 'Per Day', salary: '',
  // Document Upload
  docName: '',
};

const COL_KEYS = ['driverName', 'aadharCardNo', 'licenseNo', 'licenseDate', 'licenseExpiryDate', 'phoneNo', 'driverCode', 'createdUser', 'createdDate', 'lastModify', 'modifyDate'];

export default function DriverMaster() {
  const [form, setForm]           = useState(INITIAL);
  const [activeTab, setActiveTab]   = useState(0);
  const [vltEdit, setVltEdit]       = useState(false);
  const [vltSelected, setVltSelected] = useState(Object.fromEntries(VEHICLE_LOAD_TYPES.map(t => [t, false])));
  const [rows, setRows]           = useState([]);
  const [colSearch, setColSearch] = useState(Object.fromEntries(COL_KEYS.map(k => [k, ''])));
  const [page, setPage]           = useState(1);
  const perPage = 10;

  const photoRef   = useRef();
  const docRef     = useRef();
  const importRef  = useRef();

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.driverName.trim())        { toast.error('Driver Name is required');        return; }
    if (!form.address.trim())           { toast.error('Address is required');            return; }
    if (!form.aadharCardNo.trim())      { toast.error('Aadhar Card No is required');     return; }
    if (!form.phoneNo.trim())           { toast.error('Phone No is required');           return; }
    if (!form.licenseNo.trim())         { toast.error('License No is required');         return; }
    if (!form.licenseDate.trim())       { toast.error('License Date is required');       return; }
    if (!form.licenseExpiryDate.trim()) { toast.error('License Expiry Date is required'); return; }
    const now = new Date().toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).replace(',', '');
    setRows(r => [...r, {
      id: Date.now(),
      driverName: form.driverName.trim(),
      aadharCardNo: form.aadharCardNo.trim(),
      licenseNo: form.licenseNo.trim(),
      licenseDate: form.licenseDate.trim(),
      licenseExpiryDate: form.licenseExpiryDate.trim(),
      phoneNo: form.phoneNo.trim(),
      driverCode: form.driverCode.trim(),
      createdUser: 'admin', createdDate: now, lastModify: '', modifyDate: '',
    }]);
    setForm(INITIAL);
    toast.success('Saved successfully');
  };

  const handleEdit = id => {
    const row = rows.find(r => r.id === id);
    if (row) {
      setForm(f => ({ ...f, driverName: row.driverName, aadharCardNo: row.aadharCardNo, licenseNo: row.licenseNo, licenseDate: row.licenseDate, licenseExpiryDate: row.licenseExpiryDate, phoneNo: row.phoneNo, driverCode: row.driverCode }));
      toast.success('Loaded for editing');
    }
  };

  const handleRefresh = () => { setForm(INITIAL); setActiveTab(0); setColSearch(Object.fromEntries(COL_KEYS.map(k => [k, '']))); setPage(1); };

  const filtered   = rows.filter(r => COL_KEYS.every(c => (r[c] ?? '').toString().toLowerCase().includes(colSearch[c].toLowerCase())));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const sliced     = filtered.slice((page - 1) * perPage, page * perPage);
  const from       = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to         = Math.min(page * perPage, filtered.length);

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Driver Master</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button
            className="flex items-center gap-1.5 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-4 mb-2">
        <div className="grid grid-cols-2 gap-x-10 gap-y-3 mb-3">

          {/* Row 1 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>Driver Name</label>
            <input name="driverName" value={form.driverName} onChange={set}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>Address</label>
            <input name="address" value={form.address} onChange={set}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>Aadhar Card No</label>
            <input name="aadharCardNo" value={form.aadharCardNo} onChange={set}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>Phone No</label>
            <input name="phoneNo" value={form.phoneNo} onChange={set}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 3 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>License No</label>
            <input name="licenseNo" value={form.licenseNo} onChange={set}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36">Birth Date</label>
            <input name="birthDate" value={form.birthDate} onChange={set} type="date"
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 4 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>License Date</label>
            <input name="licenseDate" value={form.licenseDate} onChange={set} type="date"
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>License Expiry Date</label>
            <input name="licenseExpiryDate" value={form.licenseExpiryDate} onChange={set} type="date"
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 5 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36">Reference Person</label>
            <input name="referencePerson" value={form.referencePerson} onChange={set}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36">Joining Date</label>
            <input name="joiningDate" value={form.joiningDate} onChange={set} type="date"
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 6 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36">Link Ledger</label>
            <input name="linkLedger" value={form.linkLedger} onChange={set}
              className="border border-gray-300 bg-gray-100 px-2 py-1 flex-1 text-[13px] focus:outline-none" />
            <button type="button"
              className="w-6 h-6 rounded-full bg-gray-800 text-white text-[14px] font-bold flex items-center justify-center hover:bg-gray-700 flex-shrink-0">+</button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36">Driver Code</label>
            <input name="driverCode" value={form.driverCode} onChange={set}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

        </div>

        {/* Deactive checkbox */}
        <div className="flex items-center gap-2">
          <input type="checkbox" name="deactive" id="deactive" checked={form.deactive} onChange={set}
            className="w-3.5 h-3.5 cursor-pointer" />
          <label htmlFor="deactive" className="text-[13px] cursor-pointer">Deactive</label>
        </div>
      </div>

      {/* ── Tabs panel ──────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mb-2">
        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 transition-colors whitespace-nowrap
                ${activeTab === i ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 py-4">

          {/* Tab 0 – Upload Driver Photo */}
          {activeTab === 0 && (
            <div className="flex items-center gap-3">
              <label className="text-[13px]">
                Upload Photo{' '}
                <span className="text-red-500 text-[12px]">(png,jpg,jpeg,bmp)</span>
              </label>
              <input type="file" ref={photoRef} accept=".png,.jpg,.jpeg,.bmp" className="hidden" />
              <button type="button" onClick={() => photoRef.current?.click()}
                className="border border-gray-400 px-3 py-1 text-[13px] bg-white hover:bg-gray-50 rounded-sm">
                Choose File
              </button>
              <span className="text-[13px] text-gray-500">No file chosen</span>
            </div>
          )}

          {/* Tab 1 – Driver Account Details */}
          {activeTab === 1 && (
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-40">Benificiary Name</label>
                <input name="benificiaryName" value={form.benificiaryName} onChange={set}
                  className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-32">Bank Name</label>
                <input name="bankName" value={form.bankName} onChange={set}
                  className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-40">Bank Branch</label>
                <input name="bankBranch" value={form.bankBranch} onChange={set}
                  className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-32">IFSC Code</label>
                <input name="ifscCode" value={form.ifscCode} onChange={set}
                  className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-40">Account No</label>
                <input name="accountNo" value={form.accountNo} onChange={set}
                  className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-4 col-span-1">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[13px] whitespace-nowrap w-32">Opening Balance</label>
                  <input name="openingBalance" value={form.openingBalance} onChange={set}
                    className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-[13px] whitespace-nowrap">Opening Balance as on date</label>
                  <input name="openingBalanceDate" value={form.openingBalanceDate} onChange={set} type="date"
                    className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2 – Document Upload */}
          {activeTab === 2 && (
            <div>
              <p className="text-red-500 text-[12px] mb-3">(Upload File Upto 3 MB..)</p>
              <div className="flex items-center gap-3">
                <label className="text-[13px] whitespace-nowrap">Document Name</label>
                <input name="docName" value={form.docName} onChange={set}
                  className="border border-gray-300 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
                <input type="file" ref={docRef} className="hidden" />
                <button type="button" onClick={() => docRef.current?.click()}
                  className="border border-gray-400 px-3 py-1 text-[13px] bg-white hover:bg-gray-50 rounded-sm">
                  Choose File
                </button>
                <span className="text-[13px] text-gray-500">No file chosen</span>
                <button type="button"
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
                  Upload File
                </button>
              </div>
            </div>
          )}

          {/* Tab 3 – Salary Details */}
          {activeTab === 3 && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap">Salary Type</label>
                <select name="salaryType" value={form.salaryType} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-48 text-[13px] bg-white focus:outline-none focus:border-blue-500">
                  {SALARY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap">Salary</label>
                <input name="salary" value={form.salary} onChange={set}
                  className="border border-gray-300 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          )}

          {/* Tab 4 – Import Data */}
          {activeTab === 4 && (
            <div className="flex items-center gap-3 flex-wrap">
              <a href="#" className="text-[#0b8fd3] underline text-[13px]">Download Sample Excel Template</a>
              <label className="text-[13px] whitespace-nowrap">Select Excel File</label>
              <input type="file" ref={importRef} accept=".xlsx,.xls,.csv" className="hidden" />
              <button type="button" onClick={() => importRef.current?.click()}
                className="border border-gray-400 px-3 py-1 text-[13px] bg-white hover:bg-gray-50 rounded-sm">
                Choose File
              </button>
              <span className="text-[13px] text-gray-500">No file chosen</span>
              <button type="button"
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-3 py-1.5 rounded">
                Refresh
              </button>
              <button type="button"
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-3 py-1.5 rounded">
                Import Data
              </button>
              <button type="button"
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-3 py-1.5 rounded">
                Show Data
              </button>
            </div>
          )}

          {/* Tab 5 – Vehicle Load Type */}
          {activeTab === 5 && (
            <div>
              {/* Edit checkbox */}
              <div className="flex items-center gap-1.5 mb-2">
                <input type="checkbox" id="vltEdit" checked={vltEdit}
                  onChange={e => setVltEdit(e.target.checked)}
                  className="w-3.5 h-3.5 cursor-pointer" />
                <label htmlFor="vltEdit" className="text-[13px] font-semibold cursor-pointer">Edit</label>
              </div>
              {/* Table */}
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[90%]">Vehicle Load Type</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[10%]">Select</th>
                  </tr>
                </thead>
                <tbody>
                  {VEHICLE_LOAD_TYPES.map((type, i) => (
                    <tr key={type} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                      <td className={`px-3 py-2 border-b border-gray-200 ${i === 0 ? 'text-gray-800' : 'text-red-600'}`}>{type}</td>
                      <td className="px-3 py-2 border-b border-gray-200">
                        <input type="checkbox"
                          checked={vltSelected[type]}
                          disabled={!vltEdit}
                          onChange={e => setVltSelected(s => ({ ...s, [type]: e.target.checked }))}
                          className="w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* ── Table panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">

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
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Driver Name {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Aadhar Card No {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">License No {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">License Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">License Expiry Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Phone No {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Driver Code {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Created User {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Created Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Last Modify {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Modify Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Edit {SortIcon}</th>
              </tr>
              <tr className="bg-white">
                {COL_KEYS.map(col => (
                  <td key={col} className="px-2 py-1 border border-gray-300">
                    <input value={colSearch[col]}
                      onChange={e => { setColSearch(s => ({ ...s, [col]: e.target.value })); setPage(1); }}
                      placeholder="Search"
                      className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none focus:border-blue-400" />
                  </td>
                ))}
                <td className="px-2 py-1 border border-gray-300">
                  <input placeholder="Search" className="w-full px-1.5 py-0.5 border border-gray-300 text-[12px] focus:outline-none" />
                </td>
              </tr>
            </thead>
            <tbody>
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-6 text-center text-gray-500 border border-gray-200">
                    No data available in table
                  </td>
                </tr>
              ) : (
                sliced.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0] font-medium whitespace-nowrap">{row.driverName}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.aadharCardNo}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.licenseNo}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.licenseDate}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.licenseExpiryDate}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.phoneNo}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.driverCode}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.createdUser}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 whitespace-nowrap">{row.createdDate}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.lastModify}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.modifyDate}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-center">
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

      </div>
    </div>
  );
}
