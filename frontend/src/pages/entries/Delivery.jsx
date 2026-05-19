import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const PrintIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;

const LR_TYPES = ['LR', 'MEMO/MAINFEST', 'LDM'];

export default function Delivery() {
  const [lrType,       setLrType]       = useState('LR');
  const [enterLrNo,    setEnterLrNo]    = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1" />
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Delivery
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={() => toast('Search')}
            className="flex items-center gap-1.5 bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={() => toast('Printing...')}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {PrintIcon} Print
          </button>
        </div>
      </div>

      {/* ── Row 1 card ────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="font-medium whitespace-nowrap">Ack No</label>
            <input value="2" readOnly
              className="border border-gray-300 bg-gray-100 px-2 py-1 w-28 text-[13px] cursor-not-allowed" />
          </div>
          <select value={lrType} onChange={e => setLrType(e.target.value)}
            className={`${inp} min-w-[160px]`}>
            {LR_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={() => toast('Select LR')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
            Select LR
          </button>
          <div className="flex items-center gap-2">
            <label className="font-medium whitespace-nowrap">Enter LR No</label>
            <input value={enterLrNo} onChange={e => setEnterLrNo(e.target.value)}
              className={`${inp} w-40`} />
          </div>
        </div>
      </div>

      {/* ── Row 2 card ────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-1">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="font-bold text-[13px]">LR Count-</span>
          <span className="font-bold text-[13px]">Total Topay Amount-</span>
          <div className="flex items-center gap-2">
            <label className="font-medium text-orange-500 whitespace-nowrap">Delivery Date</label>
            <input value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
              className={`${inp} w-28`} />
            <input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}
              className={`${inp} w-20`} />
          </div>
          <button onClick={() => toast('Set To All')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
            Set To All
          </button>
        </div>
      </div>

      {/* ── Empty scrollable area ────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm min-h-[40px]" />
    </div>
  );
}
