import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const req  = 'text-red-600 text-[13px] font-medium';
const lbl  = 'text-[13px] font-medium';

// ── Dropdown options ─────────────────────────────────────────────────────────
const ENTRY_TYPES = ['LR', 'MEMO(MANIFEST)', 'LCM', 'LDM', 'UNLOADING(VAR)', 'BILLWITHLR'];

const EXPENSE_HEADS = [
  '--Select--',
  '2ND ATTEMPT CHARGES',
  'APPOINTMENT DELIVERY CHARGES',
  'DRIVER FOODING EXPENSE CHARGES',
  'DRIVER UNLOADING CHARGES',
  'DRIVER-LOADING CHARGES',
  'HELPER FOODING EXPENSE CHARGES',
  'HELPER UNLOADING CHARGES',
  'LOADING CHARGES BY HAMALI',
  'OTHER EXPENSE CHARGES',
  'RE-ATTEMPT CHARGES',
  'THAI BAZAR CHARGES',
  'TOLL EXPENSE CHARGES',
  'TRIP UNLOADING CHARGES',
  'UNLOADING CHARGES BY HAMALI',
  'VECHILE BREAKDOWN EXPENSES',
];

const RECOVERABLE_TYPES = ['NON RECOVERABLE', 'RECOVERABLE'];
const PACKAGE_TYPES     = ['--Select--', 'BAG', 'BOX', 'C/B And Bags', 'CARTON BOX', 'LOOSE', 'PAPER BOARD'];
const VEHICLE_TYPES     = ['--Select--', 'FULL LOAD', 'PART LOAD', 'FCL', 'LCL'];
const UNITS             = ['--Select--', 'KG', 'MT', 'PCS', 'BOX', 'BAG'];
const CASH_BANK_OPT     = ['CASH', 'BANK'];
const PAYMENT_BY_OPT    = ['--Select--', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'DD'];

// ── LR table columns ─────────────────────────────────────────────────────────
const LR_TABLE_COLS = [
  'LR No', 'LR Date', 'Consignor', 'Consignee', 'From', 'To',
  'Act. Wt', 'Chg. Wt', 'Qty', 'Pkg Type', 'Expense Amt', 'Delete',
];

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

