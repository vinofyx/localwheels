import React, { useState } from 'react';
import toast from 'react-hot-toast';

const FILTER_OPTS = ['VCHNO', 'VCHDATE', 'BRANCH', 'ENTRYTYPE'];

export default function VoucherMismatch() {
  const [filter, setFilter] = useState('VCHNO');
  const [value,  setValue]  = useState('');

  function handleSearch() {
    if (!value.trim()) { toast.error('Enter a search value'); return; }
    toast(`Searching ${filter}: "${value}"`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-[13px]">

      {/* ── Underlined title ───────────────────────────── */}
      <div className="flex items-center justify-center py-3">
        <h1 className="font-bold text-[15px] underline underline-offset-2">
          Voucher Mismatch
        </h1>
      </div>

      {/* ── Filter bar ─────────────────────────────────── */}
      <div className="bg-[#f3f3f3] border border-gray-300 px-4 py-2 flex items-center gap-3">

        <span className="font-medium text-gray-700">Filter</span>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 bg-white px-2 py-1
                     focus:outline-none text-[13px] w-40">
          {FILTER_OPTS.map(o => <option key={o}>{o}</option>)}
        </select>

        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="border border-gray-300 px-2 py-1 w-32 focus:outline-none bg-white"
        />

        {/* Magnify / search icon */}
        <button onClick={handleSearch} title="Search" className="hover:opacity-70 transition-opacity">
          <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        {/* Export icons — right-aligned */}
        <div className="ml-auto flex items-center gap-1">
          <button title="Export PDF"
            className="w-8 h-7 flex items-center justify-center rounded-sm border border-red-600
                       bg-white hover:bg-red-50 transition-colors">
            <span className="text-[10px] font-bold text-red-600 leading-none">PDF</span>
          </button>
          <button title="Export Excel"
            className="w-8 h-7 flex items-center justify-center rounded-sm border border-green-600
                       bg-white hover:bg-green-50 transition-colors">
            <span className="text-[10px] font-bold text-green-600 leading-none">XLS</span>
          </button>
          <button title="Export Word"
            className="w-8 h-7 flex items-center justify-center rounded-sm border border-blue-700
                       bg-white hover:bg-blue-50 transition-colors">
            <span className="text-[10px] font-bold text-blue-700 leading-none">DOC</span>
          </button>
        </div>
      </div>

      {/* ── Thick dividers ─────────────────────────────── */}
      <div className="border-t-4 border-black mt-px" />
      <div className="border-t-2 border-black mt-0.5" />

      {/* ── Result area ────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center pt-10 text-gray-400">
        Enter a filter value and click Search.
      </div>

    </div>
  );
}
