import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const UploadIcon  = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>;

const TABLE_COLS = ['Bill No', 'Bill Date', 'Bill Type', 'Bill Party', 'Bill Amount', 'Delete'];

const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const lbl  = 'whitespace-nowrap font-medium text-[13px]';
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
  v === 'save'   ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
  v === 'search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
                   'bg-[#546e7a] hover:bg-[#455a64]'
}`;

export default function BillSubmission() {
  const [date,          setDate]          = useState(getToday());
  const [party,         setParty]         = useState('');
  const [senderName,    setSenderName]    = useState('');
  const [courierDocNo,  setCourierDocNo]  = useState('');
  const [remark,        setRemark]        = useState('');
  const [enterBillNo,   setEnterBillNo]   = useState('');
  const [bills,         setBills]         = useState([]);
  const [tableSearch,   setTableSearch]   = useState('');

  const multiUploadRef   = useRef(null);
  const submitDocRef     = useRef(null);

  const handleRefresh = () => {
    setDate(getToday()); setParty(''); setSenderName('');
    setCourierDocNo(''); setRemark(''); setEnterBillNo(''); setBills([]);
    if (multiUploadRef.current)  multiUploadRef.current.value  = '';
    if (submitDocRef.current)    submitDocRef.current.value    = '';
  };

  const count       = bills.length;
  const totalAmount = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#cfd6de' }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <div className="flex-1" />
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Bill Submission
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')} className={topBtn('save')}>{SaveIcon} Save</button>
          <button onClick={() => toast('Search')}        className={topBtn('search')}>{SearchIcon} Search</button>
          <button onClick={handleRefresh}                className={topBtn('gray')}>{RefreshIcon} Refersh</button>
          <button onClick={() => toast('Printing...')}   className={topBtn('gray')}>{PrintIcon} Print</button>
        </div>
      </div>

      {/* ── Form card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">

        {/* Row 1: Submission NO | Date | Party */}
        <div className="flex items-center gap-6 mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* Submission NO</label>
            <input value="1" readOnly
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-32 text-[13px] cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Date</label>
            <input value={date} onChange={e => setDate(e.target.value)}
              className={`${inpR} w-32`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Party</label>
            <input value={party} onChange={e => setParty(e.target.value)}
              className={`${inpR} w-48`} />
          </div>
        </div>

        {/* Row 2: Sender Name | Courier Doc No | Remark */}
        <div className="flex items-center gap-6 mb-3">
          <div className="flex items-center gap-2">
            <label className={lblR}>* Sender Name</label>
            <input value={senderName} onChange={e => setSenderName(e.target.value)}
              className={`${inpR} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Courier Doc No</label>
            <input value={courierDocNo} onChange={e => setCourierDocNo(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Remark</label>
            <input value={remark} onChange={e => setRemark(e.target.value)}
              className={`${inp} w-40`} />
          </div>
        </div>

        {/* Row 3: Multiple Document Uploads | Enter Bill No | Select Bill */}
        <div className="flex items-center gap-6 mb-3">
          <div className="flex items-center gap-2">
            <label className={lbl}>Multiple Document Uploads</label>
            <button onClick={() => multiUploadRef.current?.click()}
              className="text-gray-700 hover:text-[#0b8fd3]">{UploadIcon}</button>
            <input ref={multiUploadRef} type="file" multiple className="hidden" />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <label className="font-bold text-[13px] whitespace-nowrap">Enter Bill No</label>
            <input value={enterBillNo} onChange={e => setEnterBillNo(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && enterBillNo.trim()) {
                  setBills(b => [...b, { no: enterBillNo.trim(), date: getToday(), type: 'With LR', party: party || '', amount: '' }]);
                  setEnterBillNo('');
                }
              }}
              className={`${inp} w-36`} />
            <button onClick={() => toast('Select Bill')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Select Bill
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-3" />

        {/* Submit Details section */}
        <div className="font-bold text-[14px] mb-3">Submit Details</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className={lbl}>Receiver Name</label>
            <input readOnly className="border border-gray-300 bg-gray-100 px-2 py-1 w-36 text-[13px] cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Submit Date</label>
            <input readOnly className="border border-gray-300 bg-gray-100 px-2 py-1 w-32 text-[13px] cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <label className={lbl}>Upload Submitted Document</label>
            <input ref={submitDocRef} type="file"
              className="text-[13px] border border-gray-300 bg-gray-50 px-1 py-0.5" />
            <button onClick={() => submitDocRef.current?.click()}
              className="text-gray-600 hover:text-[#0b8fd3]">{UploadIcon}</button>
          </div>
        </div>
      </div>

      {/* ── Count row ─────────────────────────────────────────────── */}
      <div className="px-1 mb-1">
        <span className="text-red-600 font-bold text-[13px]">
          Count: {count || ''}&nbsp;&nbsp;&nbsp;Total Bill Amount: {totalAmount || ''}
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
              {TABLE_COLS.map(col => (
                <th key={col} className="px-4 py-2 text-center font-medium border border-[#0a7ab8] whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLS.length} className="text-center py-6 text-red-500 text-[13px]">
                  No data available in table
                </td>
              </tr>
            ) : (
              bills.map((b, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-1.5 border-b border-gray-200 text-center">{b.no}</td>
                  <td className="px-4 py-1.5 border-b border-gray-200 text-center">{b.date}</td>
                  <td className="px-4 py-1.5 border-b border-gray-200 text-center">{b.type}</td>
                  <td className="px-4 py-1.5 border-b border-gray-200 text-center">{b.party}</td>
                  <td className="px-4 py-1.5 border-b border-gray-200 text-center">{b.amount}</td>
                  <td className="px-4 py-1.5 border-b border-gray-200 text-center">
                    <button onClick={() => setBills(prev => prev.filter((_, j) => j !== i))}
                      className="text-red-500 hover:text-red-700 text-[12px]">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
