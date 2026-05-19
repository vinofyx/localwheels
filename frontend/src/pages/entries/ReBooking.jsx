import React, { useState } from 'react';
import toast from 'react-hot-toast';

const FILTER_OPTIONS = ['LR NO', 'LR DATE', 'CONSIGNOR', 'CONSIGNEE'];

const PdfIcon = (
  <div className="flex flex-col items-center justify-center w-9 h-9 bg-red-600 rounded cursor-pointer hover:bg-red-700" title="Export PDF">
    <span className="text-white text-[9px] font-bold leading-none">Adobe</span>
    <span className="text-white text-[10px] font-bold leading-none">PDF</span>
  </div>
);

const ExcelIcon = (
  <div className="flex flex-col items-center justify-center w-9 h-9 bg-green-600 rounded cursor-pointer hover:bg-green-700" title="Export Excel">
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 18l2-3.5-2-3.5H10l1.25 2.5L12.5 11H14l-2 3.5 2 3.5h-1.5L11 15.5 9.75 18H8.5z"/>
    </svg>
  </div>
);

const WordIcon = (
  <div className="flex flex-col items-center justify-center w-9 h-9 bg-blue-700 rounded cursor-pointer hover:bg-blue-800" title="Export Word">
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 11h1.5l1.25 5 1.5-5H12.75l1.5 5 1.25-5H17l-2 7h-1.5l-1.5-5-1.5 5H9L7 11z"/>
    </svg>
  </div>
);

const SearchIcon = (
  <svg viewBox="0 0 24 24" className="w-7 h-7 text-gray-700 fill-current cursor-pointer hover:text-gray-900">
    <path d="M21.71 20.29l-4.1-4.1A8 8 0 103.69 17.31a8 8 0 0011.9.3l4.1 4.1a1 1 0 001.42-1.42zM5 11a6 6 0 116 6 6 6 0 01-6-6z"/>
  </svg>
);

export default function ReBooking() {
  const [filter, setFilter]   = useState('LR NO');
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState(null);

  const handleSearch = () => {
    if (!search.trim()) { toast.error(`Please enter a ${filter} to search`); return; }
    setResults([]);
    toast('No records found');
  };

  const handleKeyDown = e => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className="min-h-screen bg-white text-[13px]">

      {/* ── Title ───────────────────────────────────────────── */}
      <div className="text-center py-2">
        <span className="font-bold text-[15px] underline">ReBooking</span>
      </div>

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black">
        {/* Left: filter */}
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-medium">Filter</label>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setSearch(''); }}
            className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500 min-w-[110px]"
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleSearch} className="ml-1">
            {SearchIcon}
          </button>
        </div>

        {/* Right: export icons */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => toast('Exporting PDF…')}>{PdfIcon}</button>
          <button onClick={() => toast('Exporting Excel…')}>{ExcelIcon}</button>
          <button onClick={() => toast('Exporting Word…')}>{WordIcon}</button>
        </div>
      </div>

      {/* ── Second separator ────────────────────────────────── */}
      <div className="border-b border-gray-400 mx-0" />

      {/* ── Results area ────────────────────────────────────── */}
      <div className="px-3 py-3">
        {results === null ? null : results.length === 0 ? (
          <div className="text-center text-gray-500 py-10 text-[13px]">No records found</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">LR No</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">LR Date</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Consignor</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Consignee</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">From</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">To</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.lrNo}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.lrDate}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.consignor}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.consignee}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.from}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.to}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