function SectionBox({ children, className = '' }) {
  return (
    <div className={`border border-gray-300 rounded mx-3 mb-3 ${className}`}>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

export default function LRExpenses() {
  // Header
  const [expenseNo,       setExpenseNo]       = useState('1');
  const [expenseDate,     setExpenseDate]      = useState(today);
  const [expenseHead,     setExpenseHead]      = useState('--Select--');
  const [recoverableType, setRecoverableType]  = useState('NON RECOVERABLE');
  const [entryType,       setEntryType]        = useState('LR');
  const [vendor,          setVendor]           = useState('');
  const [remark,          setRemark]           = useState('');

  // Rate row
  const [unit,            setUnit]             = useState('--Select--');
  const [packageType,     setPackageType]      = useState('--Select--');
  const [vehicleType,     setVehicleType]      = useState('--Select--');
  const [rate,            setRate]             = useState('');
  const [totalAmount,     setTotalAmount]      = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('LR Expense');

  // LR rows (populated via Select LR)
  const [lrRows, setLrRows] = useState([]);

  // Bulk Import
  const [bulkFile,    setBulkFile]    = useState(null);
  const [bulkData,    setBulkData]    = useState([]);
  const fileRef = useRef(null);

  // Payment Details
  const [payEnabled,  setPayEnabled]  = useState(true);
  const [payDate,     setPayDate]     = useState('');
  const [cashBank,    setCashBank]    = useState('CASH');
  const [paymentBy,   setPaymentBy]   = useState('--Select--');
  const [trnNo,       setTrnNo]       = useState('');
  const [trnDate,     setTrnDate]     = useState('');

  const isCash = cashBank === 'CASH';

  // Totals summary
  const totalLR  = lrRows.length;
  const totalQty = lrRows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
  const totalAct = lrRows.reduce((s, r) => s + (parseFloat(r.actWt) || 0), 0);
  const totalChg = lrRows.reduce((s, r) => s + (parseFloat(r.chgWt) || 0), 0);

  const handleCalculate = () => {
    const r = parseFloat(rate) || 0;
    const q = totalQty || 1;
    setTotalAmount(String((r * q).toFixed(2)));
  };

  const handleSave = () => {
    if (expenseHead === '--Select--') { toast.error('Expense Head is required'); return; }
    if (!rate)                        { toast.error('Rate is required');          return; }
    toast.success('LR Expense saved');
  };

  const selectLRLabel =
    entryType === 'LR'             ? 'Select LR'   :
    entryType === 'MEMO(MANIFEST)' ? 'Select Memo' :
    entryType === 'LCM'            ? 'Select LCM'  :
    entryType === 'LDM'            ? 'Select LDM'  :
    entryType === 'UNLOADING(VAR)' ? 'Select VAR'  :
                                     'Select Bill' ;

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <ActionBar title="LR Expences" onSave={handleSave} />

      {/* ── Header Row 1 ── */}
      <SectionBox>
        <div className="grid grid-cols-12 gap-3 mb-3 items-end">
          {/* Expense No */}
          <div className="col-span-2">
            <span className={req}>* Expence No</span>
            <input value={expenseNo} disabled className={`${inpD} mt-0.5`} />
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

          {/* Expense Head */}
          <div className="col-span-4">
            <span className={req}>* Expence Head</span>
            <select
              value={expenseHead}
              onChange={e => setExpenseHead(e.target.value)}
              className={`${inp} mt-0.5`}
            >
              {EXPENSE_HEADS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>

          {/* Recoverable Type */}
          <div className="col-span-2">
            <span className={lbl}>Recoverable Type</span>
            <select
              value={recoverableType}
              onChange={e => setRecoverableType(e.target.value)}
              className={`${inp} mt-0.5`}
            >
              {RECOVERABLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Header Row 2 */}
        <div className="grid grid-cols-12 gap-3 items-end">
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

          {/* Select LR / Memo / etc. button */}
          <div className="col-span-2 flex items-end">
            <button
              onClick={() => toast(`${selectLRLabel}…`)}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded whitespace-nowrap w-full"
            >
              {selectLRLabel}
            </button>
          </div>

          {/* Vendor */}
          <div className="col-span-3">
            <span className={lbl}>Vendor</span>
            <input
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>

          {/* Remark */}
          <div className="col-span-5">
            <span className={lbl}>Remark</span>
            <input
              value={remark}
              onChange={e => setRemark(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>
        </div>
      </SectionBox>

      {/* ── Rate Row ── */}
      <SectionBox>
        <div className="grid grid-cols-12 gap-3 items-end">
          {/* Unit */}
          <div className="col-span-2">
            <span className={req}>* Unit</span>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className={`${inp} mt-0.5`}
            >
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          {/* Package Type */}
          <div className="col-span-2">
            <span className={lbl}>Package Type</span>
            <select
              value={packageType}
              onChange={e => setPackageType(e.target.value)}
              className={`${inp} mt-0.5`}
            >
              {PACKAGE_TYPES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Vehicle Type */}
          <div className="col-span-2">
            <span className={lbl}>Vehicle Type</span>
            <select
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              className={`${inp} mt-0.5`}
            >
              {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          {/* Rate */}
          <div className="col-span-2">
            <span className={req}>* Rate</span>
            <input
              value={rate}
              onChange={e => setRate(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>

          {/* Total */}
          <div className="col-span-2">
            <span className={req}>* Total</span>
            <input
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              className={`${inp} mt-0.5`}
            />
          </div>

          {/* Calculate button */}
          <div className="col-span-2 flex items-end">
            <button
              onClick={handleCalculate}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded w-full"
            >
              Calculate
            </button>
          </div>
        </div>
      </SectionBox>

      {/* ── Tabs: LR Expense | Bulk Import ── */}
      <div className="mx-3 mb-3">
        {/* Tab headers */}
        <div className="flex gap-0 mb-0">
          {['LR Expense', 'Bulk Import'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 text-[13px] font-medium rounded-t border border-b-0 border-gray-300
                ${activeTab === tab
                  ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab panel */}
        <div className="border border-gray-300 rounded-b rounded-tr">

          {/* ── LR Expense Tab ── */}
          {activeTab === 'LR Expense' && (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-4 gap-0 border-b border-gray-200 text-[12px] font-semibold bg-gray-50">
                <div className="px-4 py-2 border-r border-gray-200">
                  Total LR: <span className="text-[#0b8fd3]">{totalLR}</span>
                </div>
                <div className="px-4 py-2 border-r border-gray-200">
                  Total Quantity: <span className="text-[#0b8fd3]">{totalQty}</span>
                </div>
                <div className="px-4 py-2 border-r border-gray-200">
                  Total Acutal Weight: <span className="text-[#0b8fd3]">{totalAct}</span>
                </div>
                <div className="px-4 py-2">
                  Total Charged Weight: <span className="text-[#0b8fd3]">{totalChg}</span>
                </div>
              </div>

              {/* LR table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[900px]">
                  <thead>
                    <tr className="bg-[#0b8fd3] text-white">
                      {LR_TABLE_COLS.map(h => (
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
                    {lrRows.length === 0 ? (
                      <tr>
                        <td colSpan={LR_TABLE_COLS.length} className="text-center py-5 text-gray-400">
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      lrRows.map((r, i) => (
                        <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                          <td className="px-3 py-1">{r.lrNo}</td>
                          <td className="px-3 py-1">{r.lrDate}</td>
                          <td className="px-3 py-1">{r.consignor}</td>
                          <td className="px-3 py-1">{r.consignee}</td>
                          <td className="px-3 py-1">{r.from}</td>
                          <td className="px-3 py-1">{r.to}</td>
                          <td className="px-3 py-1">{r.actWt}</td>
                          <td className="px-3 py-1">{r.chgWt}</td>
                          <td className="px-3 py-1">{r.qty}</td>
                          <td className="px-3 py-1">{r.pkgType}</td>
                          <td className="px-3 py-1">{r.expAmt}</td>
                          <td className="px-3 py-1">
                            <button
                              onClick={() => setLrRows(rows => rows.filter((_, j) => j !== i))}
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
            </>
          )}

          {/* ── Bulk Import Tab ── */}
          {activeTab === 'Bulk Import' && (
            <div className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Download sample */}
                <button
                  onClick={() => toast('Downloading sample template…')}
                  className="text-[#0b8fd3] hover:underline text-[13px]"
                >
                  Download Sample Excel Template
                </button>

                {/* File chooser */}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => setBulkFile(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="border border-gray-400 bg-gray-100 hover:bg-gray-200 text-[13px] px-3 py-1 rounded"
                >
                  Choose File
                </button>
                <span className="text-gray-500 text-[12px]">
                  {bulkFile ? bulkFile.name : 'No file chosen'}
                </span>

                {/* Show Data */}
                <button
                  onClick={() => {
                    if (!bulkFile) { toast.error('Please choose a file first'); return; }
                    toast('Loading data…');
                  }}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded"
                >
                  Show Data
                </button>

                {/* Refresh */}
                <button
                  onClick={() => { setBulkFile(null); setBulkData([]); if (fileRef.current) fileRef.current.value = ''; toast('Refreshed'); }}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-[13px] px-4 py-1.5 rounded"
                >
                  Refresh
                </button>
              </div>

              {/* Bulk data preview table */}
              {bulkData.length > 0 && (
                <div className="mt-3 overflow-x-auto border border-gray-300 rounded">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-[#0b8fd3] text-white">
                        {Object.keys(bulkData[0]).map(k => (
                          <th key={k} className="px-3 py-1.5 font-medium border-r border-blue-400 last:border-r-0">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.map((row, i) => (
                        <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-3 py-1 text-center">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Details ── */}
      <div className="mx-3 mb-4 border border-gray-300 rounded">
        <div className="px-3 py-3">
          <div className="grid grid-cols-12 gap-3 items-center">
            {/* Enable toggle */}
            <div className="col-span-1 flex items-center gap-1.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payEnabled}
                  onChange={e => setPayEnabled(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                <span className="font-semibold text-[13px] underline cursor-pointer">Payment Details</span>
              </label>
            </div>

            {/* Payment Date */}
            <div className="col-span-2">
              <span className={lbl}>Payment Date</span>
              <input
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                disabled={!payEnabled}
                className={`${payEnabled ? inp : inpD} mt-0.5`}
              />
            </div>

            {/* Cash/Bank */}
            <div className="col-span-2">
              <span className={lbl}>Cash/Bank</span>
              <select
                value={cashBank}
                onChange={e => { setCashBank(e.target.value); setTrnNo(''); setTrnDate(''); }}
                disabled={!payEnabled}
                className={`${payEnabled ? inp : inpD} mt-0.5`}
              >
                {CASH_BANK_OPT.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Payment By */}
            <div className="col-span-2">
              <span className={lbl}>Payment By</span>
              <select
                value={paymentBy}
                onChange={e => setPaymentBy(e.target.value)}
                disabled={!payEnabled || isCash}
                className={`${payEnabled && !isCash ? inp : inpD} mt-0.5`}
              >
                {PAYMENT_BY_OPT.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* TRN No/Type */}
            <div className="col-span-2">
              <span className={lbl}>TRN No/Type</span>
              <input
                value={trnNo}
                onChange={e => setTrnNo(e.target.value)}
                disabled={!payEnabled || isCash}
                className={`${payEnabled && !isCash ? inp : inpD} mt-0.5`}
              />
            </div>

            {/* TRN Date */}
            <div className="col-span-2">
              <span className={lbl}>TRN Date</span>
              <input
                value={trnDate}
                onChange={e => setTrnDate(e.target.value)}
                disabled={!payEnabled || isCash}
                className={`${payEnabled && !isCash ? inp : inpD} mt-0.5`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
