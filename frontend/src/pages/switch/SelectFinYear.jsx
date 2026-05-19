import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Generate financial years
const genFY = () => {
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: 5 }, (_, i) => {
    const y = fy + 1 - i;
    return `${y}-${y + 1}`;
  });
};
const FY_YEARS = genFY();

export default function SelectFinYear() {
  const [selected, setSelected] = useState('');
  const navigate  = useNavigate();

  const handleNext = () => {
    if (!selected) { toast.error('Please select a financial year'); return; }
    toast.success(`Financial Year set to ${selected}`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c8dff0] to-[#e8f4fb]
                    flex items-center justify-center">
      <div className="w-[340px] rounded-xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-[#1a5276] px-6 py-4 text-center">
          <span className="text-white font-bold text-[16px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>
            Select Fin. Year
          </span>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-8 flex flex-col gap-6">
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-[13px] bg-white
                       focus:outline-none focus:border-[#0b8fd3] rounded w-full">
            <option value="">--Select--</option>
            {FY_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button
            onClick={handleNext}
            className="w-full py-2.5 rounded-full text-white font-semibold text-[14px]
                       bg-gradient-to-r from-[#0b8fd3] to-[#29b6f6]
                       hover:from-[#0a7ab8] hover:to-[#0b8fd3] transition-all shadow-md">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
