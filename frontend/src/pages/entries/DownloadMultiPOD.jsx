import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SearchIcon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;

export default function DownloadMultiPOD() {
  const [mode,        setMode]        = useState('lr');
  const [enterLr,    setEnterLr]     = useState('');
  const [selectAll,  setSelectAll]   = useState(false);
  const [foundCount, setFoundCount]  = useState('');

  const handleSearch = () => {
    if (!enterLr.trim()) { toast.error('Enter LR No'); return; }
    setFoundCount('0');
    toast('Searching…');
  };

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* ── Title ─────────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Download_Multi_Pod
        </h2>
      </div>

      {/* ── Mode card ─────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-2 mb-2 flex items-center">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="mode" value="lr"
              checked={mode === 'lr'} onChange={() => setMode('lr')}
              className="accent-[#0b8fd3]" />
            LR Wise
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="mode" value="period"
              checked={mode === 'period'} onChange={() => setMode('period')}
              className="accent-[#0b8fd3]" />
            Period Wise
          </label>
        </div>
        <div className="ml-auto">
          <span className="text-red-600 font-medium">Found LR Count :&nbsp;</span>
          <span className="font-medium">{foundCount}</span>
        </div>
      </div>

      {/* ── Search card ───────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 flex items-center gap-3">
        <label className="font-medium whitespace-nowrap text-[#8B6914]">Enter LR.</label>
        <textarea
          value={enterLr}
          onChange={e => setEnterLr(e.target.value)}
          rows={2}
          className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400 w-44 resize-none"
        />
        <button onClick={handleSearch}
          className="text-gray-700 hover:text-[#0b8fd3]">
          {SearchIcon}
        </button>
        <div className="ml-auto">
          <button onClick={() => {
            if (!foundCount && foundCount !== '0') { toast.error('Search first'); return; }
            toast.success('Downloading…');
          }} className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Download
          </button>
        </div>
      </div>

      {/* ── Select All + separator ────────────────────────────── */}
      <div className="px-1 mb-0">
        <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
          <input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} />
          Select All
        </label>
      </div>
      <div className="border-b-2 border-black mt-1" />
      <div className="border-b border-gray-400 mt-px mb-2" />

      {/* ── Empty results area ────────────────────────────────── */}
      <div className="min-h-[200px]" />
    </div>
  );
}
