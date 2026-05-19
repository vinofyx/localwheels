import React, { useState } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const inpD = 'border border-gray-200 px-2 py-1 text-[13px] bg-gray-100 focus:outline-none w-full';
const lbl  = 'text-[13px] font-medium';
const req  = 'text-red-600 text-[13px] font-medium';

function ActionBar({ title }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white">
      <div>
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
      </div>
      <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2">{title}</h2>
      <div className="flex gap-1.5">
        {[
          { label: 'Save',    icon: '⬇' },
          { label: 'Search',  icon: '🔍' },
          { label: 'Refersh', icon: '↺' },
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
  );
}

function SectionBox({ title, children }) {
  return (
    <div className="border border-gray-300 rounded mx-3 mb-3">
      {title && (
        <div className="px-3 py-1.5 font-medium text-[13px] border-b border-gray-200 bg-gray-50">{title}</div>
      )}
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

export default function BranchVoucher() {
  const [voucherDate,   setVoucherDate]   = useState(today);
  const [voucherType,   setVoucherType]   = useState('Payment');
  const [vehicleLink,   setVehicleLink]   = useState(false);
  const [mode,          setMode]          = useState('CASH');
  const [account,       setAccount]       = useState('');
  const [chequeNo,      setChequeNo]      = useState('0');
  const [amount,        setAmount]        = useState('');
  const [remark,        setRemark]        = useState('');
  const [selAccount,    setSelAccount]    = useState('');
  const [enterAmount,   setEnterAmount]   = useState('');
  const [ledgerRows,    setLedgerRows]    = useState([]);
  const [cashFromDate,  setCashFromDate]  = useState(today);
  const [cashToDate,    setCashToDate]    = useState(today);
  const [bankFromDate,  setBankFromDate]  = useState(today);
  const [bankToDate,    setBankToDate]    = useState(today);

  const cashRows = [{ date: today, no: '0', particulars: 'OPENING BALANCE', debit: 0, credit: 0, balance: 0 }];

  const addLedger = () => {
    if (!selAccount || !enterAmount) return;
    setLedgerRows(r => [...r, { name: selAccount, amount: parseFloat(enterAmount) || 0 }]);
    setSelAccount(''); setEnterAmount('');
  };

  const total = ledgerRows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-white text-[13px] relative">
      <ActionBar title="Branch Voucher" />

      {/* Main form */}
      <SectionBox title="">
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <span className={req}>* EntryNo</span>
            <input value="1" disabled className={`${inpD} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Voucher Date</span>
            <input value={voucherDate} onChange={e => setVoucherDate(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Voucher Type</span>
            <select value={voucherType} onChange={e => setVoucherType(e.target.value)} className={`${inp} mt-0.5`}>
              <option>Payment</option>
              <option>Receipt</option>
              <option>Journal</option>
              <option>Contra</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={vehicleLink} onChange={e => setVehicleLink(e.target.checked)} className="w-3.5 h-3.5" />
              <span className={lbl}>Vehicle Link</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <span className={req}>* Mode</span>
            <select value={mode} onChange={e => setMode(e.target.value)} className={`${inp} mt-0.5`}>
              <option>CASH</option>
              <option>CHEQUE</option>
              <option>NEFT</option>
              <option>RTGS</option>
              <option>UPI</option>
            </select>
          </div>
          <div>
            <span className={req}>* Account</span>
            <select value={account} onChange={e => setAccount(e.target.value)} className={`${inp} mt-0.5`}>
              <option value="">--Select--</option>
            </select>
          </div>
          <div>
            <span className={req}>* Cheque/UTR No</span>
            <input value={chequeNo} onChange={e => setChequeNo(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Cheque/UTR Date</span>
            <input value={today} disabled className={`${inpD} mt-0.5`} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <span className={req}>* Amount</span>
            <input value={amount} onChange={e => setAmount(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="col-span-3">
            <span className={req}>* Remark</span>
            <input value={remark} onChange={e => setRemark(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[13px] text-[#0b8fd3] cursor-pointer">
          <span>Upload Documents</span>
          <span className="text-lg">⬆</span>
        </div>
      </SectionBox>

      {/* Payment To */}
      <SectionBox title="Payment To">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <span className={req}>* Select Account</span>
            <input value={selAccount} onChange={e => setSelAccount(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div className="w-44">
            <span className={req}>* Enter Amount</span>
            <input value={enterAmount} onChange={e => setEnterAmount(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <button
            onClick={addLedger}
            className="mt-5 w-7 h-7 flex items-center justify-center bg-white border-2 border-gray-400 rounded-full text-gray-600 text-lg hover:bg-gray-100"
          >+</button>
        </div>

        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-1.5 text-left font-medium">Ledger Name</th>
              <th className="px-3 py-1.5 text-right font-medium">Amount ↕</th>
              <th className="px-3 py-1.5 text-center font-medium w-8">↕</th>
              <th className="px-3 py-1.5 text-right font-medium">Delete ↕</th>
            </tr>
          </thead>
          <tbody>
            {ledgerRows.map((r, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="px-3 py-1">{r.name}</td>
                <td className="px-3 py-1 text-right">{r.amount}</td>
                <td />
                <td className="px-3 py-1 text-right">
                  <button onClick={() => setLedgerRows(rows => rows.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">✕</button>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-semibold border-t border-gray-300">
              <td className="px-3 py-1">Total:</td>
              <td className="px-3 py-1 text-right">{total}</td>
              <td /><td />
            </tr>
          </tbody>
        </table>
      </SectionBox>

      {/* Cash Transferred From Branch */}
      <SectionBox title="Cash Transferred From Branch :">
        <div className="min-h-[20px]" />
      </SectionBox>

      {/* Branch Cash Statement */}
      <SectionBox title="Branch Cash Statement">
        <div className="flex items-center gap-3 mb-3">
          <span className={req}>* From Date</span>
          <input value={cashFromDate} onChange={e => setCashFromDate(e.target.value)} className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-28" />
          <span className={req}>* To Date</span>
          <input value={cashToDate} onChange={e => setCashToDate(e.target.value)} className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-28" />
          <button onClick={() => toast('Searching…')} className="bg-[#0b8fd3] text-white text-[13px] px-4 py-1 rounded">Search</button>
          <div className="flex gap-1">
            <button title="Excel" className="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-100">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><rect x="3" y="2" width="18" height="20" rx="2" fill="#38a169" /><text x="5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">XL</text></svg>
            </button>
            <button title="Word" className="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-100">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><rect x="3" y="2" width="18" height="20" rx="2" fill="#3182ce" /><text x="5.5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">W</text></svg>
            </button>
          </div>
        </div>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {['Voucher Date', 'Voucher No', 'Particulares', 'Debit', 'Credit', 'Balance'].map(h => (
                <th key={h} className="px-3 py-1.5 text-center font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cashRows.map((r, i) => (
              <tr key={i} className="border-b border-gray-200 text-center">
                <td className="px-3 py-1">{r.date}</td>
                <td className="px-3 py-1">{r.no}</td>
                <td className="px-3 py-1">{r.particulars}</td>
                <td className="px-3 py-1">{r.debit}</td>
                <td className="px-3 py-1">{r.credit}</td>
                <td className="px-3 py-1">{r.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionBox>

      {/* Branch Bank/Card Statement */}
      <SectionBox title="Branch Bank/Card Statement">
        <div className="flex items-center gap-3">
          <span className={req}>* From Date</span>
          <input value={bankFromDate} onChange={e => setBankFromDate(e.target.value)} className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-28" />
          <span className={req}>* To Date</span>
          <input value={bankToDate} onChange={e => setBankToDate(e.target.value)} className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-28" />
          <button onClick={() => toast('Searching…')} className="bg-[#0b8fd3] text-white text-[13px] px-4 py-1 rounded">Search</button>
        </div>
      </SectionBox>
    </div>
  );
}
