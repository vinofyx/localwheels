import React, { useState } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;

const SENDING_BY = ['By Person', 'By Courier'];

const TABLE_COLS = [
  'Billing Branch', 'LR Branch', 'LR No', 'LR Date',
  'Booking Location', 'Delivery Location', 'Consigner',
  'Consignee', 'Delivery Date', 'Delivery Status', 'Delete',
];

const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const lbl  = 'whitespace-nowrap font-medium text-[13px]';
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';

export default function PODSendCustomer() {
  const [sendingDate,   setSendingDate]   = useState(getToday());
  const [party,         setParty]         = useState('');
  const [sendingPerson, setSendingPerson] = useState('');
  const [sendingBy,     setSendingBy]     = useState('By Person');
  const [remark,        setRemark]        = useState('');
  const [enterLrNo,     setEnterLrNo]     = useState('');
  const [lrList,        setLrList]        = useState([]);

  const handleRefresh = () => {
    setParty(''); setSendingPerson('');
    setSendingBy('By Person'); setRemark('');
    setEnterLrNo(''); setLrList([]);
  };

  const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
    v === 'save'   ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
    v === 'search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
                     'bg-[#546e7a] hover:bg-[#455a64]'
  }`;

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#cfd6de' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          PODSend(Customer)
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')}  className={topBtn('save')}>  {SaveIcon}    Save    </button>
          <button onClick={() => toast('Search')}         className={topBtn('search')}>{SearchIcon}  Search  </button>
          <button onClick={handleRefresh}                 className={topBtn('gray')}>  {RefreshIcon} Refersh </button>
          <button onClick={() => toast('Printing...')}    className={topBtn('gray')}>  {PrintIcon}   Print   </button>
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">
        <div className="min-w-max">

          {/* Row 1: POD Send No | Party | Sending Person */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <label className={lblR}>* POD Send No</label>
              <input value="1" readOnly
                className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] cursor-not-allowed" />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Party</label>
              <input value={party} onChange={e => setParty(e.target.value)}
                className={`${inpR} w-48`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Sending Person</label>
              <input value={sendingPerson} onChange={e => setSendingPerson(e.target.value)}
                className={`${inpR} w-48`} />
            </div>
          </div>

          {/* Row 2: Sending By | Remark | Enter LR No | Select LR */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className={lbl}>Sending By</label>
              <select value={sendingBy} onChange={e => setSendingBy(e.target.value)}
                className={`${inp} w-36`}>
                {SENDING_BY.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Remark</label>
              <input value={remark} onChange={e => setRemark(e.target.value)}
                className={`${inpR} w-48`} />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <label className={lbl}>Enter LR No</label>
              <input value={enterLrNo} onChange={e => setEnterLrNo(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && enterLrNo.trim()) {
                    setLrList(l => [...l, enterLrNo.trim()]);
                    setEnterLrNo('');
                  }
                }}
                className={`${inp} w-44`} />
              <button onClick={() => toast('Select LR')}
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
                Select LR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table area ────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
              {TABLE_COLS.map(col => (
                <th key={col}
                  className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                  {col}
                  {col !== 'Billing Branch' && (
                    <span className="ml-1 opacity-70 text-[10px]">⇅</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lrList.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLS.length}
                  className="text-center py-6 text-gray-500">
                  No data available in table
                </td>
              </tr>
            ) : (
              lrList.map((lr, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200" colSpan={TABLE_COLS.length}>{lr}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
