import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

const SearchIcon = () => (
  <svg className="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
  </svg>
);

const FILTERS = ['LR DATE','LR NO','BOOKING','DELIVERY','CONSIGNEE','COSIGNOR','BILLINGPARTY','BRANCH','POD UPLOADED BY'];

export default function DownloadDamage() {
  const [filter,    setFilter]    = useState('LR DATE');
  const [from,      setFrom]      = useState('');
  const [to,        setTo]        = useState('');
  const [selectAll, setSelectAll] = useState(false);

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          DownloadDamage
        </h2>
      </div>

      {/* Filter + results card */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-3 px-3 py-2 flex-wrap" style={{ backgroundColor: '#f0f0f0' }}>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Filter</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} className={`${inp} w-40`}>
              {FILTERS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <input value={from} onChange={e => setFrom(e.target.value)} className={`${inp} w-28`} />
          <input value={to}   onChange={e => setTo(e.target.value)}   className={`${inp} w-28`} />
          <button onClick={() => toast('Searching…')} className="flex items-center">
            <SearchIcon />
          </button>
          <div className="ml-auto">
            <button onClick={() => toast('Downloading…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
              Download
            </button>
          </div>
        </div>

        {/* Select All row */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200">
          <input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} />
          <label className="text-[13px] font-medium cursor-pointer" onClick={() => setSelectAll(v => !v)}>
            Select
          </label>
        </div>

        {/* Double line separator */}
        <div className="border-t-2 border-b-2 border-black h-1" />

        {/* Empty results */}
        <div className="min-h-[200px]" />
      </div>
    </div>
  );
}
