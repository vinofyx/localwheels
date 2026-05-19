import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-1.5 py-1 text-[13px] focus:outline-none focus:border-blue-400 w-full';
const inpR = 'border border-blue-400 px-1.5 py-1 text-[13px] focus:outline-none w-full';
const lblR = 'text-red-600 font-medium text-[13px] whitespace-nowrap';
const lbl  = 'font-medium text-[13px] whitespace-nowrap';

export default function BookingRegisterBranch() {
  const [fromDate,       setFromDate]       = useState('');
  const [toDate,         setToDate]         = useState('');
  const [billingParty,   setBillingParty]   = useState('');
  const [lrNo,           setLrNo]           = useState('');
  const [fromLocation,   setFromLocation]   = useState('');
  const [toLocation,     setToLocation]     = useState('');
  const [consignor,      setConsignor]      = useState('');
  const [consignee,      setConsignee]      = useState('');
  const [superParty,     setSuperParty]     = useState('');
  const [vehicleNo,      setVehicleNo]      = useState('');
  const [loadType,       setLoadType]       = useState('--Select--');
  const [ownerType,      setOwnerType]      = useState('All');
  const [deliveryBranch, setDeliveryBranch] = useState('');
  const [payType,        setPayType]        = useState('');
  const [formatType,     setFormatType]     = useState('Booking Register(With Charge Head)');
  const [mailParty,      setMailParty]      = useState('');
  const [emailId,        setEmailId]        = useState('');
  const [mailFormat,     setMailFormat]     = useState('Excel');

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>
      <div className="text-center mb-1">
        <h2 className="font-bold text-[15px] underline">Booking Register(Branch)</h2>
      </div>

      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <p className="text-red-600 font-medium text-[12px] mb-2">* Marked fields are compulsory</p>

        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-3 mb-2 items-end">
          <div><div className="mb-0.5"><span className={lblR}>* From Date</span></div><input value={fromDate} onChange={e => setFromDate(e.target.value)} className={inpR} /></div>
          <div><div className="mb-0.5"><span className={lblR}>* To Date</span></div><input value={toDate} onChange={e => setToDate(e.target.value)} className={inpR} /></div>
          <div><div className="mb-0.5"><span className={lbl}>Billing Party</span></div><input value={billingParty} onChange={e => setBillingParty(e.target.value)} className={inp} /></div>
          <div><div className="mb-0.5"><span className={lbl}>LR No</span></div><input value={lrNo} onChange={e => setLrNo(e.target.value)} className={inp} /></div>
          <div className="flex justify-end"><button className="border border-gray-300 rounded px-2 py-1 text-gray-500 hover:bg-gray-100">▲</button></div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-3 mb-2">
          {[['From Location', fromLocation, setFromLocation],['To Location', toLocation, setToLocation],['Consigner', consignor, setConsignor],['Consignee', consignee, setConsignee]].map(([l, v, s]) => (
            <div key={l}><div className="mb-0.5"><span className={lbl}>{l}</span></div><input value={v} onChange={e => s(e.target.value)} className={inp} /></div>
          ))}
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-4 gap-3 mb-2">
          <div><div className="mb-0.5"><span className={lbl}>Super Party</span></div><input value={superParty} onChange={e => setSuperParty(e.target.value)} className={inp} /></div>
          <div><div className="mb-0.5"><span className={lbl}>Vehicle No.</span></div><input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className={inp} /></div>
          <div><div className="mb-0.5"><span className={lbl}>Load Type</span></div>
            <select value={loadType} onChange={e => setLoadType(e.target.value)} className={inp}><option>--Select--</option></select>
          </div>
          <div><div className="mb-0.5"><span className={lbl}>Owner Type</span></div>
            <select value={ownerType} onChange={e => setOwnerType(e.target.value)} className={inp}><option>All</option><option>Own</option><option>Hired</option></select>
          </div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-5 gap-3 mb-3 items-end">
          <div><div className="mb-0.5"><span className={lbl}>Booking Branch</span></div>
            <input value="HYDERABAD-HEAD OFFIC" readOnly className="border border-gray-300 bg-gray-100 px-1.5 py-1 text-[13px] w-full text-gray-600" />
          </div>
          <div><div className="mb-0.5"><span className={lbl}>Delivery Branch</span></div><input value={deliveryBranch} onChange={e => setDeliveryBranch(e.target.value)} className={inp} /></div>
          <div><div className="mb-0.5"><span className={lbl}>Pay Type</span></div><input value={payType} onChange={e => setPayType(e.target.value)} className={inp} /></div>
          <div><div className="mb-0.5"><span className={lbl}>Format Type</span></div>
            <select value={formatType} onChange={e => setFormatType(e.target.value)} className={inp}>
              <option>Booking Register(With Charge Head)</option>
              <option>Booking Register</option>
            </select>
          </div>
          <div><button onClick={() => toast('Showing…')} className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded w-full">Show</button></div>
        </div>

        {/* Mail row */}
        <div className="border-t border-gray-200 pt-2 flex items-center gap-3 flex-wrap">
          <label className={lbl}>Mail Send Party</label>
          <input value={mailParty} onChange={e => setMailParty(e.target.value)} className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none w-48" />
          <label className={lbl}>Email ID</label>
          <input value={emailId} onChange={e => setEmailId(e.target.value)} className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none w-52" />
          <select value={mailFormat} onChange={e => setMailFormat(e.target.value)} className="border border-gray-300 px-2 py-1 text-[13px] w-20">
            <option>Excel</option><option>PDF</option>
          </select>
          <button onClick={() => toast('Sending…')} className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">SendMail</button>
          <span className="text-red-600 text-[12px] font-medium">Multiple mail ids separated by commas</span>
        </div>
      </div>
      <div className="bg-white rounded shadow-sm min-h-[40px]" />
    </div>
  );
}
