import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const UploadIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>;
const DownloadIcon= <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;

const CONTRACT_TYPES    = ['VendorWise', 'Common'];
const DOC_TYPES         = ['Memo/Menifest', 'LHS', 'Local Delivery(LDM)', 'Local Collection(LCM)', 'Booking'];
const CONTRACT_EXEC     = ['LR-Wise', 'Trip-Wise'];
const TRANSIT_MODES     = ['ROAD', 'AIR', 'RAIL', 'SEA'];
const RATE_ON_OPTS      = ['Location', 'PinCode', 'Zone',  'State', 'Branch'];
const SERVICE_TYPES     = ['DA', 'ODA'];
const CONTRACT_ON_OPTS  = ['Select', 'FIX', 'KG', 'TON', 'QTY', 'FREIGHT(%)', 'KM', 'Bag Qty'];
const LOAD_TYPE_OPTS    = ['--Select--', 'LCV', 'HCV', 'LCV-L'];
const SEARCH_ON_OPTS    = ['Location', 'Zone', 'State', 'Region'];

const INITIAL_FORM = {
  contractType: 'VendorWise', vendorName: '',
  fromDate: '', toDate: '', deactive: false,
  docType: 'Memo/Menifest', contractExecuteType: 'LR-Wise', csPerson: '--Select--',
};

const INITIAL_RATE = {
  transitMode: 'ROAD', rateOn: 'Location',
  from: '', to: '', serviceType: 'DA',
  contractOn: 'Select',
  rangeFrom: '', rangeTo: '', rate: '', minQtyWt: '',
  minFixAmount: '', maxAmount: '', fromKgKm: '', toKgKm: '', extraAmount: '',
  loadType: '--Select--', materialName: '',
};

const INITIAL_SEARCH = { searchOn: 'Location', fromLocation: '', toLocation: '' };

