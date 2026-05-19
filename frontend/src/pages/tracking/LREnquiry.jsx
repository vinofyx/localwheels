import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function LREnquiry() {
  const [lrNo, setLrNo] = useState('');

  const handleSearch = () => {
    if (!lrNo.trim()) { toast.error('Enter LR No'); return; }
    toast(`Searching LR: ${lrNo}…`);
  };

  return (
    <div className="min-h-screen bg-white text-[13px]">
      {/* Title */}
      <div className="text-center py-2">
        <span className="font-bold text-[14px] underline">LR Enquiry</span>
      </div>

      {/* Filter box */}
      <div className="border border-gray-300 rounded mx-3 mt-1 mb-0 px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-gray-700 font-medium whitespace-nowrap">Enter LR No</span>
          <input
            value={lrNo}
            onChange={e => setLrNo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="border border-gray-300 px-2 py-1 text-[13px] bg-white
                       focus:outline-none w-56"
          />
          <button onClick={handleSearch}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-6 py-1.5 rounded">
            Search
          </button>
        </div>
      </div>

      {/* Dividers */}
      <div className="mx-3 border-t-4 border-black mt-2" />
      <div className="mx-3 border-t-2 border-black mt-1" />

      {/* Results */}
      <div className="mx-3 text-center text-gray-400 py-8">No data available</div>
    </div>
  );
}
