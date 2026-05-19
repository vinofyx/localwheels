import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const UploadIcon  = <svg className="w-5 h-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v12"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'NEFT', 'RTGS'];

const EXPENSE_CHARGES = [
  { label: 'DRIVER FOODING EXPENSE CHARGES', orange: false },
  { label: 'DRIVER UNLOADING CHARGES',       orange: false },
  { label: 'DRIVER-LOADING CHARGES',         orange: true  },
  { label: 'HELPER FOODING EXPENSE CHARGES', orange: false },
  { label: 'HELPER UNLOADING CHARGES',       orange: false },
  { label: 'LOADING CHARGES BY HAMALI',      orange: false },
  { label: 'OTHER EXPENSE CHARGES',          orange: false },
  { label: 'THAI BAZAR CHARGES',             orange: false },
  { label: 'TOLL EXPENSE CHARGES',           orange: false },
  { label: 'TRIP UNLOADING CHARGES',         orange: false },
  { label: 'UNLOADING CHARGES BY HAMALI',    orange: false },
  { label: 'VECHILE BREAKDOWN EXPENSES',     orange: false },
];

const today = new Date().toISOString().slice(0, 10);

const INITIAL = {
  vehicleNo: '', remark: '-',
  paymentMode: 'CASH', paymentBy: '', chequeNo: '', advanceAmount: '', driverName: '',
};

// Initial expense amounts keyed by label
const initExpenses = () => Object.fromEntries(EXPENSE_CHARGES.map(e => [e.label, '']));

const TABS = ['Advance Details', 'Diesel Details', 'FasTag Details'];

const FILTER_OPTS = ['Memo No', 'Vehicle No', 'LHS No'];

const DIESEL_INIT = {
  dieselAgent: '', kmReading: '0', rate: '0', liter: '0', dieselAmount: '',
  receiptNo: '', receiptDate: '', challanNo: '', challanDate: '',
};

const FASTAG_INIT = {
  fastagAccount: '', tollLocation: '', tollAmount: '',
};

