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

const BILL_COLS = [
  'Doc No','Bill Type','Doc Date','Taxable Amount','GST','Bill Amount',
  'Pending','TDS','RoundUp(+/-)','Deduction','Deduction Reason',
  'Balance Amount','Net Amount','Add Charges','Delete',
];

const SUMMARY_FIELDS = [
  { label: 'No of Bills:',       key: 'noOfBills',      val: '' },
  { label: 'Total Amount:',      key: 'totalAmount',    val: '' },
  { label: 'Pending Amount:',    key: 'pendingAmount',  val: '' },
  { label: 'Total TDS:',         key: 'totalTds',       val: '0' },
  { label: 'Total RoundUp:',     key: 'totalRoundup',   val: '0' },
  { label: 'Total Deduction:',   key: 'totalDeduction', val: '0' },
  { label: 'Total Balance:',     key: 'totalBalance',   val: '0' },
  { label: 'Net Amount:',        key: 'netAmount',      val: '0' },
  { label: 'Balance OnAccount',  key: 'balOnAccount',   val: '' },
  { label: 'Adjust OnAccount',   key: 'adjOnAccount',   val: '0' },
  { label: 'MR TDS',             key: 'mrTds',          val: '0' },
];

export default function MoneyReceiptMR() {
  const [entryType,    setEntryType]    = useState('BILL');
  const [mrDate,       setMrDate]       = useState(today);
  const [payParty,     setPayParty]     = useState('');
  const [paymentMode,  setPaymentMode]  = useState('CASH');
  const [depositedAc,  setDepositedAc]  = useState('');
  const [trnNo,        setTrnNo]        = useState('');
  const [receivedAmt,  setReceivedAmt]  = useState('0');
  const [onAccountAmt, setOnAccountAmt] = useState('0');
  const [netAmount,    setNetAmount]    = useState('0');
  const [narration,    setNarration]    = useState('');

  return (
    <div className="min-h-screen bg-white text-[13px] relative">
      <ActionBar title="MoneyReceipt(MR)" />

      <SectionBox title="">
        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-3 mb-3 items-end">
          <div>
            <span className={req}>* Entry Type</span>
            <select value={entryType} onChange={e => setEntryType(e.target.value)} className={`${inp} mt-0.5`}>
              <option>BILL</option>
              <option>ON ACCOUNT</option>
              <option>ADVANCE</option>
            </select>
          </div>
          <div>
            <span className={req}>* MR NO</span>
            <input value="1" disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* MR Date</span>
            <input value={mrDate} onChange={e => setMrDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Payment Party</span>
            <input value={payParty} onChange={e => setPayParty(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="flex items-end">
            <button onClick={() => toast('Select Bill…')} className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1.5 rounded w-full">Select Bill</button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-3 mb-3">
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
            <span className={req}>* Deposited In A/C</span>
            <select value={depositedAc} onChange={e => setDepositedAc(e.target.value)} disabled className={`${inpD} mt-0.5`}>
              <option value=""></option>
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
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-5 gap-3 mb-3 items-end">
          <div>
            <span className={req}>* Received Amount</span>
            <input value={receivedAmt} onChange={e => setReceivedAmt(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>On Account Amount</span>
            <input value={onAccountAmt} onChange={e => setOnAccountAmt(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Net Amount</span>
            <input value={netAmount} onChange={e => setNetAmount(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Narration</span>
            <input value={narration} onChange={e => setNarration(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[#0b8fd3] cursor-pointer text-[13px]">Upload Documents</span>
            <span className="text-lg">⬆</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SUMMARY_FIELDS.map(f => (
            <div key={f.key} className="flex flex-col items-center min-w-[70px]">
              <span className="text-red-600 text-[11px] font-medium text-center leading-tight">{f.label}</span>
              <input value={f.val} readOnly
                className="border border-gray-300 px-1 py-0.5 text-[12px] text-center w-16 bg-white focus:outline-none mt-0.5" />
            </div>
          ))}
        </div>
      </SectionBox>

      {/* Main table + Balance OnAccount side panel */}
      <div className="flex gap-3 mx-3 mb-3">
        <div className="flex-1 overflow-x-auto border border-gray-300 rounded">
          <table className="w-full border-collapse text-[11px] min-w-[1100px]">
            <thead>
              <tr className="bg-[#0b8fd3] text-white">
                {BILL_COLS.map(h => (
                  <th key={h} className="px-2 py-1.5 text-center font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                    {['Doc No','Deduction Reason'].includes(h) ? h : `${h} ↕`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={BILL_COLS.length} className="text-center py-3 text-gray-400 text-[12px]">No data available in table</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Balance OnAccount panel */}
        <div className="w-64 border border-gray-300 rounded flex-shrink-0">
          <div className="bg-gray-50 px-3 py-1.5 font-medium text-[13px] border-b border-gray-200">Balance OnAccount</div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#0b8fd3] text-white">
                {['Branch','MR No','On Account Amount','Adjust On Account Amount'].map(h => (
                  <th key={h} className="px-2 py-1.5 text-center font-medium text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="text-center py-3 text-gray-400 text-[11px]">No records.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Previous Document Details + LR Details */}
      <div className="grid grid-cols-2 gap-3 mx-3 mb-3">
        <SectionBox title="Previous Document Details"><div className="min-h-[40px]" /></SectionBox>
        <SectionBox title="LR Details"><div className="min-h-[40px]" /></SectionBox>
      </div>
    </div>
  );
}
