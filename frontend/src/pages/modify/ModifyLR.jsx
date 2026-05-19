import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

const SearchIcon = () => (
  <svg className="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
  </svg>
);

const FILTERS = ['LR NO','LR DATE','BOOKING','DELIVERY','CONSIGNEE','CONSIGNOR','VEHICLENO'];

export default function ModifyLR() {
  const [filter, setFilter] = useState('LR NO');
  const [value, setValue] = useState('');

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide underline">LR</h2>
      </div>
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2" style={{ backgroundColor: '#e8e8e8' }}>
          <label className="font-medium text-[13px] whitespace-nowrap">Filter</label>
          <select value={filter} onChange={e => setFilter(e.target.value)} className={`${inp} w-36`}>
            {FILTERS.map(f => <option key={f}>{f}</option>)}
          </select>
          <input value={value} onChange={e => setValue(e.target.value)} className={`${inp} w-40`} />
          <button onClick={() => toast('Searching…')} className="flex items-center"><SearchIcon /></button>
        </div>
        <div className="border-t-2 border-b-2 border-black h-1" />
        <div className="min-h-[200px]" />
      </div>
    </div>
  );
}
