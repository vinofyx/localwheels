import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const req  = 'text-red-600 text-[13px] font-medium';
const lbl  = 'text-[13px] font-medium text-gray-700';

const ENTRY_TYPES = ['CREDIT NOTE', 'DEBIT NOTE'];

// ── Bill table columns (shown below the form) ─────────────────────────────────
const BILL_COLS = [
  'Bill No', 'Bill Date', 'Bill Amt', 'CN/DR Amt', 'Adj Amt', 'Balance', 'Delete',
];

function ActionBar({ onSave }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white relative">
      <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
      <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2 tracking-wide">
        VendorCR/DRNote
      </h2>
      <div className="flex gap-1.5">
        {[
          { label: 'Save',    icon: '⬇' },
          { label: 'Search',  icon: '🔍' },
          { label: 'Refersh', icon: '↺' },
          { label: 'Print',   icon: '🖨' },
        ].map(b => (
          <button key={b.label}
            onClick={b.label === 'Save' ? onSave : () => toast(`${b.label}…`)}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white text-[12px] px-3 py-1.5 rounded">
            <span>{b.icon}</span>{b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VendorCrDrNote() {
  const [entryType,     setEntryType]     = useState('CREDIT NOTE');
  const [entryNo]                         = useState('1');           // auto
  const [date,          setDate]          = useState(today);
  const [vendor,        setVendor]        = useState('');
  const [totalAmount,   setTotalAmount]   = useState('');
  const [totalIgst,     setTotalIgst]     = useState('0.00');
  const [totalCgst,     setTotalCgst]     = useState('0.00');
  const [totalSgst,     setTotalSgst]     = useState('0.00');
  const [vendorDocNo,   setVendorDocNo]   = useState('');
  const [roundUp,       setRoundUp]       = useState('0');
  const [netAmount,     setNetAmount]     = useState('0.00');
  const [expLedgers,    setExpLedgers]    = useState('');
  const [remark,        setRemark]        = useState('');
  const [billRows,      setBillRows]      = useState([]);
  const fileRef = useRef(null);

  const calcNet = () => {
    const base = parseFloat(totalAmount) || 0;
    const igst = parseFloat(totalIgst)   || 0;
    const cgst = parseFloat(totalCgst)   || 0;
    const sgst = parseFloat(totalSgst)   || 0;
    const r    = parseFloat(roundUp)     || 0;
    setNetAmount((base + igst + cgst + sgst + r).toFixed(2));
  };

  const handleSave = () => {
    if (!vendor)      { toast.error('Vendor is required');           return; }
    if (!totalAmount) { toast.error('Total Amount is required');     return; }
    if (!vendorDocNo) { toast.error('Vendor Doc No is required');    return; }
    if (!expLedgers)  { toast.error('Expense Ledgers is required');  return; }
    if (!remark)      { toast.error('Remark is required');           return; }
    toast.success('VendorCR/DRNote saved');
  };

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <ActionBar onSave={handleSave} />

      {/* ── Header form ── */}
      <div className="border border-gray-300 rounded mx-3 mt-3 mb-3 px-4 py-3 bg-white">
        {/* Row 1: Entry Type | Entry No. | Date | Vendor */}
        <div className="grid grid-cols-4 gap-4 mb-3 items-end">
          <div>
            <span className={req}>* Entry Type</span>
            <select value={entryType} onChange={e => setEntryType(e.target.value)}
              className={`${inp} mt-0.5`}>
              {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <span className={req}>* Entry No.</span>
            <input value={entryNo} disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Date</span>
            <input value={date} onChange={e => setDate(e.target.value)}
              className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Vendor</span>
            <input value={vendor} onChange={e => setVendor(e.target.value)}
              className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 2: Total Amount | Total IGST | Total CGST | Total SGST */}
        <div className="grid grid-cols-4 gap-4 mb-3 items-end">
          <div>
            <span className={req}>* Total Amount</span>
            <input value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
              onBlur={calcNet} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Total IGST</span>
            <input value={totalIgst} onChange={e => setTotalIgst(e.target.value)}
              onBlur={calcNet} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Total CGST</span>
            <input value={totalCgst} onChange={e => setTotalCgst(e.target.value)}
              onBlur={calcNet} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Total SGST</span>
            <input value={totalSgst} onChange={e => setTotalSgst(e.target.value)}
              onBlur={calcNet} className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 3: Vendor Doc No | RoundUp | Net Amount | Select Bill */}
        <div className="grid grid-cols-4 gap-4 mb-3 items-end">
          <div>
            <span className={req}>* Vendor Doc No</span>
            <input value={vendorDocNo} onChange={e => setVendorDocNo(e.target.value)}
              className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>RoundUp(+/-)</span>
            <input value={roundUp} onChange={e => setRoundUp(e.target.value)}
              onBlur={calcNet} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Net Amount</span>
            <input value={netAmount} readOnly className={`${inpD} mt-0.5`} />
          </div>
          <div className="flex items-end">
            <button onClick={() => toast('Select Bill…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-5 py-1.5 rounded w-full">
              Select Bill
            </button>
          </div>
        </div>

        {/* Row 4: Expense Ledgers | Remark | Upload Documents */}
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-3">
            <span className={req}>* Expense Ledgers</span>
            <input value={expLedgers} onChange={e => setExpLedgers(e.target.value)}
              className={`${inp} mt-0.5`} />
          </div>
          <div className="col-span-6">
            <span className={req}>* Remark</span>
            <input value={remark} onChange={e => setRemark(e.target.value)}
              className={`${inp} mt-0.5`} />
          </div>
          <div className="col-span-3 flex items-end gap-2 pb-0.5">
            <input ref={fileRef} type="file" className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="text-[#0b8fd3] hover:underline text-[13px] font-medium whitespace-nowrap">
              Upload Documents
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="text-gray-600 hover:text-gray-800 text-lg">⬆</button>
          </div>
        </div>
      </div>

      {/* ── Bill table ── */}
      <div className="mx-3 mb-4 border border-gray-300 rounded overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {BILL_COLS.map(h => (
                <th key={h}
                  className="px-3 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {billRows.length === 0 ? (
              <tr>
                <td colSpan={BILL_COLS.length} className="text-center py-6 text-gray-400">
                  No data available in table
                </td>
              </tr>
            ) : (
              billRows.map((r, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                  <td className="px-3 py-1">{r.billNo}</td>
                  <td className="px-3 py-1">{r.billDate}</td>
                  <td className="px-3 py-1">{r.billAmt}</td>
                  <td className="px-3 py-1">{r.cnDrAmt}</td>
                  <td className="px-3 py-1">{r.adjAmt}</td>
                  <td className="px-3 py-1">{r.balance}</td>
                  <td className="px-3 py-1">
                    <button onClick={() => setBillRows(rs => rs.filter((_, j) => j !== i))}
                      className="text-red-500 hover:text-red-700 font-bold">✕</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
