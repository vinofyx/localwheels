import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp  = 'border border-gray-300 px-1.5 py-1 text-[13px] focus:outline-none focus:border-blue-400 w-full bg-white';
const sel  = 'border border-gray-300 px-1.5 py-1 text-[13px] focus:outline-none bg-white w-full';
const lbl  = 'text-[13px] whitespace-nowrap font-medium';

const defaultTo = '11/05/2026';

export default function VendorOutstanding() {
  const [viewBy,       setViewBy]       = useState('TripWise');
  const [dateMode,     setDateMode]     = useState('UpTo Date');
  const [fromDate,     setFromDate]     = useState('01/04/2010');
  const [toDate,       setToDate]       = useState(defaultTo);
  const [paymentUpto,  setPaymentUpto]  = useState('');
  const [display,      setDisplay]      = useState('Outstanding Memo');
  const [branch,       setBranch]       = useState('');
  const [vendor,       setVendor]       = useState('');
  const [vehicle,      setVehicle]      = useState('');
  const [aging,        setAging]        = useState('Bill Date');

  const fromDisabled = dateMode === 'UpTo Date';

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <div className="text-center py-2 border-b border-gray-300">
        <h2 className="font-bold text-[14px] underline text-[#0b5ea8]">Vendor Outstanding</h2>
      </div>

      <div className="m-3 border border-gray-300 rounded bg-[#f9f9f9] px-4 py-3">
        {/* Row 1 */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <select value={viewBy} onChange={e => setViewBy(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32">
            <option>TripWise</option>
            <option>VendorWise</option>
            <option>VehicleWise</option>
          </select>
          <select value={dateMode} onChange={e => setDateMode(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-36">
            <option>UpTo Date</option>
            <option>Between Dates</option>
          </select>
          <div className="flex items-center gap-2">
            <span className={lbl}>From Date</span>
            <input
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              disabled={fromDisabled}
              className={`border border-gray-300 px-1.5 py-1 text-[13px] focus:outline-none w-32 ${fromDisabled ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={lbl}>To Date</span>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32" />
          </div>
          <div className="flex items-center gap-2">
            <span className={lbl}>Payment Upto Date</span>
            <input value={paymentUpto} onChange={e => setPaymentUpto(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={lbl}>Display</span>
            <select value={display} onChange={e => setDisplay(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-40">
              <option>Outstanding Memo</option>
              <option>All Memo</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className={lbl}>Branch</span>
            <input value={branch} onChange={e => setBranch(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32" />
          </div>
          <div className="flex items-center gap-2">
            <span className={lbl}>Vendor</span>
            <input value={vendor} onChange={e => setVendor(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32" />
          </div>
          <div className="flex items-center gap-2">
            <span className={lbl}>Vehicle</span>
            <input value={vehicle} onChange={e => setVehicle(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32" />
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={lbl}>Aging</span>
            <select value={aging} onChange={e => setAging(e.target.value)} className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-36">
              <option>Bill Date</option>
              <option>Due Date</option>
              <option>Today</option>
            </select>
          </div>
          <button
            onClick={() => toast('Showing…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded"
          >
            Show
          </button>
        </div>
      </div>

      <div className="mx-3 bg-white border border-gray-200 rounded min-h-[40px]" />
    </div>
  );
}
