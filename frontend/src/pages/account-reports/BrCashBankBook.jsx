import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const lbl = 'text-[13px] font-medium text-gray-700';

// Branches loaded from API in production; seeded list matches typical multi-branch setup
const BRANCH_LIST = [
  '--ALL--',
  'ADILABAD', 'ANANTHAPUR', 'CUDDAPAH', 'GUNTUR',
  'HYDERABAD', 'HYDERABAD-HEAD OFFICE', 'HYDERABAD1',
  'KAKINADA', 'KARIMNAGAR', 'KERALA', 'KHAMMAM',
  'KURNOOL', 'MAHBUBNAGAR', 'MANCHERIAL',
  'NALGONDA', 'NELLORE', 'NIZAMABAD',
  'ONGOLE', 'RAJAHMUNDRY', 'SRIKAKULAM',
  'TIRUPATI', 'VIJAYAWADA', 'VISAKHAPATNAM', 'WARANGAL',
];

const TXN_TYPES = ['CASH TRANSACTION', 'BANK TRANSACTION', 'BOTH'];

// ── Table columns per transaction type ───────────────────────────────────────
const CASH_COLS  = ['Date', 'Voucher No', 'Voucher Type', 'Particulars', 'Debit', 'Credit', 'Balance'];
const BANK_COLS  = ['Date', 'Voucher No', 'Voucher Type', 'Cheque No', 'Cheque Date', 'Particulars', 'Debit', 'Credit', 'Balance'];
const BOTH_COLS  = ['Date', 'Voucher No', 'Voucher Type', 'Mode', 'Particulars', 'Debit', 'Credit', 'Balance'];

// ── Export icons ──────────────────────────────────────────────────────────────
function ExportIcons() {
  return (
    <div className="flex gap-1.5">
      <button title="Export PDF" onClick={() => toast('Exporting PDF…')}
        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#e53e3e"/>
          <text x="4" y="15" fontSize="7" fontWeight="bold" fill="white" fontFamily="Arial">PDF</text>
        </svg>
      </button>
      <button title="Export Excel" onClick={() => toast('Exporting Excel…')}
        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#38a169"/>
          <text x="5.5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">XL</text>
        </svg>
      </button>
      <button title="Export Word" onClick={() => toast('Exporting Word…')}
        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#3182ce"/>
          <text x="5.5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">W</text>
        </svg>
      </button>
    </div>
  );
}

export default function BrCashBankBook() {
  const [branch,   setBranch]   = useState('--ALL--');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [txnType,  setTxnType]  = useState('CASH TRANSACTION');
  const [rows,     setRows]     = useState([]);
  const [searched, setSearched] = useState(false);

  const handleShow = () => {
    if (!fromDate) { toast.error('From Date is required'); return; }
    if (!toDate)   { toast.error('To Date is required');   return; }
    setSearched(true);
    setRows([]);
    toast('Loading…');
  };

  const cols =
    txnType === 'CASH TRANSACTION' ? CASH_COLS :
    txnType === 'BANK TRANSACTION' ? BANK_COLS :
                                     BOTH_COLS ;

  return (
    <div className="min-h-screen bg-[#eaf0fb] text-[13px]">

      {/* ── Filter section ── */}
      <div className="border border-gray-300 rounded bg-white mx-3 mt-3 mb-3 px-4 py-3">

        {/* Title */}
        <h2 className="text-center font-bold text-[15px] underline mb-4 tracking-wide">
          Br.Cash/BankBook
        </h2>

        {/* Filter row */}
        <div className="grid grid-cols-9 gap-3 items-end">
          {/* Branch */}
          <div className="col-span-2">
            <span className={lbl}>Branch</span>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className={`${inp} mt-0.5`}
              size={1}
            >
              {BRANCH_LIST.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>

          {/* From Date */}
          <div className="col-span-2">
            <span className={lbl}>From Date</span>
            <input
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              placeholder="dd/mm/yyyy"
              className={`${inp} mt-0.5`}
            />
          </div>

          {/* To Date */}
          <div className="col-span-2">
            <span className={lbl}>To Date</span>
            <input
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              placeholder="dd/mm/yyyy"
              className={`${inp} mt-0.5`}
            />
          </div>

          {/* Transaction Type */}
          <div className="col-span-2">
            <select
              value={txnType}
              onChange={e => setTxnType(e.target.value)}
              className={`${inp} mt-5`}
            >
              {TXN_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Show button */}
          <div className="flex items-end">
            <button
              onClick={handleShow}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-6 py-1.5 rounded w-full mt-5"
            >
              Show
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {searched && (
        <div className="mx-3 mb-3">
          {/* Export + totals bar */}
          <div className="flex justify-end mb-2">
            <ExportIcons />
          </div>

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
        </div>
      )}
    </div>
  );
}
