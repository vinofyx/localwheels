import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const lbl  = 'text-[13px] font-medium text-gray-700';

const DISPLAY_OPTS = ['Details', 'Summary', 'With Reference'];

// ── Financial years helper (current ± 2) ─────────────────────────────────────
function buildFYList() {
  const d = new Date();
  const cy = d.getFullYear();
  const base = d.getMonth() >= 3 ? cy : cy - 1;
  return Array.from({ length: 5 }, (_, i) => {
    const y = base - 2 + i;
    return `${y}-${y + 1}`;
  });
}

// ── Table columns per display mode ───────────────────────────────────────────
const DETAIL_COLS     = ['Date', 'Voucher No', 'Voucher Type', 'Particulars', 'Debit', 'Credit', 'Balance'];
const SUMMARY_COLS    = ['Month', 'Debit', 'Credit', 'Balance'];
const REFERENCE_COLS  = ['Date', 'Voucher No', 'Voucher Type', 'Particulars', 'Ref Type', 'Reference ID', 'Debit', 'Credit', 'Balance'];

export default function AccountStatement() {
  const [ledger,     setLedger]     = useState('');
  const [finYear,    setFinYear]    = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [group,      setGroup]      = useState('--ALL--');
  const [branch,     setBranch]     = useState('--ALL--');
  const [display,    setDisplay]    = useState('Details');
  const [rows,       setRows]       = useState([]);
  const [searched,   setSearched]   = useState(false);

  const fyList = buildFYList();

  const handleShow = () => {
    if (!ledger && group === '--ALL--') {
      toast.error('Enter a Ledger or select a Group');
      return;
    }
    setSearched(true);
    setRows([]);   // would be populated from API
    toast('Loading account statement…');
  };

  const cols =
    display === 'Details'        ? DETAIL_COLS    :
    display === 'Summary'        ? SUMMARY_COLS   :
                                   REFERENCE_COLS ;

  return (
    <div className="min-h-screen bg-[#eaf0fb] text-[13px]">

      {/* ── Filter section ── */}
      <div className="border border-gray-300 rounded bg-white mx-3 mt-3 mb-3 px-4 py-3">

        {/* Title */}
        <h2 className="text-center font-bold text-[15px] underline mb-4 tracking-wide">
          Account Statement
        </h2>

        {/* Row 1: Ledger | Financial Year | From Date | To Date | Show */}
        <div className="grid grid-cols-9 gap-3 mb-3 items-end">
          <div className="col-span-2">
            <span className={lbl}>Ledger</span>
            <input value={ledger} onChange={e => setLedger(e.target.value)} className={`${inp} mt-0.5`} />
          </div>

          <div className="col-span-2">
            <span className={lbl}>Financial Year</span>
            <select value={finYear} onChange={e => setFinYear(e.target.value)} className={`${inp} mt-0.5`}>
              <option value=""></option>
              {fyList.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <span className={lbl}>From Date</span>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>

          <div className="col-span-2">
            <span className={lbl}>To Date</span>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleShow}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-5 py-1.5 rounded w-full"
            >
              Show
            </button>
          </div>
        </div>

        {/* Row 2: Group | Branch | Display */}
        <div className="grid grid-cols-9 gap-3 items-end">
          <div className="col-span-2">
            <span className={lbl}>Group</span>
            <select value={group} onChange={e => setGroup(e.target.value)} className={`${inp} mt-0.5`}>
              <option>--ALL--</option>
            </select>
          </div>

          <div className="col-span-2">
            <span className={lbl}>Branch</span>
            <select value={branch} onChange={e => setBranch(e.target.value)} className={`${inp} mt-0.5`}>
              <option>--ALL--</option>
            </select>
          </div>

          <div className="col-span-2">
            <span className={lbl}>Display</span>
            <select value={display} onChange={e => setDisplay(e.target.value)} className={`${inp} mt-0.5`}>
              {DISPLAY_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Export icons */}
          <div className="col-span-3 flex items-end gap-2 pb-0.5">
            <button title="Export Excel" onClick={() => toast('Exporting to Excel…')}
              className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <rect x="3" y="2" width="18" height="20" rx="2" fill="#38a169"/>
                <text x="5.5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">XL</text>
              </svg>
            </button>
            <button title="Export PDF" onClick={() => toast('Exporting to PDF…')}
              className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <rect x="3" y="2" width="18" height="20" rx="2" fill="#e53e3e"/>
                <text x="4.5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">PDF</text>
              </svg>
            </button>
          </div>
        </div>

        {/* Dot indicator (matches screenshot) */}
        {!searched && (
          <div className="mt-2 text-gray-400 text-[11px]">·</div>
        )}
      </div>

      {/* ── Results table ── */}
      {searched && (
        <div className="mx-3 mb-4 border border-gray-300 rounded bg-white overflow-x-auto">
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
                  <td colSpan={cols.length} className="text-center py-6 text-gray-400">
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
      )}
    </div>
  );
}
