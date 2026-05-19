import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const inpSm= 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';
const inpDSm='border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none';
const req  = 'text-red-600 text-[13px] font-medium';
const lbl  = 'text-[13px] font-medium text-gray-700';

const BILL_TYPES = [
  'TRANSPORTER BILL',
  'FREIGHT BILL',
  'SERVICE BILL',
  'LABOUR BILL',
  'MISCELLANEOUS BILL',
];

const UNIT_OPTS        = ['KG', 'MT', 'PCS', 'BOX', 'BAG'];
const TRIP_TYPE_OPTS   = ['TRIP', 'MEMO', 'LR'];
const LDM_TYPE_OPTS    = ['LDM', 'DRS', 'LCM'];
const CHARGED_WT_OPTS  = ['CHARGED WEIGHT', 'ACTUAL WEIGHT'];

// ── Shared action bar ─────────────────────────────────────────────────────────
function ActionBar({ onSave }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white relative">
      <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
      <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2 tracking-wide">
        Vendor/SupplierBill
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

// ── Excel export icon ─────────────────────────────────────────────────────────
function ExcelIcon() {
  return (
    <button title="Export to Excel" onClick={() => toast('Exporting…')}
      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 flex-shrink-0">
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <rect x="3" y="2" width="18" height="20" rx="2" fill="#38a169"/>
        <text x="5.5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">XL</text>
      </svg>
    </button>
  );
}

// ── All Details tab ───────────────────────────────────────────────────────────
function AllDetailsTab() {
  const [expLedger,  setExpLedger]  = useState('');
  const [amount,     setAmount]     = useState('0');
  const [gstCharge,  setGstCharge]  = useState('0');
  const [igstLedger, setIgstLedger] = useState('');
  const [igstPct,    setIgstPct]    = useState('0');
  const [igstAmt,    setIgstAmt]    = useState('0');
  const [sgstLedger, setSgstLedger] = useState('');
  const [sgstPct,    setSgstPct]    = useState('0');
  const [sgstAmt,    setSgstAmt]    = useState('0');
  const [cgstLedger, setCgstLedger] = useState('');
  const [cgstPct,    setCgstPct]    = useState('0');
  const [cgstAmt,    setCgstAmt]    = useState('0');

  // Auto-calc GST amounts when % or base amount changes
  const calcGst = (base, pct, setter) => {
    const b = parseFloat(base) || 0;
    const p = parseFloat(pct)  || 0;
    setter(String(((b * p) / 100).toFixed(2)));
  };

  return (
    <div className="p-4">
      {/* ── Expense Details ── */}
      <p className="text-red-600 font-semibold text-[13px] mb-2">Expense Details</p>
      <div className="grid grid-cols-3 gap-3 mb-1">
        <div>
          <span className={req}>* Expense Ledger</span>
          <input value={expLedger} onChange={e => setExpLedger(e.target.value)} className={`${inp} mt-0.5`} />
        </div>
        <div>
          <span className={req}>* Amount</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} className={`${inp} mt-0.5`} />
        </div>
        <div>
          <span className={lbl}>GST Charge Amount</span>
          <input value={gstCharge} readOnly className={`${inpD} mt-0.5`} />
        </div>
      </div>

      <hr className="my-3 border-gray-200" />

      {/* ── GST Details ── */}
      <p className="text-red-600 font-semibold text-[13px] mb-2">GST Details</p>

      {/* IGST row */}
      <div className="grid grid-cols-4 gap-3 mb-2 items-end">
        <div>
          <span className={lbl}>IGST Ledgers</span>
          <input value={igstLedger} onChange={e => setIgstLedger(e.target.value)} className={`${inp} mt-0.5`} />
        </div>
        <div>
          <span className={lbl}>IGST %</span>
          <input
            value={igstPct}
            onChange={e => { setIgstPct(e.target.value); calcGst(amount, e.target.value, setIgstAmt); }}
            className={`${inp} mt-0.5`}
          />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          <div>
            <span className={lbl}>Amount</span>
            <input value={igstAmt} readOnly className={`${inpD} mt-0.5`} />
          </div>
        </div>
      </div>

      {/* SGST row */}
      <div className="grid grid-cols-4 gap-3 mb-2 items-end">
        <div>
          <span className={lbl}>SGST Ledgers</span>
          <input value={sgstLedger} onChange={e => setSgstLedger(e.target.value)} className={`${inp} mt-0.5`} />
        </div>
        <div>
          <span className={lbl}>SGST %</span>
          <input
            value={sgstPct}
            onChange={e => { setSgstPct(e.target.value); calcGst(amount, e.target.value, setSgstAmt); }}
            className={`${inp} mt-0.5`}
          />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          <div>
            <span className={lbl}>Amount</span>
            <input value={sgstAmt} readOnly className={`${inpD} mt-0.5`} />
          </div>
        </div>
      </div>

      {/* CGST row */}
      <div className="grid grid-cols-4 gap-3 mb-4 items-end">
        <div>
          <span className={lbl}>CGST Ledgers</span>
          <input value={cgstLedger} onChange={e => setCgstLedger(e.target.value)} className={`${inp} mt-0.5`} />
        </div>
        <div>
          <span className={lbl}>CGST %</span>
          <input
            value={cgstPct}
            onChange={e => { setCgstPct(e.target.value); calcGst(amount, e.target.value, setCgstAmt); }}
            className={`${inp} mt-0.5`}
          />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          <div>
            <span className={lbl}>Amount</span>
            <input value={cgstAmt} readOnly className={`${inpD} mt-0.5`} />
          </div>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => toast('Row added')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-6 py-1.5 rounded"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Add Trip tab ──────────────────────────────────────────────────────────────
function AddTripTab() {
  const [unit,       setUnit]       = useState('KG');
  const [tripType,   setTripType]   = useState('TRIP');
  const [totalWt,    setTotalWt]    = useState('0');
  const [totalQty,   setTotalQty]   = useState('0');
  const [billFreight,setBillFreight]= useState('0');
  const [extraChrgs, setExtraChrgs] = useState('0');
  const [totalAdv,   setTotalAdv]   = useState('0');
  const [totalBal,   setTotalBal]   = useState('0');
  const [rows,       setRows]       = useState([]);

  const TRIP_COLS = [
    'Trip No', 'Trip Date', 'Memo No', 'Vehicle No', 'From', 'To',
    'Freight', 'Extra Charges', 'Advance', 'Balance', 'Delete',
  ];

  return (
    <div className="p-3">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-[12px]">
        <span className="font-semibold text-red-600">Total Count :</span>
        <span className="font-medium text-gray-600">{rows.length}</span>

        <span className={lbl}>Freight Amt:</span>

        <div className="flex items-center gap-1">
          <span className={lbl}>Total Wt:</span>
          <input value={totalWt} readOnly className={`${inpDSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Total Qty:</span>
          <input value={totalQty} readOnly className={`${inpDSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Bill Freight:</span>
          <input value={billFreight} onChange={e => setBillFreight(e.target.value)} className={`${inpSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Extra Chrges:</span>
          <input value={extraChrgs} onChange={e => setExtraChrgs(e.target.value)} className={`${inpSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Total Adv:</span>
          <input value={totalAdv} readOnly className={`${inpDSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Total Bal:</span>
          <input value={totalBal} readOnly className={`${inpDSm} w-20`} />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={lbl}>Unit</span>
          <select value={unit} onChange={e => setUnit(e.target.value)} className={`${inpSm} w-24`}>
            {UNIT_OPTS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>

        <button
          onClick={() => toast('Calculating contract…')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded whitespace-nowrap"
        >
          Cal Contract
        </button>

        <select value={tripType} onChange={e => setTripType(e.target.value)} className={`${inpSm} w-28`}>
          {TRIP_TYPE_OPTS.map(t => <option key={t}>{t}</option>)}
        </select>

        <button
          onClick={() => toast('Select Trip…')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded whitespace-nowrap"
        >
          Select Trip
        </button>

        <button
          onClick={() => toast('Add Expenses…')}
          className="flex items-center gap-1 text-[13px] font-medium text-gray-700 hover:text-[#0b8fd3]"
        >
          Add Expenses
          <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[14px] leading-none">+</span>
        </button>

        <div className="ml-auto">
          <ExcelIcon />
        </div>
      </div>

      {/* Trip table */}
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="w-full border-collapse text-[12px] min-w-[900px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {TRIP_COLS.map(h => (
                <th key={h} className="px-3 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={TRIP_COLS.length} className="text-center py-6 text-gray-400">
                  No data available in table
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                  {TRIP_COLS.map((c, j) => (
                    c === 'Delete'
                      ? <td key={j} className="px-3 py-1">
                          <button onClick={() => setRows(rs => rs.filter((_, k) => k !== i))}
                            className="text-red-500 hover:text-red-700 font-bold">✕</button>
                        </td>
                      : <td key={j} className="px-3 py-1">{r[c] ?? ''}</td>
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

// ── Franchises Bill Details tab ───────────────────────────────────────────────
function FranchisesBillTab() {
  const [chargedWt,   setChargedWt]   = useState('CHARGED WEIGHT');
  const [ldmType,     setLdmType]     = useState('LDM');
  const [dispQty,     setDispQty]     = useState('0');
  const [dispWt,      setDispWt]      = useState('0');
  const [billFreight, setBillFreight] = useState('0');
  const [otherChrgs,  setOtherChrgs]  = useState('0');
  const [totalBillAmt,setTotalBillAmt]= useState('0');
  const [rows, setRows] = useState([]);

  const FR_COLS = [
    'LDM No', 'LDM Date', 'Vehicle No', 'From', 'To',
    'Disp Qty', 'Disp Wt', 'Bill Freight', 'Other Charges', 'Total Amt', 'Delete',
  ];

  return (
    <div className="p-3">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-[12px]">
        <span className="font-semibold text-red-600">Total Count :</span>
        <span className="font-medium text-gray-600">{rows.length}</span>

        <div className="flex items-center gap-1">
          <span className={lbl}>Total Disp Qty:</span>
          <input value={dispQty} readOnly className={`${inpDSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Total Disp Wt:</span>
          <input value={dispWt} readOnly className={`${inpDSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Bill Freight:</span>
          <input value={billFreight} onChange={e => setBillFreight(e.target.value)} className={`${inpSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Other Charges:</span>
          <input value={otherChrgs} onChange={e => setOtherChrgs(e.target.value)} className={`${inpSm} w-20`} />
        </div>
        <div className="flex items-center gap-1">
          <span className={lbl}>Total Bill Amt:</span>
          <input value={totalBillAmt} readOnly className={`${inpDSm} w-24`} />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <select value={chargedWt} onChange={e => setChargedWt(e.target.value)} className={`${inpSm} w-40`}>
          {CHARGED_WT_OPTS.map(o => <option key={o}>{o}</option>)}
        </select>

        <button
          onClick={() => toast('Calculating contract…')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded whitespace-nowrap"
        >
          Cal Contract
        </button>

        <select value={ldmType} onChange={e => setLdmType(e.target.value)} className={`${inpSm} w-24`}>
          {LDM_TYPE_OPTS.map(t => <option key={t}>{t}</option>)}
        </select>

        <button
          onClick={() => toast(`Select ${ldmType}…`)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[13px] px-4 py-1.5 rounded whitespace-nowrap"
        >
          Select {ldmType}
        </button>

        <button
          onClick={() => toast('Add Expenses…')}
          className="flex items-center gap-1 text-[13px] font-medium text-gray-700 hover:text-[#0b8fd3]"
        >
          Add Expenses
          <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[14px] leading-none">+</span>
        </button>

        <div className="ml-auto">
          <ExcelIcon />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="w-full border-collapse text-[12px] min-w-[900px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {FR_COLS.map(h => (
                <th key={h} className="px-3 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={FR_COLS.length} className="text-center py-6 text-gray-400">
                  No data available in table
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                  {FR_COLS.map((c, j) => (
                    c === 'Delete'
                      ? <td key={j} className="px-3 py-1">
                          <button onClick={() => setRows(rs => rs.filter((_, k) => k !== i))}
                            className="text-red-500 hover:text-red-700 font-bold">✕</button>
                        </td>
                      : <td key={j} className="px-3 py-1">{r[c] ?? ''}</td>
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

// ── Diesel Trip tab ───────────────────────────────────────────────────────────
function DieselTripTab() {
  const [rows, setRows] = useState([]);

  const DIESEL_COLS = [
    'Trip No', 'Trip Date', 'Vehicle No', 'Driver', 'From', 'To',
    'Diesel Qty', 'Rate', 'Amount', 'Delete',
  ];

  return (
    <div className="p-3">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        <span className="font-semibold text-red-600 text-[13px]">Total Count :</span>
        <span className="text-[13px] font-medium text-gray-700">{rows.length}</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => toast('Add row…')}
            className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-[16px] leading-none hover:bg-gray-700"
          >
            +
          </button>
          <button
            onClick={() => toast('Select Trip…')}
            className="border border-gray-400 bg-white hover:bg-gray-50 text-[13px] px-4 py-1 rounded"
          >
            Select Trip
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="w-full border-collapse text-[12px] min-w-[800px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {DIESEL_COLS.map(h => (
                <th key={h} className="px-3 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={DIESEL_COLS.length} className="text-center py-8 text-gray-400">
                  No data available in table
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                  {DIESEL_COLS.map((c, j) => (
                    c === 'Delete'
                      ? <td key={j} className="px-3 py-1">
                          <button onClick={() => setRows(rs => rs.filter((_, k) => k !== i))}
                            className="text-red-500 hover:text-red-700 font-bold">✕</button>
                        </td>
                      : <td key={j} className="px-3 py-1">{r[c] ?? ''}</td>
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

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = ['All Details', 'Add Trip', 'Franchises Bill Details', 'Diesel Trip'];

export default function VendorSupplierBill() {
  // Header state
  const [billDate,        setBillDate]        = useState(today);
  const [vendor,          setVendor]          = useState('');
  const [vendorGstNo,     setVendorGstNo]     = useState('');
  const [vendorBillNo,    setVendorBillNo]    = useState('');
  const [vendorBillDate,  setVendorBillDate]  = useState('');
  const [vendorSubmitDate,setVendorSubmitDate]= useState('');
  const [vehicleLink,     setVehicleLink]     = useState(false);
  const [invoiceFile,     setInvoiceFile]     = useState(null);
  const [billType,        setBillType]        = useState('TRANSPORTER BILL');
  const [reverseCharges,  setReverseCharges]  = useState(false);
  const [remark,          setRemark]          = useState('');
  const [activeTab,       setActiveTab]       = useState('All Details');
  const fileRef = useRef(null);

  const handleSave = () => {
    if (!vendor)           { toast.error('Vendor is required');                return; }
    if (!vendorBillNo)     { toast.error('Vendor Bill No is required');        return; }
    if (!vendorBillDate)   { toast.error('Vendor Bill Date is required');      return; }
    if (!vendorSubmitDate) { toast.error('Vendor Bill Submit Date is required');return; }
    if (!remark)           { toast.error('Remark is required');                return; }
    toast.success('Vendor/SupplierBill saved');
  };

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <ActionBar onSave={handleSave} />

      {/* ── Header section ── */}
      <div className="border border-gray-300 rounded mx-3 mt-3 mb-3 px-4 py-3">
        {/* Row 1: Bill No | Bill Date | Vendor | Vendor GST No */}
        <div className="grid grid-cols-4 gap-4 mb-3 items-end">
          <div>
            <span className={req}>* Bill No</span>
            <input value="26" disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Bill Date</span>
            <input value={billDate} onChange={e => setBillDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Vendor</span>
            <input value={vendor} onChange={e => setVendor(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Vendor GST No</span>
            <input value={vendorGstNo} onChange={e => setVendorGstNo(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 2: Vendor Bill No | Vendor Bill Date | Vendor Bill Submit Date | Vehicle Link */}
        <div className="grid grid-cols-4 gap-4 mb-3 items-end">
          <div>
            <span className={req}>* Vendor Bill No</span>
            <input value={vendorBillNo} onChange={e => setVendorBillNo(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Vendor Bill Date</span>
            <input value={vendorBillDate} onChange={e => setVendorBillDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Vendor Bill Submit Date</span>
            <input value={vendorSubmitDate} onChange={e => setVendorSubmitDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={vehicleLink}
                onChange={e => setVehicleLink(e.target.checked)}
                className="w-3.5 h-3.5"
              />
              <span className={lbl}>Vehicle Link</span>
            </label>
          </div>
        </div>

        {/* Row 3: Upload Invoice | Bill Type | Reverse Charges | Remark */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Upload Invoice */}
          <div className="flex items-end gap-2">
            <span className={lbl}>Upload Invoice</span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="border border-gray-400 bg-gray-100 hover:bg-gray-200 text-[13px] px-3 py-1 rounded"
            >
              Choose File
            </button>
            <span className="text-gray-500 text-[12px]">
              {invoiceFile ? invoiceFile.name : 'No file chosen'}
            </span>
          </div>

          {/* Upload icon */}
          <span className="text-gray-600 text-lg pb-0.5">⬆</span>

          {/* Bill Type */}
          <div className="flex items-end gap-2">
            <span className={lbl}>Bill Type</span>
            <select value={billType} onChange={e => setBillType(e.target.value)} className={`${inp} w-48`}>
              {BILL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Reverse Charges */}
          <div className="flex items-end gap-1.5 pb-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className={lbl}>Reverse Charges(RCM)</span>
              <input
                type="checkbox"
                checked={reverseCharges}
                onChange={e => setReverseCharges(e.target.checked)}
                className="w-3.5 h-3.5"
              />
            </label>
          </div>

          {/* Remark */}
          <div className="flex-1 min-w-[180px]">
            <span className={req}>* Remark</span>
            <input value={remark} onChange={e => setRemark(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mx-3 mb-4">
        {/* Tab headers */}
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 text-[13px] font-medium rounded-t border border-b-0 border-gray-300 mr-0.5
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
          {activeTab === 'All Details'              && <AllDetailsTab />}
          {activeTab === 'Add Trip'                 && <AddTripTab />}
          {activeTab === 'Franchises Bill Details'  && <FranchisesBillTab />}
          {activeTab === 'Diesel Trip'              && <DieselTripTab />}
        </div>
      </div>
    </div>
  );
}
