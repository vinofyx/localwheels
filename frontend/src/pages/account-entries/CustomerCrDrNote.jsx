import React, { useState } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const req  = 'text-red-600 text-[13px] font-medium';
const lbl  = 'text-[13px] font-medium';

const ENTRY_TYPES = ['CREDIT NOTE', 'DEBIT NOTE', 'TDS', 'ON ACCOUNT BILL ADJUST', 'BAD DEBIT'];
const NOTE_TYPES  = ['WITH BILL', 'WITHOUT BILL'];

function ActionBar({ title, onSave, onSearch, onRefresh, onPrint }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white relative">
      <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
      <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2 capitalize">
        {title.split('/').map((p, i) => (
          <span key={i}>{i > 0 && '/'}<span className="first-letter:uppercase">{p}</span></span>
        ))}
      </h2>
      <div className="flex gap-1.5">
        {[
          { label: 'Save',   icon: '⬇', action: onSave   },
          { label: 'Search', icon: '🔍', action: onSearch },
          { label: 'Refersh',icon: '↺', action: onRefresh },
          { label: 'Print',  icon: '🖨', action: onPrint  },
        ].map(b => (
          <button
            key={b.label}
            onClick={b.action || (() => toast(`${b.label}…`))}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white text-[12px] px-3 py-1.5 rounded"
          >
            <span>{b.icon}</span>{b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionBox({ children }) {
  return (
    <div className="border border-gray-300 rounded mx-3 mb-3">
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

// ── Bill table columns (shown when noteType === 'WITH BILL') ────────────────
const BILL_COLS = [
  'Bill No', 'Bill Date', 'Bill Amt', 'CN/DR Amt',
  'TDS Amt', 'Adj Amt', 'Balance', 'Delete',
];

export default function CustomerCrDrNote() {
  const [entryType,    setEntryType]    = useState('CREDIT NOTE');
  const [manualEntry,  setManualEntry]  = useState(false);
  const [entryNo,      setEntryNo]      = useState('1');
  const [date,         setDate]         = useState(today);
  const [noteType,     setNoteType]     = useState('WITH BILL');
  const [billingParty, setBillingParty] = useState('');
  const [remark,       setRemark]       = useState('');
  const [totalAmount,  setTotalAmount]  = useState('');
  const [cgst,         setCgst]         = useState('');
  const [sgst,         setSgst]         = useState('');
  const [igst,         setIgst]         = useState('');
  const [roundUp,      setRoundUp]      = useState('0');
  const [netAmount,    setNetAmount]    = useState('0');
  const [billRows,     setBillRows]     = useState([]);

  // Recalculate net amount whenever totals change
  const calcNet = () => {
    const base  = parseFloat(totalAmount) || 0;
    const c     = parseFloat(cgst)        || 0;
    const s     = parseFloat(sgst)        || 0;
    const i     = parseFloat(igst)        || 0;
    const round = parseFloat(roundUp)     || 0;
    setNetAmount(String((base + c + s + i + round).toFixed(2)));
  };

  const handleSave = () => {
    if (!billingParty) { toast.error('BillingParty is required'); return; }
    if (!remark)       { toast.error('Remark is required');       return; }
    toast.success('CustomerCr/DrNote saved');
  };

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <ActionBar title="CustomerCr/DrNote" onSave={handleSave} />

      <SectionBox>
        {/* Row 1 */}
        <div className="grid grid-cols-12 gap-3 mb-3 items-end">
          {/* Entry Type */}
          <div className="col-span-2">
            <span className={req}>* Entry Type</span>
            <select
              value={entryType}
              onChange={e => setEntryType(e.target.value)}
              className={`${inp} mt-0.5`}
            >
              {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Manually Entry No */}
          <div className="col-span-2 flex items-end gap-2 pb-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={manualEntry}
                onChange={e => setManualEntry(e.target.checked)}
                className="w-3.5 h-3.5 mt-0.5"
              />
              <span className={req}>* Manually- Entry No.</span>
            </label>
          </div>
          <div className="col-span-1">
            <input
              value={manualEntry ? entryNo : '1'}
              disabled={!manualEntry}
              onChange={e => setEntryNo(e.target.value)}
              className={`${manualEntry ? inp : inpD} mt-0.5`}
            />
          </div>

          {/* Date */}
          <div className="col-span-2">
            <span className={req}>* Date</span>
            <input
              value={date}
              onChange={e => setDate(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>

          {/* Note Type */}
          <div className="col-span-2">
            <span className={req}>* Note Type</span>
            <select
              value={noteType}
              onChange={e => setNoteType(e.target.value)}
              className={`${inp} mt-0.5`}
            >
              {NOTE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Select Bill button — only shown for WITH BILL */}
          {noteType === 'WITH BILL' && (
            <div className="col-span-3 flex items-end justify-end">
              <button
                onClick={() => toast('Select Bill…')}
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-5 py-1.5 rounded whitespace-nowrap"
              >
                Select Bill
              </button>
            </div>
          )}
        </div>

        {/* Row 2 – BillingParty & Remark */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <span className={req}>* BillingParty</span>
            <input
              value={billingParty}
              onChange={e => setBillingParty(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>
          <div>
            <span className={req}>* Remark</span>
            <input
              value={remark}
              onChange={e => setRemark(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>
        </div>

        {/* Row 3 – Amounts */}
        <div className="grid grid-cols-6 gap-3 items-end">
          <div>
            <span className={lbl}>Total Amount</span>
            <input
              value={totalAmount}
              onChange={e => { setTotalAmount(e.target.value); }}
              onBlur={calcNet}
              className={`${inp} mt-0.5`}
            />
          </div>
          <div>
            <span className={lbl}>CGST</span>
            <input
              value={cgst}
              onChange={e => setCgst(e.target.value)}
              onBlur={calcNet}
              className={`${inp} mt-0.5`}
            />
          </div>
          <div>
            <span className={lbl}>SGST</span>
            <input
              value={sgst}
              onChange={e => setSgst(e.target.value)}
              onBlur={calcNet}
              className={`${inp} mt-0.5`}
            />
          </div>
          <div>
            <span className={lbl}>IGST</span>
            <input
              value={igst}
              onChange={e => setIgst(e.target.value)}
              onBlur={calcNet}
              className={`${inp} mt-0.5`}
            />
          </div>
          <div>
            <span className={lbl}>Round Up(+/-)</span>
            <input
              value={roundUp}
              onChange={e => setRoundUp(e.target.value)}
              onBlur={calcNet}
              className={`${inp} mt-0.5`}
            />
          </div>
          <div>
            <span className={req}>* Net Amount</span>
            <input
              value={netAmount}
              readOnly
              className={`${inpD} mt-0.5`}
            />
          </div>
        </div>
      </SectionBox>

      {/* Bill table — visible only for WITH BILL */}
      {noteType === 'WITH BILL' && (
        <div className="mx-3 mb-3 overflow-x-auto border border-gray-300 rounded">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#0b8fd3] text-white">
                {BILL_COLS.map(h => (
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
              {billRows.length === 0 ? (
                <tr>
                  <td colSpan={BILL_COLS.length} className="text-center py-4 text-gray-400">
                    No data available in table
                  </td>
                </tr>
              ) : (
                billRows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-200 text-center hover:bg-gray-50">
                    <td className="px-3 py-1">{r.billNo}</td>
                    <td className="px-3 py-1">{r.billDate}</td>
                    <td className="px-3 py-1">{r.billAmt}</td>
                    <td className="px-3 py-1">{r.cnDrAmt}</td>
                    <td className="px-3 py-1">{r.tdsAmt}</td>
                    <td className="px-3 py-1">{r.adjAmt}</td>
                    <td className="px-3 py-1">{r.balance}</td>
                    <td className="px-3 py-1">
                      <button
                        onClick={() => setBillRows(rows => rows.filter((_, j) => j !== i))}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </td>
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
