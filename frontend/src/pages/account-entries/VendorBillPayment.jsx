import React, { useState } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const req  = 'text-red-600 text-[13px] font-medium';
const lbl  = 'text-[13px] font-medium text-gray-700';

const PAY_TYPES   = ['BILL WISE', 'ADVANCE', 'ON ACCOUNT'];
const PAY_MODES   = ['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'DD'];

const TABLE_COLS = [
  'View', 'Branch', 'Bill Type', 'Entry No', 'Entry Date',
  'Bill No', 'Bill Date', 'Payable Amount', 'Trip Advance',
  'Trip Diesel', 'Net Amount', 'Total Paid Amount',
  'Balance Amount', 'Paid Amount', 'Select', 'Delete',
];

function ActionBar({ onSave }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white relative">
      <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
      <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2 tracking-wide">
        VendorBill Payment
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

export default function VendorBillPayment() {
  const [payNo,          setPayNo]          = useState('');
  const [date,           setDate]           = useState(today);
  const [type,           setType]           = useState('BILL WISE');
  const [vendorName,     setVendorName]     = useState('');
  const [returnPayment,  setReturnPayment]  = useState(false);
  const [returnDate,     setReturnDate]     = useState('');
  const [headerRemark,   setHeaderRemark]   = useState('');
  const [payMode,        setPayMode]        = useState('CASH');
  const [payBy,          setPayBy]          = useState('');
  const [trnNo,          setTrnNo]          = useState('');
  const [trnDate,        setTrnDate]        = useState(today);
  const [payRemark,      setPayRemark]      = useState('');
  const [amount,         setAmount]         = useState('0');
  const [advanceAdjust,  setAdvanceAdjust]  = useState('');
  const [netPay,         setNetPay]         = useState('0');
  const [rows,           setRows]           = useState([]);

  const isCash = payMode === 'CASH';

  const calcNet = () => {
    const a = parseFloat(amount)       || 0;
    const adj = parseFloat(advanceAdjust) || 0;
    setNetPay(String((a - adj).toFixed(2)));
  };

  const handleSave = () => {
    if (!payNo)    { toast.error('Pay No is required'); return; }
    toast.success('VendorBill Payment saved');
  };

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <ActionBar onSave={handleSave} />

      {/* ── Header section ── */}
      <div className="border border-gray-300 rounded mx-3 mt-3 mb-3 px-4 py-3 bg-white">
        {/* Row 1 */}
        <div className="grid grid-cols-12 gap-3 mb-3 items-end">
          <div className="col-span-2">
            <span className={req}>*Pay No</span>
            <input value={payNo} onChange={e => setPayNo(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="col-span-2">
            <span className={req}>*Date</span>
            <input value={date} onChange={e => setDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="col-span-2">
            <span className={lbl}>Type</span>
            <select value={type} onChange={e => setType(e.target.value)} className={`${inp} mt-0.5`}>
              {PAY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-3">
            <span className={lbl}>Vendor Name</span>
            <input value={vendorName} onChange={e => setVendorName(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="col-span-3 flex items-end">
            <button onClick={() => toast('Select Bill…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-5 py-1.5 rounded w-full">
              Select Bill
            </button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-end gap-6 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={returnPayment}
              onChange={e => { setReturnPayment(e.target.checked); if (!e.target.checked) setReturnDate(''); }}
              className="w-3.5 h-3.5" />
            <span className={lbl}>Return Payment</span>
          </label>
          <div className="flex items-end gap-2">
            <span className={lbl}>Return Date</span>
            <input value={returnDate} onChange={e => setReturnDate(e.target.value)}
              disabled={!returnPayment}
              className={`${returnPayment ? inp : inpD} w-36`} />
          </div>
          <div className="flex items-end gap-2 flex-1">
            <span className={lbl}>Remark</span>
            <input value={headerRemark} onChange={e => setHeaderRemark(e.target.value)}
              className={`${inp} w-48`} />
          </div>
        </div>
      </div>

      {/* ── Payment Details section ── */}
      <div className="border border-gray-300 rounded mx-3 mb-3 px-4 py-3 bg-white">
        <p className="font-bold underline text-[13px] mb-3">Payment Details</p>

        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-3 mb-3 items-end">
          <div>
            <span className={req}>* Payment Mode</span>
            <select value={payMode}
              onChange={e => { setPayMode(e.target.value); setTrnNo(''); }}
              className={`${inp} mt-0.5`}>
              {PAY_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <span className={req}>* Payment By</span>
            <select value={payBy} onChange={e => setPayBy(e.target.value)}
              disabled={isCash}
              className={`${isCash ? inpD : inp} mt-0.5`}>
              <option value="">--Select--</option>
            </select>
          </div>
          <div>
            <span className={req}>* TRN No/Type</span>
            <input value={trnNo} onChange={e => setTrnNo(e.target.value)}
              disabled={isCash}
              className={`${isCash ? inpD : inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* TRN Date</span>
            <input value={trnDate} readOnly className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Remark</span>
            <input value={payRemark} onChange={e => setPayRemark(e.target.value)}
              className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <span className={lbl}>Amount</span>
            <input value={amount} onChange={e => setAmount(e.target.value)}
              onBlur={calcNet} className={`${inp} w-36 mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Advance Adjust</span>
            <input value={advanceAdjust} onChange={e => setAdvanceAdjust(e.target.value)}
              onBlur={calcNet} className={`${inp} w-36 mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Net Pay</span>
            <input value={netPay} readOnly className={`${inpD} w-36 mt-0.5`} />
          </div>
          <div className="flex items-end pb-0.5">
            <span className="font-semibold text-[13px]">Pending Advance:</span>
            <span className="ml-2 text-[13px] text-gray-700">0</span>
          </div>
        </div>
      </div>

      {/* ── Bill table + Entry No navigator ── */}
      <div className="mx-3 mb-4 flex gap-3">
        {/* Main table */}
        <div className="flex-1 overflow-x-auto border border-gray-300 rounded">
          <table className="w-full border-collapse text-[11px] min-w-[1200px]">
            <thead>
              <tr className="bg-[#0b8fd3] text-white">
                {TABLE_COLS.map(h => (
                  <th key={h}
                    className="px-2 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                    {h !== 'View' && h !== 'Select' && h !== 'Delete' ? (
                      <span>{h} <span className="text-[9px]">⇅</span></span>
                    ) : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_COLS.length} className="text-center py-5 text-gray-400">
                    No data available in table
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 text-center">
                    {TABLE_COLS.map((c, j) => (
                      <td key={j} className="px-2 py-1">{r[c] ?? ''}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Entry No navigator panel */}
        <div className="border border-gray-300 rounded bg-white p-2 min-w-[140px] flex flex-col">
          <div className="flex items-center gap-1 mb-2">
            <button className="w-5 h-5 rounded-full bg-[#0b8fd3] text-white flex items-center justify-center text-[14px] leading-none">+</button>
            <span className="text-[12px] font-medium text-red-600">Entry No -</span>
          </div>
          <div className="flex items-center gap-1 mt-auto justify-between">
            <button onClick={() => toast('Previous')}
              className="text-gray-500 hover:text-gray-800 text-[16px]">◀</button>
            <button onClick={() => toast('Next')}
              className="text-gray-500 hover:text-gray-800 text-[16px]">▶</button>
          </div>
        </div>
      </div>
    </div>
  );
}
