/**
 * Shared base for MR report pages that follow the same filter-bar + table pattern.
 * Usage:  <MRReportPage title="Paid Collection" filterOpts={[...]} cols={[...]} />
 */
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';
const lbl = 'text-[13px] font-medium text-gray-700';

const DATE_FILTERS = ['MR DATE', 'TRN DATE', 'LR DATE', 'BILL DATE'];

function ExportIcons() {
  return (
    <div className="flex gap-1.5 flex-shrink-0">
      {[
        { label: 'PDF',   bg: '#c53030', text: 'PDF', sub: 'Adobe' },
        { label: 'Excel', bg: '#276749', text: 'XL',  sub: null    },
        { label: 'Word',  bg: '#2b579a', text: 'W',   sub: null    },
      ].map(({ label, bg, text, sub }) => (
        <button key={label} title={label}
          onClick={() => toast(`Exporting ${label}…`)}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
          <svg viewBox="0 0 24 24" className="w-6 h-6">
            <rect x="2" y="1" width="20" height="22" rx="2" fill={bg}/>
            <text x={text === 'PDF' ? 3.5 : text === 'XL' ? 5 : 6} y="15"
              fontSize="9" fontWeight="bold" fill="white" fontFamily="Arial">{text}</text>
            {sub && <text x="4" y="21" fontSize="5" fill="white" fontFamily="Arial">{sub}</text>}
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function MRReportPage({ title, filterOpts, cols, singleInput = false }) {
  const [filter,   setFilter]   = useState(filterOpts[0]);
  const [fromVal,  setFromVal]  = useState('');
  const [toVal,    setToVal]    = useState('');
  const [rows,     setRows]     = useState([]);
  const [searched, setSearched] = useState(false);

  const isDate       = DATE_FILTERS.includes(filter);
  const fromHolder   = isDate ? 'dd/mm/yyyy' : `From ${filter}`;
  const toHolder     = isDate ? 'dd/mm/yyyy' : `To ${filter}`;

  const handleSearch = () => {
    if (!fromVal) { toast.error('Enter a search value'); return; }
    setSearched(true);
    setRows([]);
    toast(`Loading ${title}…`);
  };

  return (
    <div className="min-h-screen bg-[#eaf0fb] text-[13px]">

      {/* ── Filter bar ── */}
      <div className="bg-[#d8e8f0] border-b-2 border-gray-400 px-3 py-2">
        <h2 className="text-center font-bold text-[15px] underline mb-3 tracking-wide text-gray-800">
          {title}
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={lbl}>Filter</span>

          <select value={filter} onChange={e => setFilter(e.target.value)}
            className={`${inp} w-44`}>
            {filterOpts.map(o => <option key={o}>{o}</option>)}
          </select>

          {/* From input */}
          <input
            value={fromVal}
            onChange={e => setFromVal(e.target.value)}
            placeholder={fromHolder}
            className={`${inp} w-32`}
          />

          {/* To input — hidden for single-input pages (Bill Pending MR) */}
          {!singleInput && (
            <input
              value={toVal}
              onChange={e => setToVal(e.target.value)}
              placeholder={toHolder}
              className={`${inp} w-32`}
            />
          )}

          {/* Search icon */}
          <button onClick={handleSearch}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"
              stroke="currentColor" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="7"/>
              <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
          </button>

          <div className="ml-auto"><ExportIcons /></div>
        </div>
      </div>

      {/* ── Thick divider lines ── */}
      <div className="mx-3 mt-3">
        <div className="border-t-4 border-black" />
        <div className="border-t-2 border-black mt-1" />
      </div>

      {/* ── Results ── */}
      <div className="mx-3 mt-2 mb-4">
        {searched && cols?.length ? (
          <div className="border border-gray-300 rounded bg-white overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#0b8fd3] text-white">
                  {cols.map(h => (
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
                    <td colSpan={cols.length} className="text-center py-8 text-gray-400">
                      No data available
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                      {cols.map((c, j) => <td key={j} className="px-3 py-1">{r[c] ?? ''}</td>)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded min-h-[120px]" />
        )}
      </div>
    </div>
  );
}
