import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const req  = 'text-red-600 text-[13px] font-medium';
const lbl  = 'text-[13px] font-medium text-gray-700';

const VOUCHER_TYPES = [
  '--Select--', 'Receipt', 'Payment', 'Credit Note',
  'Debit Note', 'Journal', 'Purchase', 'Sales', 'Contra',
];
const CR_DR        = ['CR', 'DR'];
const REF_TYPES    = ['New', 'Against', 'Advance', 'On Account'];

// ── Shared helpers ────────────────────────────────────────────────────────────
function ActionBar({ onSave }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white relative">
      <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
      <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2 tracking-wide">
        Voucher Entry
      </h2>
      <div className="flex gap-1.5">
        {[
          { label: 'Save',    icon: '⬇' },
          { label: 'Search',  icon: '🔍' },
          { label: 'Refersh', icon: '↺' },
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

function PlusBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center text-[16px] leading-none flex-shrink-0"
    >
      +
    </button>
  );
}

function SortTh({ children, className = '' }) {
  return (
    <th className={`px-3 py-1.5 text-left font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0 ${className}`}>
      {children} {children !== 'Delete' && <span className="text-[10px]">⇅</span>}
    </th>
  );
}

// ── Add Reference tab ─────────────────────────────────────────────────────────
function AddReferenceTab({ ledgerRows }) {
  const [ledger,    setLedger]    = useState('');
  const [refType,   setRefType]   = useState('New');
  const [refId,     setRefId]     = useState('');
  const [amount,    setAmount]    = useState('');
  const [crDr,      setCrDr]      = useState('CR');
  const [rows,      setRows]      = useState([]);

  const totalDebit  = rows.filter(r => r.crDr === 'DR').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const totalCredit = rows.filter(r => r.crDr === 'CR').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const addRow = () => {
    if (!ledger || !amount) { toast.error('Select a ledger and enter amount'); return; }
    setRows(r => [...r, { ledger, refType, refId, amount, crDr }]);
    setLedger(''); setRefId(''); setAmount('');
  };

  return (
    <div className="p-3">
      {/* Input row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select value={ledger} onChange={e => setLedger(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-44">
          <option value=""></option>
        </select>

        <select value={refType} onChange={e => setRefType(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-36">
          {REF_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>

        <input
          placeholder="Enter Reference"
          value={refId}
          onChange={e => setRefId(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none flex-1 min-w-[160px]"
        />

        <input
          placeholder="Enter Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-36"
        />

        <select value={crDr} onChange={e => setCrDr(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-16">
          {CR_DR.map(o => <option key={o}>{o}</option>)}
        </select>

        <PlusBtn onClick={addRow} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              <SortTh>Ledger Name</SortTh>
              <SortTh>Ref Type</SortTh>
              <SortTh>Reference ID</SortTh>
              <SortTh>Debit</SortTh>
              <SortTh>Credit</SortTh>
              <SortTh>Delete</SortTh>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-1">{r.ledger}</td>
                <td className="px-3 py-1">{r.refType}</td>
                <td className="px-3 py-1">{r.refId}</td>
                <td className="px-3 py-1 text-right">{r.crDr === 'DR' ? r.amount : ''}</td>
                <td className="px-3 py-1 text-right">{r.crDr === 'CR' ? r.amount : ''}</td>
                <td className="px-3 py-1 text-center">
                  <button onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 font-bold">✕</button>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
              <td colSpan={3} className="px-3 py-1.5 text-right">Total:</td>
              <td className="px-3 py-1.5 text-right">{totalDebit || 0}</td>
              <td className="px-3 py-1.5 text-right">{totalCredit || 0}</td>
              <td className="px-3 py-1 text-center">
                <button onClick={() => setRows([])}
                  className="w-5 h-5 bg-gray-800 text-white rounded flex items-center justify-center text-[11px] mx-auto hover:bg-gray-700">■</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Add Cost Center tab ───────────────────────────────────────────────────────
function AddCostCenterTab() {
  const [ledger,   setLedger]   = useState('');
  const [costCat,  setCostCat]  = useState('');
  const [customer, setCustomer] = useState('');
  const [amount,   setAmount]   = useState('');
  const [rows,     setRows]     = useState([]);

  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const addRow = () => {
    if (!ledger || !amount) { toast.error('Select a ledger and enter amount'); return; }
    setRows(r => [...r, { ledger, costCat, customer, amount }]);
    setLedger(''); setCostCat(''); setCustomer(''); setAmount('');
  };

  return (
    <div className="p-3">
      {/* Input row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select value={ledger} onChange={e => setLedger(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-44">
          <option value=""></option>
        </select>

        <select value={costCat} onChange={e => setCostCat(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-44">
          <option value=""></option>
        </select>

        <input
          placeholder="Enter Customer"
          value={customer}
          onChange={e => setCustomer(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none flex-1 min-w-[160px]"
        />

        <input
          placeholder="Enter Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-36"
        />

        <PlusBtn onClick={addRow} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {['Ledger Name', 'Cost Center Name', 'Cost Center Name', 'Amount', 'Delete'].map(h => (
                <th key={h} className="px-3 py-1.5 text-left font-medium border-r border-blue-400 last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-1">{r.ledger}</td>
                <td className="px-3 py-1">{r.costCat}</td>
                <td className="px-3 py-1">{r.customer}</td>
                <td className="px-3 py-1 text-right">{r.amount}</td>
                <td className="px-3 py-1 text-center">
                  <button onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 font-bold">✕</button>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
              <td colSpan={3} className="px-3 py-1.5 text-right">Total:</td>
              <td className="px-3 py-1.5 text-right">{total}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Vehicle tab ───────────────────────────────────────────────────────────────
function VehicleTab() {
  const [vehicleNo, setVehicleNo] = useState('');
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <span className={lbl}>Vehicle No</span>
        <input
          value={vehicleNo}
          onChange={e => setVehicleNo(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-44"
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = ['Add Reference', 'Add Cost Center', 'Vehicle'];

export default function VoucherEntry() {
  const [voucherType, setVoucherType] = useState('--Select--');
  const [voucherDate, setVoucherDate] = useState(today);
  const [trnNo,       setTrnNo]       = useState('0');
  const [trnDate,     setTrnDate]     = useState(today);
  const [remarks,     setRemarks]     = useState('');

  // Ledger Details
  const [selLedger,   setSelLedger]   = useState('');
  const [enterAmt,    setEnterAmt]    = useState('');
  const [crDr,        setCrDr]        = useState('CR');
  const [ledgerRows,  setLedgerRows]  = useState([]);

  const [activeTab, setActiveTab] = useState('Add Reference');
  const fileRef = useRef(null);

  const totalDebit  = ledgerRows.filter(r => r.crDr === 'DR').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const totalCredit = ledgerRows.filter(r => r.crDr === 'CR').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const addLedgerRow = () => {
    if (!selLedger || !enterAmt) { toast.error('Select ledger and enter amount'); return; }
    setLedgerRows(r => [...r, { ledger: selLedger, amount: enterAmt, crDr }]);
    setSelLedger(''); setEnterAmt('');
  };

  const handleSave = () => {
    if (voucherType === '--Select--') { toast.error('Voucher Type is required'); return; }
    if (!remarks)                     { toast.error('Remarks is required');      return; }
    toast.success('Voucher Entry saved');
  };

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <ActionBar onSave={handleSave} />

      {/* ── Header ── */}
      <div className="border border-gray-300 rounded mx-3 mt-3 mb-3 px-4 py-3">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-4 mb-3 items-end">
          <div>
            <span className={req}>* Voucher No</span>
            <input value="" disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Voucher Type</span>
            <select value={voucherType} onChange={e => setVoucherType(e.target.value)} className={`${inp} mt-0.5`}>
              {VOUCHER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <span className={req}>* Voucher Date</span>
            <input value={voucherDate} onChange={e => setVoucherDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-4 mb-3 items-end">
          <div>
            <span className={lbl}>TRN No</span>
            <input value={trnNo} onChange={e => setTrnNo(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>TRN Date</span>
            <input value={trnDate} onChange={e => setTrnDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Remarks</span>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 3 – Upload */}
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="text-[#0b8fd3] hover:underline text-[13px] font-medium"
          >
            Upload Documents
          </button>
          <button onClick={() => fileRef.current?.click()} className="text-gray-600 text-lg hover:text-gray-800">⬆</button>
        </div>
      </div>

      {/* ── Ledger Details ── */}
      <div className="border border-gray-300 rounded mx-3 mb-3">
        <div className="px-4 py-2 font-semibold text-[13px] border-b border-gray-200 bg-gray-50">
          Ledger Details
        </div>
        <div className="px-4 py-3">
          {/* Input row */}
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1">
              <span className={req}>*</span>
              <input
                placeholder="Select Ledger"
                value={selLedger}
                onChange={e => setSelLedger(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full mt-0.5"
              />
            </div>
            <div className="w-44">
              <span className={req}>*</span>
              <input
                placeholder="Enter Amount"
                value={enterAmt}
                onChange={e => setEnterAmt(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full mt-0.5"
              />
            </div>
            <div className="w-20">
              <span className={req}>*</span>
              <select value={crDr} onChange={e => setCrDr(e.target.value)}
                className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full mt-0.5">
                {CR_DR.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="pb-0.5">
              <PlusBtn onClick={addLedgerRow} />
            </div>
          </div>

          {/* Ledger table */}
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#0b8fd3] text-white">
                  <th className="px-3 py-1.5 text-left font-medium border-r border-blue-400">Ledger Name</th>
                  <th className="px-3 py-1.5 text-right font-medium border-r border-blue-400 w-36">Debit <span className="text-[10px]">⇅</span></th>
                  <th className="px-3 py-1.5 text-right font-medium border-r border-blue-400 w-36">Credit <span className="text-[10px]">⇅</span></th>
                  <th className="px-3 py-1.5 text-right font-medium w-20">Delete <span className="text-[10px]">⇅</span></th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-1">{r.ledger}</td>
                    <td className="px-3 py-1 text-right">{r.crDr === 'DR' ? r.amount : ''}</td>
                    <td className="px-3 py-1 text-right">{r.crDr === 'CR' ? r.amount : ''}</td>
                    <td className="px-3 py-1 text-center">
                      <button onClick={() => setLedgerRows(rs => rs.filter((_, j) => j !== i))}
                        className="text-red-500 hover:text-red-700 font-bold">✕</button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                  <td className="px-3 py-1.5 text-right">Total:</td>
                  <td className="px-3 py-1.5 text-right">{totalDebit || 0}</td>
                  <td className="px-3 py-1.5 text-right">{totalCredit || 0}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Bottom Tabs ── */}
      <div className="mx-3 mb-4">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 text-[13px] font-medium rounded-t border border-b-0 border-gray-300 mr-0.5
                ${activeTab === tab
                  ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="border border-gray-300 rounded-b rounded-tr">
          {activeTab === 'Add Reference'   && <AddReferenceTab  ledgerRows={ledgerRows} />}
          {activeTab === 'Add Cost Center' && <AddCostCenterTab />}
          {activeTab === 'Vehicle'         && <VehicleTab />}
        </div>
      </div>
    </div>
  );
}
