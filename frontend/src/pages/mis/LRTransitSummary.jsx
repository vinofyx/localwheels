import React, { useState } from 'react';

function ExportIcons() {
  return (
    <div className="flex items-center gap-1 ml-auto">
      <button title="Export PDF" className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#e53e3e" />
          <text x="4.5" y="15" fontSize="7" fontWeight="bold" fill="white" fontFamily="Arial">PDF</text>
        </svg>
      </button>
      <button title="Export Excel" className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#38a169" />
          <text x="5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">XL</text>
        </svg>
      </button>
      <button title="Export Word" className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <rect x="3" y="2" width="18" height="20" rx="2" fill="#3182ce" />
          <text x="5.5" y="15" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">W</text>
        </svg>
      </button>
    </div>
  );
}

export default function LRTransitSummary() {
  const [filterBy,       setFilterBy]       = useState('LR DATE');
  const [search,         setSearch]         = useState('');
  const [bookingBranch,  setBookingBranch]  = useState('');
  const [deliveryBranch, setDeliveryBranch] = useState('');
  const [transitStatus,  setTransitStatus]  = useState('--ALL--');

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <div className="text-center py-2 border-b border-gray-300">
        <h2 className="font-bold text-[14px] underline text-[#0b5ea8]">LR Transit (Summary)</h2>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-[#f4f4f4] border-b border-gray-400 flex-wrap">
        <span className="font-semibold text-[13px]">Filter</span>
        <select
          value={filterBy}
          onChange={e => setFilterBy(e.target.value)}
          className="border border-gray-400 px-1.5 py-0.5 text-[13px] bg-white w-36 focus:outline-none"
        >
          <option>LR DATE</option>
          <option>DOCKET NO</option>
          <option>BOOKING BRANCH</option>
          <option>DELIVERY BRANCH</option>
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-400 px-1.5 py-0.5 text-[13px] w-32 focus:outline-none"
        />
        <button className="flex items-center justify-center w-7 h-7 hover:bg-gray-200 rounded">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <span className="font-semibold text-[13px]">Booking Branch</span>
        <input
          value={bookingBranch}
          onChange={e => setBookingBranch(e.target.value)}
          className="border border-gray-400 px-1.5 py-0.5 text-[13px] w-32 focus:outline-none"
        />
        <span className="font-semibold text-[13px]">Delivery Branch</span>
        <input
          value={deliveryBranch}
          onChange={e => setDeliveryBranch(e.target.value)}
          className="border border-gray-400 px-1.5 py-0.5 text-[13px] w-32 focus:outline-none"
        />
        <span className="font-semibold text-[13px]">Status</span>
        <select
          value={transitStatus}
          onChange={e => setTransitStatus(e.target.value)}
          className="border border-gray-400 px-1.5 py-0.5 text-[13px] bg-white w-36 focus:outline-none"
        >
          <option>--ALL--</option>
          <option>In Transit</option>
          <option>Delivered</option>
          <option>Pending</option>
          <option>Undelivered</option>
        </select>
        <ExportIcons />
      </div>

      <div className="border-t-2 border-black" />
      <div className="border-t-2 border-black mt-3" />
      <div className="px-3 py-4 text-center text-gray-400 text-[12px]">
        No records found.
      </div>
    </div>
  );
}
