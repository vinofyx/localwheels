import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function VehCurrentStatus() {
  const [vehicleNo, setVehicleNo] = useState('');
  const [searched,  setSearched]  = useState(false);

  const handleSearch = () => {
    if (!vehicleNo.trim()) { toast.error('Enter Vehicle No'); return; }
    setSearched(true);
    toast(`Searching vehicle: ${vehicleNo}…`);
  };

  return (
    <div className="min-h-screen bg-[#dce9f5] text-[13px] flex flex-col">

      {/* Blue title strip */}
      <div className="bg-[#0b8fd3] px-4 py-2 flex-shrink-0">
        <span className="font-bold text-white text-[14px] tracking-wide"
          style={{ fontVariant: 'small-caps' }}>
          Veh.Current Status
        </span>
      </div>

      {/* Search card */}
      <div className="mx-3 mt-3 bg-white rounded-lg shadow px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-gray-700 font-medium whitespace-nowrap">Vehicle No</span>
          <input
            value={vehicleNo}
            onChange={e => setVehicleNo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-44"
          />
          <button onClick={handleSearch}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-5 py-1.5 rounded">
            Search
          </button>
        </div>
      </div>

      {/* Result placeholder rows */}
      <div className="mx-3 mt-3 flex flex-col gap-2">
        <div className="bg-gray-100 rounded-lg shadow-sm h-10" />
        <div className="bg-gray-100 rounded-lg shadow-sm h-10" />
      </div>

      {/* Empty message */}
      {!searched && (
        <div className="text-center text-gray-400 mt-8">Enter a vehicle number and click Search</div>
      )}
    </div>
  );
}
