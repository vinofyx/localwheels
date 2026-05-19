import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DOC_TYPES = ['MEMO', 'ML Memo', 'LCM', 'LDM', 'EMPTYTRIP', 'LHS'];

export default function MemoEnquiry() {
  const [docType, setDocType] = useState('MEMO');
  const [memoNo,  setMemoNo]  = useState('');

  const handleSearch = () => {
    if (!memoNo.trim()) { toast.error('Enter Memo No'); return; }
    toast(`Searching ${docType}: ${memoNo}…`);
  };

  return (
    <div className="min-h-screen bg-white text-[13px]">
      {/* Blue title strip */}
      <div className="bg-[#0b8fd3] px-4 py-2">
        <span className="font-bold text-white text-[14px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Memo Enquiry
        </span>
      </div>

      {/* Filter row */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-700 font-medium">Doc Type</span>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-36">
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-700 font-medium whitespace-nowrap">Enter Memo No</span>
            <input value={memoNo} onChange={e => setMemoNo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-44" />
          </div>
          <button onClick={handleSearch}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-6 py-1.5 rounded">
            Search
          </button>
        </div>
      </div>

      {/* Dividers */}
      <div className="border-t-4 border-black mx-0 mt-0" />
      <div className="border-t-2 border-black mx-0 mt-1" />

      {/* Results */}
      <div className="text-center text-gray-400 py-8">No data available</div>
    </div>
  );
}
