import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-1.5 py-1 text-[13px] focus:outline-none bg-white w-full';
const lbl = 'text-[13px] whitespace-nowrap font-medium';

export default function LRProfitability() {
  const [fromDate,      setFromDate]      = useState('');
  const [toDate,        setToDate]        = useState('');
  const [party,         setParty]         = useState('');
  const [lrNo,          setLrNo]          = useState('');
  const [bookingBranch, setBookingBranch] = useState('');
  const [deliveryBranch,setDeliveryBranch]= useState('');
  const [formatType,    setFormatType]    = useState('Columnwise');
  const [showBy,        setShowBy]        = useState('Details');
  const [costOn,        setCostOn]        = useState('Weight');
  const [salesPerson,   setSalesPerson]   = useState('');

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <div className="text-center py-2 border-b border-gray-300">
        <h2 className="font-bold text-[14px] underline text-[#0b5ea8]">LR Profitability</h2>
      </div>

      <div className="m-3 border border-gray-300 rounded bg-[#f4f4f4] px-4 py-3">
        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-3 mb-3 items-end">
          <div>
            <div className="mb-0.5"><span className={lbl}>From Date</span></div>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={inp} />
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>To Date</span></div>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className={inp} />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => toast('Showing…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded"
            >
              Show
            </button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-3 mb-3 items-end">
          <div>
            <div className="mb-0.5"><span className={lbl}>Party</span></div>
            <input value={party} onChange={e => setParty(e.target.value)} className={inp} />
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>LR No</span></div>
            <input value={lrNo} onChange={e => setLrNo(e.target.value)} className={inp} />
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>Booking Branch</span></div>
            <input value={bookingBranch} onChange={e => setBookingBranch(e.target.value)} className={inp} />
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>Delivery Branch</span></div>
            <input value={deliveryBranch} onChange={e => setDeliveryBranch(e.target.value)} className={inp} />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <div className="mb-0.5"><span className={lbl}>Format Type</span></div>
            <select value={formatType} onChange={e => setFormatType(e.target.value)} className={inp}>
              <option>Columnwise</option>
              <option>Rowise</option>
            </select>
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>Show By</span></div>
            <select value={showBy} onChange={e => setShowBy(e.target.value)} className={inp}>
              <option>Details</option>
              <option>Summary</option>
            </select>
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>Cost on</span></div>
            <select value={costOn} onChange={e => setCostOn(e.target.value)} className={inp}>
              <option>Weight</option>
              <option>Quantity</option>
              <option>Amount</option>
            </select>
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>Sales Person</span></div>
            <input value={salesPerson} onChange={e => setSalesPerson(e.target.value)} className={inp} />
          </div>
        </div>
      </div>

      <div className="mx-3 bg-white border border-gray-200 rounded min-h-[40px]" />
    </div>
  );
}
