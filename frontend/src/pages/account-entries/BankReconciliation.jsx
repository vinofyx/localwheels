import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const lbl  = 'text-[13px] font-medium text-gray-700';

const MODES = ['Bank Reconciliation', 'Pass Cheque Details', 'UnPass Cheque Details'];

// ── Shared table columns per mode ─────────────────────────────────────────────
const RECO_COLS = [
  'Voucher Date', 'Voucher No', 'Voucher Type', 'Particulars',
  'Debit', 'Credit', 'Reco Date', 'Select',
];
const PASS_COLS = [
  'Voucher Date', 'Voucher No', 'Voucher Type', 'Particulars',
  'Debit', 'Credit', 'Cheque No', 'Cheque Date', 'Select',
];
const UNPASS_COLS = [
  'Voucher Date', 'Voucher No', 'Voucher Type', 'Particulars',
  'Debit', 'Credit', 'Cheque No', 'Cheque Date', 'Reco Date', 'Select',
];

function DataTable({ columns }) {
  return (
    <div className="overflow-x-auto border border-gray-300 rounded">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-[#0b8fd3] text-white">
            {columns.map(h => (
              <th
                key={h}
                className="px-3 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="text-center py-6 text-gray-400">
              No data available in table
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function BankReconciliation() {
  const [mode,       setMode]       = useState('Bank Reconciliation');
  const [bankName,   setBankName]   = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [recoDate,   setRecoDate]   = useState('');

  // Summary figures (would come from API)
  const [balBook,    setBalBook]    = useState(0);
  const [unpassPay,  setUnpassPay]  = useState(0);
  const [unpassRcpt, setUnpassRcpt] = useState(0);
  const [balStmt,    setBalStmt]    = useState(0);

  const handleShow = () => {
    if (!bankName)  { toast.error('Bank Name is required');  return; }
    if (!fromDate)  { toast.error('From Date is required');  return; }
    if (!toDate)    { toast.error('To Date is required');    return; }
    toast('Loading data…');
  };

  const handleSetRecoDate = () => {
    if (!recoDate) { toast.error('Enter a Reco Date first'); return; }
    toast.success('Reco Date set for selected vouchers');
  };

  const handleCalculateReco = () => {
    toast('Calculating reconciliation…');
  };

  const tableCols =
    mode === 'Bank Reconciliation'  ? RECO_COLS   :
    mode === 'Pass Cheque Details'  ? PASS_COLS   :
                                      UNPASS_COLS ;

  return (
    <div className="min-h-screen bg-white text-[13px]">
      {/* ── Action bar (only Refresh + Print) ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white">
        <h2 className="font-bold text-[15px] tracking-wide mx-auto">BankReconciliation</h2>
        <div className="flex gap-1.5">
          {[
            { label: 'Refresh', icon: '↺' },
            { label: 'Print',   icon: '🖨' },
          ].map(b => (
            <button
              key={b.label}
              onClick={() => toast(`${b.label}…`)}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white text-[12px] px-3 py-1.5 rounded"
            >
              <span>{b.icon}</span>{b.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter section ── */}
      <div className="border border-gray-300 rounded mx-3 mt-3 mb-3 px-4 py-3">
        {/* Mode radio buttons */}
        <div className="flex items-center gap-8 mb-4">
          {MODES.map(m => (
            <label key={m} className="flex items-center gap-1.5 cursor-pointer text-[13px]">
              <input
                type="radio"
                name="recoMode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
                className="w-3.5 h-3.5 accent-[#0b8fd3]"
              />
              <span className={mode === m ? 'text-[#0b8fd3] font-semibold' : 'text-gray-700'}>
                {m}
              </span>
            </label>
          ))}
        </div>

        {/* Filter row 1: Bank Name | From Date | To Date | Show */}
        <div className="grid grid-cols-4 gap-4 mb-3 items-end">
          <div>
            <span className={lbl}>Bank Name</span>
            <input value={bankName} onChange={e => setBankName(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>From Date</span>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>To Date</span>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleShow}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-6 py-1.5 rounded w-full"
            >
              Show
            </button>
          </div>
        </div>

        {/* Filter row 2: Reco Date | Set Reco Date | Calculate Reco | hint */}
        {mode === 'Bank Reconciliation' && (
          <div className="flex items-end gap-4 flex-wrap">
            <div className="w-56">
              <span className={lbl}>Reco Date</span>
              <input value={recoDate} onChange={e => setRecoDate(e.target.value)} className={`${inp} mt-0.5`} />
            </div>
            <button
              onClick={handleSetRecoDate}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded whitespace-nowrap"
            >
              Set Reco Date
            </button>
            <button
              onClick={handleCalculateReco}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded whitespace-nowrap"
            >
              Calculate Reco
            </button>
            <span className="text-red-600 text-[13px] font-medium">
              Set Reco Date for selected vouchers.
            </span>
          </div>
        )}
      </div>

      {/* ── Data table ── */}
      <div className="mx-3 mb-3">
        <DataTable columns={tableCols} />
      </div>

      {/* ── Summary footer ── */}
      <div className="border border-gray-300 rounded mx-3 mb-4 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-6 text-[13px]">
          <span>
            Balance As Per Bank Book :{' '}
            <span className="text-red-600 font-semibold">{balBook}</span>
          </span>
          <span>
            UnPass Payment :{' '}
            <span className="text-red-600 font-semibold">{unpassPay}</span>
          </span>
          <span>
            UnPass Receipt :{' '}
            <span className="text-red-600 font-semibold">{unpassRcpt}</span>
          </span>
          <span>
            Balance as per Bank Statement :{' '}
            <span className="text-red-600 font-semibold">{balStmt}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