export default function ExtraAdvanceDiesel() {
  const [form,        setForm]        = useState(INITIAL);
  const [tab,         setTab]         = useState('Advance Details');
  const [expenses,    setExpenses]    = useState(initExpenses());
  const [memoRows,    setMemoRows]    = useState([]);
  const [diesel,      setDiesel]      = useState(DIESEL_INIT);
  const [fastag,      setFastag]      = useState(FASTAG_INIT);
  const [showFilter,  setShowFilter]  = useState(false);
  const [filterBy,    setFilterBy]    = useState('Memo No');
  const [filterVal,   setFilterVal]   = useState('');
  const [filterRows,  setFilterRows]  = useState([]);
  const [selectAll,   setSelectAll]   = useState(false);

  const set = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const setD = e => { const { name, value } = e.target; setDiesel(d => ({ ...d, [name]: value })); };
  const setF = e => { const { name, value } = e.target; setFastag(f => ({ ...f, [name]: value })); };

  const handleFilterSearch = () => {
    if (!filterVal.trim()) { toast.error(`Please enter ${filterBy}`); return; }
    setFilterRows([]); // no mock data
  };

  const isCash = form.paymentMode === 'CASH';

  const handleSave = () => {
    if (!form.vehicleNo.trim()) { toast.error('Vehicle No is required');   return; }
    if (!form.advanceAmount)    { toast.error('Advance Amount is required'); return; }
    if (!form.driverName.trim()) { toast.error('Driver Name is required');   return; }
    toast.success('Saved successfully');
  };

  const handleRefresh = () => {
    setForm(INITIAL);
    setExpenses(initExpenses());
    setMemoRows([]);
    setDiesel(DIESEL_INIT);
    setFastag(FASTAG_INIT);
    setTab('Advance Details');
    setShowFilter(false);
    setFilterVal('');
    setFilterRows([]);
    setSelectAll(false);
  };

  const inp  = 'border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
  const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-600';
  const inpG = 'border border-gray-300 px-2 py-1 text-[13px] bg-gray-100 cursor-not-allowed';

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          ExtraAdvance/Diesel
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={() => toast('Search')}
            className="flex items-center gap-1.5 bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refersh
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {PrintIcon} Print
          </button>
        </div>
      </div>

      {/* ── Header form card ─────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">
        {/* Row 1: Pay No | Date | Vehicle No | Select Trip */}
        <div className="flex items-center gap-6 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-red-600 font-medium whitespace-nowrap">* Pay No.</label>
            <input disabled value="1" className={`${inpG} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-red-600 font-medium whitespace-nowrap">* Date</label>
            <input type="date" value={today} readOnly className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-red-600 font-medium whitespace-nowrap">* Vehicle No</label>
            <input name="vehicleNo" value={form.vehicleNo} onChange={set}
              className={`${inpR} w-48`} />
          </div>
          <button onClick={() => { setShowFilter(true); setFilterVal(''); setFilterRows([]); setSelectAll(false); }}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-5 py-1.5 rounded ml-auto">
            Select Trip
          </button>
        </div>

        {/* Row 2: Remark | Upload Documents */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-red-600 font-medium whitespace-nowrap">* Remark</label>
            <input name="remark" value={form.remark} onChange={set}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="text-blue-600 underline text-[13px] hover:text-blue-800">
              Upload Documents
            </button>
            <span className="text-gray-500">{UploadIcon}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mb-2">
        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 ${
                tab === t ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Advance Details tab */}
        {tab === 'Advance Details' && (
          <div className="px-5 py-4">
            {/* Row 1: Payment Mode | Payment By | Cheque No | Cheque Date | Advance Amount */}
            <div className="flex items-center gap-4 flex-wrap mb-3">
              <div className="flex items-center gap-2">
                <label className="text-red-600 font-medium whitespace-nowrap">* Payment Mode</label>
                <select name="paymentMode" value={form.paymentMode} onChange={set}
                  className={`${inp} w-24`}>
                  {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-red-600 font-medium whitespace-nowrap">* Payment By</label>
                <select name="paymentBy" value={form.paymentBy} onChange={set}
                  className={`${inp} w-36`}>
                  <option value="">--Select--</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-red-600 font-medium whitespace-nowrap">* Cheque/TRN No</label>
                <input name="chequeNo" value={isCash ? '' : form.chequeNo}
                  onChange={set} disabled={isCash}
                  className={isCash ? `${inpG} w-32` : `${inpR} w-32`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-red-600 font-medium whitespace-nowrap">* Cheque/TRN Date</label>
                <input type="date" value={isCash ? today : ''} readOnly={isCash}
                  className={isCash ? `${inpG} w-36` : `${inp} w-36`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-red-600 font-medium whitespace-nowrap">* Advance Amount</label>
                <input name="advanceAmount" value={form.advanceAmount} onChange={set}
                  className={`${inpR} w-28`} />
              </div>
            </div>

            {/* Row 2: Driver Name */}
            <div className="flex items-center gap-2">
              <label className="text-red-600 font-medium whitespace-nowrap">* Driver Name</label>
              <input name="driverName" value={form.driverName} onChange={set}
                className={`${inpR} w-60`} />
            </div>
          </div>
        )}

        {/* Diesel Details tab */}
        {tab === 'Diesel Details' && (
          <div className="px-5 py-4">
            {/* Row 1 */}
            <div className="flex items-center gap-4 flex-wrap mb-3">
              <div className="flex items-center gap-2">
                <label className="text-red-600 font-medium whitespace-nowrap">* Diesel Agent</label>
                <input name="dieselAgent" value={diesel.dieselAgent} onChange={setD}
                  className={`${inpR} w-40`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">KM Reading</label>
                <input name="kmReading" value={diesel.kmReading} onChange={setD}
                  className={`${inp} w-28`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Rate</label>
                <input name="rate" value={diesel.rate} onChange={setD}
                  className={`${inp} w-24`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Liter</label>
                <input name="liter" value={diesel.liter} onChange={setD}
                  className={`${inp} w-24`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-red-600 font-medium whitespace-nowrap">* Diesel Amount</label>
                <input name="dieselAmount" value={diesel.dieselAmount} onChange={setD}
                  className={`${inpR} w-32`} />
              </div>
            </div>
            {/* Row 2 */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Receipt No</label>
                <input name="receiptNo" value={diesel.receiptNo} onChange={setD}
                  className={`${inp} w-40`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Receipt Date</label>
                <input type="date" name="receiptDate" value={diesel.receiptDate} onChange={setD}
                  className={`${inp} w-36`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Challan No</label>
                <input name="challanNo" value={diesel.challanNo} onChange={setD}
                  className={`${inp} w-28`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Challan Date</label>
                <input type="date" name="challanDate" value={diesel.challanDate} onChange={setD}
                  className={`${inp} w-36`} />
              </div>
            </div>
          </div>
        )}

        {/* FasTag Details tab */}
        {tab === 'FasTag Details' && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-red-600 font-medium whitespace-nowrap">* FasTag Account</label>
                <input name="fastagAccount" value={fastag.fastagAccount} onChange={setF}
                  className={`${inpR} w-44`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Toll Location</label>
                <input name="tollLocation" value={fastag.tollLocation} onChange={setF}
                  className={`${inp} w-44`} />
              </div>
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap">Toll Amount</label>
                <input name="tollAmount" value={fastag.tollAmount} onChange={setF}
                  className={`${inp} w-36`} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 2-column area: Memo table (left) + Expenses (right) ─ */}
      <div className="flex gap-2 items-start">

        {/* LEFT: Memo table + Trip details ─────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">

          {/* Memo table */}
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Memo Type</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Branch {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Memo No {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Memo Date {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">VehicleNo {SortIcon}</th>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">Delete {SortIcon}</th>
                  </tr>
                </thead>
                <tbody>
                  {memoRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-gray-500 border-b border-gray-200">
                        No data available in table
                      </td>
                    </tr>
                  ) : memoRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.memoType}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.branch}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.memoNo}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.memoDate}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.vehicleNo}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                        <button className="text-red-500 hover:text-red-700 text-[12px]">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trip Advance, Diesel and FasTag Details */}
          <div className="bg-white rounded shadow-sm px-4 py-4 text-center">
            <span className="font-bold text-[13px]">Trip Advance, Diesel and FasTag Details</span>
          </div>
        </div>

        {/* RIGHT: Expenses Against Advance ─────────────────────── */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="px-3 py-2">
              <span className="font-bold text-[13px]">Expenses Againest Advance</span>
            </div>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                  <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Charge Head</th>
                  <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {EXPENSE_CHARGES.map(({ label, orange }) => (
                  <tr key={label} className="border-b border-gray-100">
                    <td className={`px-3 py-1.5 text-[12px] ${orange ? 'text-orange-500' : 'text-gray-700'}`}>
                      {label}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={expenses[label]}
                        onChange={e => setExpenses(ex => ({ ...ex, [label]: e.target.value }))}
                        className="border border-gray-300 px-1.5 py-0.5 w-full text-[13px] focus:outline-none focus:border-blue-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Select Filter Modal ───────────────────────────────── */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white w-[700px] max-h-[90vh] flex flex-col shadow-2xl rounded-sm overflow-hidden">

            {/* Modal title bar */}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ backgroundColor: '#1a9fc2' }}>
              <span className="text-white font-semibold text-[14px] mx-auto">Select Filter</span>
              <button onClick={() => setShowFilter(false)}
                className="text-white font-bold text-[18px] leading-none hover:opacity-80 ml-auto">
                ✕
              </button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-black">
              <label className="text-[13px] font-medium">Filter</label>
              <select value={filterBy} onChange={e => { setFilterBy(e.target.value); setFilterVal(''); setFilterRows([]); }}
                className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[100px]">
                {FILTER_OPTS.map(o => <option key={o}>{o}</option>)}
              </select>
              <input value={filterVal} onChange={e => setFilterVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFilterSearch()}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
              <button onClick={handleFilterSearch}>
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700 fill-current hover:text-gray-900 cursor-pointer">
                  <path d="M21.71 20.29l-4.1-4.1A8 8 0 103.69 17.31a8 8 0 0011.9.3l4.1 4.1a1 1 0 001.42-1.42zM5 11a6 6 0 116 6 6 6 0 01-6-6z"/>
                </svg>
              </button>
            </div>

            {/* Select All row */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-300">
              <input type="checkbox" checked={selectAll}
                onChange={e => setSelectAll(e.target.checked)}
                className="w-4 h-4 cursor-pointer" />
              <label className="text-[13px] font-medium cursor-pointer" onClick={() => setSelectAll(s => !s)}>
                Select All
              </label>
              {/* Checkmark icon */}
              <svg className="w-5 h-5 text-gray-700 fill-current" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-auto px-4 py-3 min-h-[260px]">
              {filterRows.length === 0 && (
                <div className="text-center text-gray-400 py-10 text-[13px]">No records found</div>
              )}
            </div>

            {/* Horizontal scrollbar placeholder */}
            <div className="border-t border-gray-200 h-4 overflow-x-auto">
              <div className="w-[800px] h-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
