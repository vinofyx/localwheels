import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DOC_TYPES = ['LHS', 'MEMO'];

const BRANCHES = [
  '--Select--',
  'HYDERABAD', 'WARANGAL', 'KARIMNAGAR', 'KHAMMAM', 'MAHBUBNAGAR',
  'NIZAMABAD', 'VIJAYAWADA', 'RAJAHMUNDRY', 'VISAKHAPATNAM', 'KURNOOL',
  'ANANTHAPUR', 'HYDERABAD-HEAD OFFICE', 'TAMILNADU', 'ADILABAD', 'NALGONDA',
  'SANGAREDDY', 'ONGOLE', 'NELLORE', 'GUNTUR', 'TIRUPATHI', 'CUDDAPAH',
  'TEST_API_BRANCH', 'TEST_API_2', 'HYDERABAD1', 'MANCHERIAL', 'VIKARABAD',
];

export default function TouchingLR() {
  const [docType, setDocType] = useState('LHS');
  const [branch,  setBranch]  = useState('');
  const [docNo,   setDocNo]   = useState('');
  const [results, setResults] = useState(null);

  const handleSearch = () => {
    if (!branch) { toast.error('Please select a Branch'); return; }
    if (!docNo.trim()) { toast.error('Please enter a Doc No'); return; }
    setResults([]);
    toast('No records found');
  };

  const handleRefresh = () => {
    setDocType('LHS');
    setBranch('');
    setDocNo('');
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-white text-[13px] relative">

      {/* ── Title ─────────────────────────────────────────────── */}
      <div className="text-center pt-2 pb-1 pr-28">
        <span className="font-bold text-[15px] underline">Touching LR</span>
      </div>

      {/* ── Buttons — stacked vertically on top-right ─────────── */}
      <div className="absolute top-2 right-3 flex flex-col gap-1">
        <button
          onClick={() => toast('Saved successfully')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium py-1.5 w-24 rounded text-center">
          Save
        </button>
        <button
          onClick={handleRefresh}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium py-1.5 w-24 rounded text-center">
          Refersh
        </button>
        <button
          onClick={() => window.print()}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium py-1.5 w-24 rounded text-center">
          Print
        </button>
      </div>

      {/* ── Search form card ──────────────────────────────────── */}
      <div className="mx-3 mb-3 border border-gray-300 rounded bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-6 flex-wrap">

          {/* Doc Type */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Doc Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[130px]">
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Branch */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Branch</label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[190px]">
              {BRANCHES.map(b => (
                <option key={b} value={b === '--Select--' ? '' : b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Doc No */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap">Doc No</label>
            <input
              value={docNo}
              onChange={e => setDocNo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-6 py-1.5 rounded">
            Search
          </button>
        </div>
      </div>

      {/* ── LR Details section ────────────────────────────────── */}
      <div className="mx-3">

        {/* Section header */}
        <div className="bg-gray-300 border border-gray-400 px-3 py-1 mb-2">
          <span className="font-bold text-[13px]">LR Details</span>
        </div>

        {/* Add Memo button */}
        <div className="mb-2">
          <button
            onClick={() => toast('Add Memo')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded">
            Add Memo
          </button>
        </div>

        {/* Stats bar */}
        <div className="border border-gray-300 rounded px-4 py-2 mb-2 flex items-center gap-3 text-[12px] flex-wrap">
          <span className="font-bold">Act Wt</span>
          <span className="text-gray-400">|</span>
          <span className="font-bold">Act Wt</span>
          <span className="text-gray-400">|</span>
          <span className="font-bold">Charge Wt</span>
          <span className="text-gray-400">|</span>
          <span className="font-bold">Charge Wt</span>
          <span className="text-gray-400">|</span>
          <span className="font-bold">Disp Qty</span>
          <span className="text-gray-400">|</span>
          <span className="font-bold">Charge Wt</span>
          <span className="text-gray-400">|</span>
          <span className="font-bold">Total LR Count</span>
          <span className="text-gray-400">|</span>
          <span className="font-bold">LR Count</span>
        </div>

        {/* Scrollable results area */}
        <div
          className="border border-gray-300 rounded overflow-auto"
          style={{ height: '300px' }}>
          {results === null ? null : results.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No records found</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
