import React, { useState } from 'react';
import toast from 'react-hot-toast';

const BRANCHES = [
  '--ALL--', 'ADILABAD', 'ANANTHAPUR', 'CUDDAPAH', 'GUNTUR',
  'HYDERABAD', 'HYDERABAD-HEAD OFFICE', 'HYDERABAD1', 'KAKINADA',
  'KARIMNAGAR', 'KERALA', 'KHAMMAM', 'KURNOOL', 'MAHBUBNAGAR',
  'MANCHERIAL', 'NALGONDA', 'NELLORE', 'NIZAMABAD', 'ONGOLE',
  'RAJAHMUNDRY', 'SECUNDERABAD', 'SRIKAKULAM', 'TIRUPATI',
  'VIJAYAWADA', 'VISAKHAPATNAM', 'WARANGAL',
];

const genFY = () => {
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: 5 }, (_, i) => {
    const y = fy + 1 - i;
    return `${y}-${y + 1}`;
  });
};
const FY_YEARS = genFY();

const fyStartDate = () => {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `01/04/${y}`;
};
const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '/');

const sel = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';
const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';

export default function BalanceSheet() {
  const [fy,       setFy]       = useState(FY_YEARS[0]);
  const [fromDate, setFromDate] = useState(fyStartDate());
  const [toDate,   setToDate]   = useState(todayStr);
  const [view,     setView]     = useState('Ledger Wise');
  const [branch,   setBranch]   = useState('--ALL--');

  return (
    <div className="min-h-screen bg-white text-[13px]">
      {/* Title */}
      <div className="text-center py-2 border-b border-[#0b8fd3]">
        <span className="font-bold text-[14px] underline">Balance Sheet</span>
      </div>

      {/* Filter box */}
      <div className="border border-gray-300 mx-3 mt-3 mb-4 px-4 py-3 bg-white">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-end gap-2">
            <span className="text-[13px] text-gray-700 pb-1">Year</span>
            <select value={fy} onChange={e => setFy(e.target.value)} className={`${sel} w-28`}>
              {FY_YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[13px] text-gray-700 pb-1">From Date</span>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} w-28`} />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[13px] text-gray-700 pb-1">To Date</span>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className={`${inp} w-28`} />
          </div>
          <div className="flex items-end gap-3 pb-1">
            {['Group Wise', 'Ledger Wise'].map(m => (
              <label key={m} className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <input type="radio" checked={view === m} onChange={() => setView(m)}
                  className="w-3.5 h-3.5 accent-[#0b8fd3]" />
                <span className="text-[13px]">{m}</span>
              </label>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[13px] text-gray-700 pb-1">Branch</span>
            <select value={branch} onChange={e => setBranch(e.target.value)} className={`${sel} w-48`}>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <button onClick={() => toast('Loading Balance Sheet…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-6 py-1.5 rounded">
              Show
            </button>
          </div>
        </div>
      </div>

      {/* Empty results */}
      <div className="mx-3 text-center text-gray-400 py-10">No data available</div>
    </div>
  );
}
