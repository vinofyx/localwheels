import React, { useState } from 'react';
import toast from 'react-hot-toast';

const todayISO = new Date().toISOString().slice(0, 10);

export default function RouteExpenses() {
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [rows,      setRows]      = useState(null);

  const handleShow = () => {
    setRows([]);
    toast('No records found');
  };

  const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400 w-full';

  return (
    <div className="min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* ── Title ─────────────────────────────────────────────── */}
      <div className="text-center py-2">
        <span className="font-bold text-[15px] tracking-wide text-gray-900" style={{ fontVariant: 'small-caps' }}>
          Route Expenses
        </span>
      </div>

      {/* ── Filter card ───────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm mx-2 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <label className="whitespace-nowrap font-medium text-[#0b8fd3]">From Date</label>
            <input
              type="text"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className={inp} />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="whitespace-nowrap font-medium text-[#0b8fd3]">To Date</label>
            <input
              type="text"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap font-medium text-[#0b8fd3]">Vehicle No</label>
            <input
              type="text"
              value={vehicleNo}
              onChange={e => setVehicleNo(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400 w-36" />
          </div>
          <button
            onClick={handleShow}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Show
          </button>
        </div>
      </div>

      {/* ── Separator ─────────────────────────────────────────── */}
      <div className="border-b border-gray-300 mx-2 mt-1" />

      {/* ── Results area ──────────────────────────────────────── */}
      <div className="px-3 py-3">
        {rows !== null && rows.length === 0 && (
          <div className="text-center text-gray-500 py-10">No records found</div>
        )}
      </div>
    </div>
  );
}
