import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const DELIVERY_TYPES  = ['--Select--', 'Direct Delivery', 'Door Delivery', 'Godown Delivery'];
const SERVICE_TYPES   = ['--Select--', 'Delivery Area(DA)', 'Outof Delivery Area(ODA)'];
const STATES = [
  'ANDAMAN AND NICOBAR ISLANDS','ANDHRA PRADESH','ANDHRA PRADESH-OLD','ARUNACHAL PRADESH',
  'ASSAM','BIHAR','CHANDIGARH','CHHATTISGARH',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU','DAMAN AND DIU','DELHI','GOA','GUJARAT',
  'HARYANA','HIMACHAL PRADESH','JAMMU AND KASHMIR','JHARKHAND','KARNATAKA','KERALA',
  'LADAKH','LAKSHADWEEP','MADHYA PRADESH','MAHARASHTRA','MANIPUR','MEGHALAYA',
  'MIZORAM','NAGALAND','ODISHA','PUDUCHERRY','PUNJAB','RAJASTHAN','SIKKIM',
  'TAMIL NADU','TELANGANA','TRIPURA','UTTAR PRADESH','UTTARAKHAND','WEST BENGAL',
];

const INITIAL = {
  location: '', controllingBranch: '',
  pinCode: '', state: '--Select--',
  cityDistrict: '', km: '',
  deliveryType: '--Select--', serviceType: '--Select--',
  deactive: false, destinationBranch2: '',
};

export default function Location() {
  const [form, setForm]       = useState(INITIAL);
  const [importMode, setImportMode] = useState('New');
  const [fileName, setFileName]     = useState('No file chosen');
  const fileRef = useRef();

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.location.trim())           { toast.error('Location is required');                    return; }
    if (!form.controllingBranch.trim())  { toast.error('Controlling/Destination Branch required'); return; }
    if (!form.pinCode.trim())            { toast.error('Pin Code is required');                    return; }
    if (form.state === '--Select--')     { toast.error('State is required');                       return; }
    toast.success('Saved successfully');
    setForm(INITIAL);
  };

  const handleRefresh = () => { setForm(INITIAL); setFileName('No file chosen'); };

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Location</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button
            className="flex items-center gap-1.5 bg-[#1976d2] hover:bg-[#1565c0] text-white text-[12px] font-medium px-3 py-1.5 rounded">
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
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">

          {/* Row 1 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-32"><span className="text-red-600">* </span>Location</label>
            <input name="location" value={form.location} onChange={set}
              className="border border-blue-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-600" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-52"><span className="text-red-600">* </span>Controlling /Destination Branch</label>
            <input name="controllingBranch" value={form.controllingBranch} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-32"><span className="text-red-600">* </span>Pin Code</label>
            <input name="pinCode" value={form.pinCode} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-52"><span className="text-red-600">* </span>State</label>
            <select name="state" value={form.state} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {['--Select--', ...STATES].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Row 3 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-32">City/District</label>
            <input name="cityDistrict" value={form.cityDistrict} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-52 text-[#e65100]">KM(From Controlling Branch)</label>
            <input name="km" value={form.km} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
            <button type="button"
              className="w-6 h-6 rounded-full bg-[#1565c0] text-white text-[14px] font-bold flex items-center justify-center hover:bg-[#0d47a1] ml-1 flex-shrink-0">+</button>
          </div>

          {/* Row 4 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-32">Delivery Type</label>
            <select name="deliveryType" value={form.deliveryType} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {DELIVERY_TYPES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-52">Service Type</label>
            <select name="serviceType" value={form.serviceType} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Row 5 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] w-32" />
            <div className="flex items-center gap-2">
              <input type="checkbox" name="deactive" checked={form.deactive} onChange={set}
                id="deactive" className="w-3.5 h-3.5 cursor-pointer" />
              <label htmlFor="deactive" className="text-[13px] cursor-pointer">Deactive</label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] whitespace-nowrap w-52 text-[#e65100]">Destination Branch 2</label>
            <input name="destinationBranch2" value={form.destinationBranch2} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

        </div>
      </div>

      {/* ── Import File section ─────────────────────────────────── */}
      <div className="mb-1">
        <span className="text-red-600 text-[13px] font-medium underline cursor-pointer">Import File</span>
      </div>
      <div className="bg-white rounded shadow-sm px-5 py-3">
        {/* New / Update radio */}
        <div className="flex items-center gap-6 mb-3">
          {['New', 'Update'].map(m => (
            <label key={m} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
              <input type="radio" name="importMode" value={m} checked={importMode === m}
                onChange={e => setImportMode(e.target.value)} className="cursor-pointer" />
              {m}
            </label>
          ))}
        </div>
        {/* File row */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-[13px] font-medium whitespace-nowrap">Select Excel File</label>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-2 py-0.5 border border-gray-400 bg-gray-100 text-[12px] hover:bg-gray-200 rounded-sm">
              Choose File
            </button>
            <span className="text-[12px] text-gray-500">{fileName}</span>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => setFileName(e.target.files[0]?.name || 'No file chosen')} />
          </div>
          <button className="px-3 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Show Data</button>
          <button className="px-3 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Import Data</button>
          <button onClick={() => setFileName('No file chosen')}
            className="px-3 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Refresh Import</button>
          <span className="text-[#1565c0] text-[12px] underline cursor-pointer ml-auto">Download Sample Excel Template</span>
        </div>
      </div>

    </div>
  );
}
