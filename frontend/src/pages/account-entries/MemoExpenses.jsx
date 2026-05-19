import React, { useState } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const req  = 'text-red-600 text-[13px] font-medium';
const lbl  = 'text-[13px] font-medium';

const EXPENSE_TYPES = ['MEMO WISE', 'LR WISE'];
const ENTRY_TYPES   = ['CASH/BANK'];
const CASH_BANK_OPT = ['CASH', 'BANK'];
const PAYMENT_BY    = ['--Select--', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'DD'];

function ActionBar({ title, onSave }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white relative">
      <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
      <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2">{title}</h2>
      <div className="flex gap-1.5">
        {[
          { label: 'Save',    icon: '⬇' },
          { label: 'Search',  icon: '🔍' },
          { label: 'Refresh', icon: '↺' },
          { label: 'Print',   icon: '🖨' },
        ].map(b => (
          <button
            key={b.label}
            onClick={b.label === 'Save' ? onSave : () => toast(`${b.label}…`)}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white text-[12px] px-3 py-1.5 rounded"
          >
            <span>{b.icon}</span>{b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionBox({ title, children }) {
  return (
    <div className="border border-gray-300 rounded mx-3 mb-3">
      {title && (
        <div className="px-3 py-1.5 font-semibold text-[13px] border-b border-gray-200 bg-gray-50">
          {title}
        </div>
      )}
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

// ── Expense table columns ────────────────────────────────────────────────────
const MEMO_COLS = [
  'Memo No', 'Memo Date', 'Vehicle No', 'From', 'To',
  'Freight', 'Extra Charges', 'Total', 'Expense Amt', 'Delete',
];
const LR_COLS = [
  'LR No', 'LR Date', 'Consignor', 'Consignee', 'From', 'To',
  'Freight', 'Extra Charges', 'Total', 'Expense Amt', 'Delete',
];

export default function MemoExpenses() {
  const [expenseType, setExpenseType] = useState('MEMO WISE');
  const [entryType,   setEntryType]   = useState('CASH/BANK');
  const [expenseNo,   setExpenseNo]   = useState('');
  const [expenseDate, setExpenseDate] = useState(today);
  const [vendor,      setVendor]      = useState('');
  const [total,       setTotal]       = useState('');
  const [narration,   setNarration]   = useState('');
  const [cashBank,    setCashBank]    = useState('CASH');
  const [paymentBy,   setPaymentBy]   = useState('--Select--');
  const [chequeNo,    setChequeNo]    = useState('');
  const [chequeDate,  setChequeDate]  = useState('');
  const [rows,        setRows]        = useState([]);

  const isCash = cashBank === 'CASH';

  const handleSave = () => {
    if (!expenseNo) { toast.error('Expense No is required'); return; }
    if (!total)     { toast.error('Total is required');      return; }
    if (!narration) { toast.error('Narration is required');  return; }
    toast.success('Memo Expense saved');
  };

  const tableColumns = expenseType === 'MEMO WISE' ? MEMO_COLS : LR_COLS;

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <ActionBar title="MEMO Expences" onSave={handleSave} />

      {/* ── Header form ── */}
      <SectionBox>
        {/* Row 1 */}
        <div className="grid grid-cols-12 gap-3 mb-3 items-end">
          {/* Expense Type */}
          <div className="col-span-2">
            <span className={req}>* Expence Type</span>
            <select
              value={expenseType}
              onChange={e => setExpenseType(e.target.value)}
              className={`${inp} mt-0.5`}
            >
              {EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

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

          {/* Expense No */}
          <div className="col-span-2">
            <span className={req}>* Expence No</span>
            <input
              value={expenseNo}
              onChange={e => setExpenseNo(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>

          {/* Expense Date */}
          <div className="col-span-2">
            <span className={req}>* Expence Date</span>
            <input
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>

          {/* Select Memo / Select LR button */}
          <div className="col-span-4 flex items-end justify-end">
            <button
              onClick={() => toast(expenseType === 'MEMO WISE' ? 'Select Memo…' : 'Select LR…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-5 py-1.5 rounded whitespace-nowrap"
            >
              {expenseType === 'MEMO WISE' ? 'Select Memo' : 'Select LR'}
            </button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className={lbl}>Vendor</span>
            <input
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>
          <div>
            <span className={req}>* Total</span>
            <input
              value={total}
              onChange={e => setTotal(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>
          <div>
            <span className={req}>* Narration</span>
            <input
              value={narration}
              onChange={e => setNarration(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>
        </div>
      </SectionBox>

      {/* ── Payment Details ── */}
      <SectionBox title="Payment Details">
        <div className="grid grid-cols-4 gap-3">
          {/* Cash/Bank */}
          <div>
            <span className={lbl}>Cash/Bank</span>
            <select
              value={cashBank}
              onChange={e => { setCashBank(e.target.value); setChequeNo(''); setChequeDate(''); }}
              className={`${inp} mt-0.5`}
            >
              {CASH_BANK_OPT.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Payment By */}
          <div>
            <span className={lbl}>Payment By</span>
            <select
              value={paymentBy}
              onChange={e => setPaymentBy(e.target.value)}
              disabled={isCash}
              className={`${isCash ? inpD : inp} mt-0.5`}
            >
              {PAYMENT_BY.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Cheque No */}
          <div>
            <span className={lbl}>Cheque No</span>
            <input
              value={chequeNo}
              onChange={e => setChequeNo(e.target.value)}
              disabled={isCash}
              className={`${isCash ? inpD : inp} mt-0.5`}
            />
          </div>

          {/* Cheque Date */}
          <div>
            <span className={lbl}>Cheque Date</span>
            <input
              value={chequeDate}
              onChange={e => setChequeDate(e.target.value)}
              disabled={isCash}
              className={`${isCash ? inpD : inp} mt-0.5`}
            />
          </div>
        </div>
      </SectionBox>

      {/* ── Expense table ── */}
      <div className="mx-3 mb-3 overflow-x-auto border border-gray-300 rounded">
        <table className="w-full border-collapse text-[12px] min-w-[900px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {tableColumns.map(h => (
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length} className="text-center py-4 text-gray-400">
                  No data available in table
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                  {tableColumns.map((c, j) => (
                    <td key={j} className="px-3 py-1">{r[c] ?? ''}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
