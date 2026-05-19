import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';
const lbl = 'text-[13px] font-medium text-gray-700';

const FILTER_OPTS = [
  'MR DATE', 'MR NO', 'DEPOSITED BY',
  'PAYMENT MODE', 'PARTYNAME', 'TRN NO', 'TRN DATE', 'BRANCH',
];

// ── Export icons ──────────────────────────────────────────────────────────────
function ExportIcons() {
  return (
    <div className="flex gap-1.5 flex-shrink-0">
      <button title="PDF" onClick={() => toast('Exporting PDF…')}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <rect x="2" y="1" width="20" height="22" rx="2" fill="#c53030"/>
          <text x="3.5" y="16" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">PDF</text>
          <text x="4" y="21" fontSize="5" fill="white" fontFamily="Arial">Adobe</text>
        </svg>
      </button>
      <button title="Excel" onClick={() => toast('Exporting Excel…')}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <rect x="2" y="1" width="20" height="22" rx="2" fill="#276749"/>
          <text x="5" y="15" fontSize="9" fontWeight="bold" fill="white" fontFamily="Arial">XL</text>
        </svg>
      </button>
      <button title="Word" onClick={() => toast('Exporting Word…')}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <rect x="2" y="1" width="20" height="22" rx="2" fill="#2b579a"/>
          <text x="6" y="15" fontSize="9" fontWeight="bold" fill="white" fontFamily="Arial">W</text>
        </svg>
      </button>
    </div>
  );
}

// ── MR Summary table columns ──────────────────────────────────────────────────
const COLS = [
  'MR No', 'MR Date', 'Party Name', 'Payment Mode',
  'TRN No', 'TRN Date', 'Deposited By', 'Branch',
  'Bill Amt', 'Received Amt', 'TDS', 'Net Amt',
];

export default function MRSummary() {
  const [filter,   setFilter]   = useState('MR DATE');
  const [fromVal,  setFromVal]  = useState('');
  const [toVal,    setToVal]    = useState('');
  const [rows,     setRows]     = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!fromVal) { toast.error('Enter a From value'); return; }
    setSearched(true);
    setRows([]);
    toast('Loading MR Summary…');
  };

  // placeholder for from/to label
  const isDate = ['MR DATE', 'TRN DATE'].includes(filter);
  const fromPlaceholder = isDate ? 'dd/mm/yyyy' : `From ${filter}`;
  const toPlaceholder   = isDate ? 'dd/mm/yyyy' : `To ${filter}`;

  return (
    <div className="min-h-screen bg-[#eaf0fb] text-[13px]">

      {/* ── Filter bar ── */}
      <div className="bg-[#d8e8f0] border-b-2 border-gray-400 mx-0 px-3 py-2">
        {/* Title */}
        <h2 className="text-center font-bold text-[15px] underline mb-3 tracking-wide text-gray-800">
          MR Summary
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter label + dropdown */}
          <span className={lbl}>Filter</span>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className={`${inp} w-40`}
          >
            {FILTER_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>

          {/* From value */}
          <input
            value={fromVal}
            onChange={e => setFromVal(e.target.value)}
            placeholder={fromPlaceholder}
            className={`${inp} w-32`}
          />

          {/* To value */}
          <input
            value={toVal}
            onChange={e => setToVal(e.target.value)}
            placeholder={toPlaceholder}
            className={`${inp} w-32`}
          />

          {/* Search icon button */}
          <button
            onClick={handleSearch}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="7"/>
              <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
          </button>

          {/* Export icons push to right */}
          <div className="ml-auto">
            <ExportIcons />
          </div>
        </div>
      </div>

      {/* ── Thick divider lines (matches screenshot) ── */}
      <div className="mx-3 mt-3">
        <div className="border-t-4 border-black" />
        <div className="border-t-2 border-black mt-1" />
      </div>

      {/* ── Results table ── */}
      <div className="mx-3 mt-2 mb-4">
        {searched ? (
          <div className="border border-gray-300 rounded bg-white overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#0b8fd3] text-white">
                  {COLS.map(h => (
                    <th key={h}
                      className="px-3 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length} className="text-center py-8 text-gray-400">
                      No data available
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                      {COLS.map((c, j) => <td key={j} className="px-3 py-1">{r[c] ?? ''}</td>)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Before search — show empty area with divider lines as in screenshot */
          <div className="bg-white border border-gray-300 rounded min-h-[120px]" />
        )}
      </div>
    </div>
  );
}