export default function VendorContract() {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [rate, setRate]       = useState(INITIAL_RATE);
  const [search, setSearch]   = useState(INITIAL_SEARCH);
  const [showExtra, setShowExtra] = useState(false);

  const fileRef   = useRef();
  const importRef = useRef();

  const setF = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const setR = e => setRate(r => ({ ...r, [e.target.name]: e.target.value }));
  const setS = e => setSearch(s => ({ ...s, [e.target.name]: e.target.value }));

  const handleRefresh = () => { setForm(INITIAL_FORM); setRate(INITIAL_RATE); setSearch(INITIAL_SEARCH); };

  /* Gray-bg input style for computed/disabled-looking fields */
  const grayInput = "border border-gray-300 bg-gray-100 px-2 py-1 text-[13px] focus:outline-none w-full";
  const stdInput  = "border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 w-full";
  const stdSelect = "border border-gray-400 px-2 py-1 text-[13px] bg-white focus:outline-none focus:border-blue-500 w-full";

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Marked Fields are Compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Vendor Contract</h2>
        </div>
        <div className="flex gap-1.5">
          <button className="flex items-center gap-1.5 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
          <button className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {PrintIcon} Print
          </button>
        </div>
      </div>

      {/* ── Panel 1: Contract Info ───────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">

        {/* Row 1 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Contract Type</label>
            <select name="contractType" value={form.contractType} onChange={setF}
              className="border border-gray-400 px-2 py-1 w-32 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {CONTRACT_TYPES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Vendor Name</label>
            <input name="vendorName" value={form.vendorName} onChange={setF}
              className="border border-gray-300 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>From Date</label>
            <input name="fromDate" value={form.fromDate} onChange={setF} type="date"
              className="border border-gray-300 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>To Date</label>
            <input name="toDate" value={form.toDate} onChange={setF} type="date"
              className="border border-gray-300 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <input type="checkbox" name="deactive" id="deactive" checked={form.deactive} onChange={setF}
              className="w-3.5 h-3.5 cursor-pointer" />
            <label htmlFor="deactive" className="text-[13px] cursor-pointer">Deactive</label>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Doc Type</label>
            <select name="docType" value={form.docType} onChange={setF}
              className="border border-gray-400 px-2 py-1 w-36 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {DOC_TYPES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Contract Execute Type</label>
            <select name="contractExecuteType" value={form.contractExecuteType} onChange={setF}
              className="border border-gray-400 px-2 py-1 w-32 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {CONTRACT_EXEC.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">CS Person</label>
            <select name="csPerson" value={form.csPerson} onChange={setF}
              className="border border-gray-400 px-2 py-1 w-32 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              <option>--Select--</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="file" ref={fileRef} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="border border-gray-400 px-3 py-1 text-[13px] bg-white hover:bg-gray-50 rounded-sm">
              Choose File
            </button>
            <span className="text-[13px] text-gray-500">No file chosen</span>
            <span className="ml-1 text-gray-600 cursor-pointer">{UploadIcon}</span>
            <span className="ml-1 text-gray-600 cursor-pointer">{DownloadIcon}</span>
          </div>
        </div>

        {/* Row 3 – Import row (light gray bg) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-gray-50 px-3 py-2 rounded">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Select Excel File</label>
            <input type="file" ref={importRef} accept=".xlsx,.xls,.csv" className="hidden" />
            <button type="button" onClick={() => importRef.current?.click()}
              className="border border-gray-400 px-3 py-1 text-[13px] bg-white hover:bg-gray-50 rounded-sm">
              Choose File
            </button>
            <span className="text-[13px] text-gray-500">No file chosen</span>
          </div>
          <button type="button"
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
            Import Data
          </button>
          <a href="#" className="text-[#0b8fd3] underline text-[13px]">Download Sample Excel Template</a>
        </div>
      </div>

      {/* ── Panel 2: Rate / Route ────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">

        {/* Row 1 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Transit Mode</label>
            <select name="transitMode" value={rate.transitMode} onChange={setR}
              className="border border-gray-400 px-2 py-1 w-28 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {TRANSIT_MODES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Rate On</label>
            <select name="rateOn" value={rate.rateOn} onChange={setR}
              className="border border-gray-400 px-2 py-1 w-28 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {RATE_ON_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>From</label>
            <input name="from" value={rate.from} onChange={setR}
              className="border border-gray-300 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>To</label>
            <input name="to" value={rate.to} onChange={setR}
              className="border border-gray-300 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Service Type</label>
            <select name="serviceType" value={rate.serviceType} onChange={setR}
              className="border border-gray-400 px-2 py-1 w-24 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {SERVICE_TYPES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Contract on</label>
            <select name="contractOn" value={rate.contractOn} onChange={setR}
              className="border border-gray-400 px-2 py-1 w-28 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {CONTRACT_ON_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Range From</label>
            <input name="rangeFrom" value={rate.rangeFrom} onChange={setR}
              className="border border-gray-300 px-2 py-1 w-28 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Range To</label>
            <input name="rangeTo" value={rate.rangeTo} onChange={setR}
              className="border border-gray-300 px-2 py-1 w-28 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Rate</label>
            <input name="rate" value={rate.rate} onChange={setR}
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] focus:outline-none" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Min/Qty Wt.</label>
            <input name="minQtyWt" value={rate.minQtyWt} onChange={setR}
              className="border border-gray-300 px-2 py-1 w-24 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Min/Fix Amount</label>
            <input name="minFixAmount" value={rate.minFixAmount} onChange={setR}
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] focus:outline-none" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Max Amount</label>
            <input name="maxAmount" value={rate.maxAmount} onChange={setR}
              className="border border-gray-300 px-2 py-1 w-28 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">From KG(KM)</label>
            <input name="fromKgKm" value={rate.fromKgKm} onChange={setR}
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] focus:outline-none" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">To KG(KM)</label>
            <input name="toKgKm" value={rate.toKgKm} onChange={setR}
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] focus:outline-none" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Extra Amount</label>
            <input name="extraAmount" value={rate.extraAmount} onChange={setR}
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] focus:outline-none" />
          </div>
        </div>

        {/* Row 4 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Load Type</label>
            <select name="loadType" value={rate.loadType} onChange={setR}
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] focus:outline-none">
              {LOAD_TYPE_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Material Name</label>
            <input name="materialName" value={rate.materialName} onChange={setR}
              className="border border-gray-300 px-2 py-1 w-64 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Row 5 – Extra Charges + Add */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setShowExtra(x => !x)}
            className="flex items-center gap-1.5 text-orange-600 font-semibold text-[13px]">
            <span className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center text-[14px] font-bold leading-none">+</span>
            Extra Charges
          </button>
          <button type="button" onClick={() => toast.success('Rate added')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Add
          </button>
        </div>

        {/* Extra Charges expanded */}
        {showExtra && (
          <div className="mt-3 border border-orange-200 bg-orange-50 rounded px-4 py-3 text-[13px] text-gray-500">
            Extra charges section — add charge rows here.
          </div>
        )}
      </div>

      {/* ── Panel 3: Search Filter ───────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Search On</label>
            <select name="searchOn" value={search.searchOn} onChange={setS}
              className="border border-gray-400 px-2 py-1 w-24 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {SEARCH_ON_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">From Location</label>
            <input name="fromLocation" value={search.fromLocation} onChange={setS}
              className="border border-gray-300 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">To Location</label>
            <input name="toLocation" value={search.toLocation} onChange={setS}
              className="border border-gray-300 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <button type="button"
            className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 flex-shrink-0">
            {SearchIcon}
          </button>
        </div>
      </div>

      {/* ── Results area ─────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-6 min-h-[80px]">
        <p className="text-center text-gray-400 text-[13px]">No data available</p>
      </div>

    </div>
  );
}
