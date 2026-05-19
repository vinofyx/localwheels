import React, { useState } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const req  = 'text-red-600 text-[13px] font-medium';
const lbl  = 'text-[13px] font-medium';

function ActionBar({ title }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white relative">
      <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
      <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2">{title}</h2>
      <div className="flex gap-1.5">
        {[
          { label: 'Save',    icon: '⬇' },
          { label: 'Search',  icon: '🔍' },
          { label: 'Refersh', icon: '↺' },
          { label: 'Print',   icon: '🖨' },
        ].map(b => (
          <button key={b.label} onClick={() => toast(`${b.label}…`)}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white text-[12px] px-3 py-1.5 rounded">
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
      {title && <div className="px-3 py-1.5 font-medium text-[13px] border-b border-gray-200 bg-gray-50">{title}</div>}
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

const HVP_COLS = [
  'Branch','Memo Type','Memo No','Memo Date','Vehicle No',
  'Payable Advance','Memo Freight','Memo Extra Charges','TDS',
  'Diesel Filled','Total Paid Amount','Total Payable Amount',
  'Extra Charges','Paid Amount','Add Charges','Delete',
];

export default function HireVehiclePayment() {
  const [paymentType, setPaymentType] = useState('Balance');
  const [date,        setDate]        = useState(today);
  const [vendorBillNo,setVendorBillNo]= useState('');
  const [vendorBillDt,setVendorBillDt]= useState('');
  const [vendorName,  setVendorName]  = useState('');
  const [panNo,       setPanNo]       = useState('');
  const [sendSMS,     setSendSMS]     = useState(false);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentBy,   setPaymentBy]   = useState('');
  const [trnNo,       setTrnNo]       = useState('');
  const [bankCharges, setBankCharges] = useState('');
  const [remark,      setRemark]      = useState('');
  const [onAccount,   setOnAccount]   = useState('0');
  const [payAmount,   setPayAmount]   = useState('0');
  const [tds,         setTds]         = useState('0');

  return (
    <div className="min-h-screen bg-white text-[13px] relative">
      <ActionBar title="HireVehiclePayment" />

      <SectionBox title="">
        {/* Row 1 */}
        <div className="grid grid-cols-6 gap-3 mb-3 items-end">
          <div>
            <span className={req}>* Payment Type</span>
            <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className={`${inp} mt-0.5`}>
              <option>Balance</option>
              <option>Advance</option>
              <option>Full</option>
            </select>
          </div>
          <div>
            <span className={req}>* Pay No</span>
            <input value="1" disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Date</span>
            <input value={date} onChange={e => setDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="flex items-end">
            <button onClick={() => toast('Select Memo…')} className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded w-full">Select Memo</button>
          </div>
          <div className="flex items-end">
            <button onClick={() => toast('Select Opening Memo…')} className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-3 py-1.5 rounded w-full">Select Opening Memo</button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <span className={lbl}>Vendor BillNo</span>
            <input value={vendorBillNo} onChange={e => setVendorBillNo(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Vendor Bill Date</span>
            <input value={vendorBillDt} onChange={e => setVendorBillDt(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Vendor Name</span>
            <input value={vendorName} onChange={e => setVendorName(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>PAN NO</span>
            <input value={panNo} onChange={e => setPanNo(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex items-center gap-4 mb-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={sendSMS} onChange={e => setSendSMS(e.target.checked)} className="w-3.5 h-3.5" />
            <span className={lbl}>Send SMS-</span>
          </label>
          <span className="text-[#0b8fd3] cursor-pointer">Upload Documents</span>
          <span className="text-lg">⬆</span>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-6 gap-3 mb-3">
          <div>
            <span className={req}>* Payment Mode</span>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className={`${inp} mt-0.5`}>
              <option>CASH</option>
              <option>CHEQUE</option>
              <option>NEFT</option>
              <option>RTGS</option>
              <option>UPI</option>
            </select>
          </div>
          <div>
            <span className={req}>* Payment By</span>
            <select value={paymentBy} onChange={e => setPaymentBy(e.target.value)} className={`${inp} mt-0.5`}>
              <option value="">--Select--</option>
            </select>
          </div>
          <div>
            <span className={req}>* TRN No/Type</span>
            <input value={trnNo} disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* TRN Date</span>
            <input value={today} disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Bank Charges</span>
            <input value={bankCharges} disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Remark</span>
            <input value={remark} onChange={e => setRemark(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 5 */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <span className={lbl}>OnAccount</span>
            <input value={onAccount} onChange={e => setOnAccount(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Pay Amount</span>
            <input value={payAmount} onChange={e => setPayAmount(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>TDS</span>
            <input value={tds} onChange={e => setTds(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Net Amount</span>
            <input value="" disabled className={`${inpD} mt-0.5`} />
          </div>
        </div>
      </SectionBox>

      {/* Memo table */}
      <div className="mx-3 mb-3 overflow-x-auto border border-gray-300 rounded">
        <table className="w-full border-collapse text-[11px] min-w-[1200px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {HVP_COLS.map(h => (
                <th key={h} className="px-2 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                  {h} {h !== 'Branch' && h !== 'Delete' ? '↕' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={HVP_COLS.length} className="text-center py-3 text-gray-400 text-[12px]">No data available in table</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Previous Payment + Extra Charges */}
      <div className="grid grid-cols-2 gap-3 mx-3 mb-3">
        <SectionBox title="Previous Payment Details"><div className="min-h-[40px]" /></SectionBox>
        <SectionBox title="Extra Charges Details"><div className="min-h-[40px]" /></SectionBox>
      </div>

      <SectionBox title="LR DETAILS">
        <div className="min-h-[40px]" />
      </SectionBox>
    </div>
  );
}
