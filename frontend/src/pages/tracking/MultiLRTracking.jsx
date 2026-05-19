import React, { useState } from 'react';
import toast from 'react-hot-toast';

// ── Export icons (PDF / Excel / Word) ────────────────────────────────────────
function ExportIcons() {
  return (
    <div className="flex items-center gap-1">
      {[
        { label: 'PDF',   bg: 'bg-red-600',   text: 'PDF' },
        { label: 'Excel', bg: 'bg-green-700',  text: 'XLS' },
        { label: 'Word',  bg: 'bg-blue-700',   text: 'DOC' },
      ].map(({ label, bg, text }) => (
        <button key={label} onClick={() => toast(`Export ${label}…`)}
          className={`${bg} text-white text-[10px] font-bold px-1.5 py-1 rounded leading-none`}>
          {text}
        </button>
      ))}
    </div>
  );
}

export default function MultiLRTracking() {
  const [mode,       setMode]       = useState('lr');   // 'lr' | 'ref'
  const [searchText, setSearchText] = useState('');
  const [lrCount,    setLrCount]    = useState(0);

  const handleSearch = () => {
    const count = searchText.trim().split(/\s+/).filter(Boolean).length;
    setLrCount(count);
    if (!searchText.trim()) { toast.error('Enter at least one LR / Reference No'); return; }
    toast('Searching…');
  };

  return (
    <div className="min-h-screen bg-[#eaf0fb] text-[13px] flex flex-col">

      {/* ── Top info bar ── */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-red-700 font-semibold text-[13px]">
          Found LR Count :&nbsp;<span className="text-gray-800">{lrCount || ''}</span>
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => toast('Updating current status…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded">
            Update Current Status
          </button>
          <ExportIcons />
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="flex gap-3 px-3 pb-4 flex-1">

        {/* Left panel — search */}
        <div className="bg-white rounded shadow p-3 w-52 flex flex-col gap-2 flex-shrink-0">
          {/* Radio buttons */}
          <div className="flex items-center gap-3">
            {[
              { id: 'lr',  label: 'LR No' },
              { id: 'ref', label: 'Reference No' },
            ].map(opt => (
              <label key={opt.id} className="flex items-center gap-1 cursor-pointer">
                <input type="radio" checked={mode === opt.id}
                  onChange={() => setMode(opt.id)}
                  className="w-3.5 h-3.5 accent-[#0b8fd3]" />
                <span className="text-[13px]">{opt.label}</span>
              </label>
            ))}
          </div>

          <p className="text-[13px] font-medium text-gray-700">Enter No.</p>

          {/* Textarea + search icon */}
          <div className="relative flex-1 min-h-[200px]">
            <textarea
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Enter numbers, one per line…"
              className="border border-gray-300 w-full h-full min-h-[200px] resize-y
                         text-[12px] p-1.5 focus:outline-none focus:border-[#0b8fd3]"
            />
            <button onClick={handleSearch}
              className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-5 h-5">
                <circle cx="11" cy="11" r="7"/>
                <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Right panel — results */}
        <div className="bg-white rounded shadow flex-1 min-h-[300px] p-3 flex items-start
                        justify-center text-gray-400 text-[13px]">
          {lrCount > 0 ? '' : 'No data available'}
        </div>
      </div>
    </div>
  );
}
