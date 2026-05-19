import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-1.5 py-1 text-[13px] focus:outline-none bg-white w-full';
const lbl = 'text-[13px] whitespace-nowrap font-medium';

const MONTHS = [
  '--ALL--', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
];
const YEARS = ['--ALL--', '2023-24', '2024-25', '2025-26', '2026-27'];

export default function BranchPerformance() {
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [branch,    setBranch]    = useState('');
  const [month,     setMonth]     = useState('--ALL--');
  const [year,      setYear]      = useState('--ALL--');
  const [showBy,    setShowBy]    = useState('Summary');
  const [activeTab, setActiveTab] = useState('LR');
  const TABS = ['LR', 'Billing', 'Collection', 'Expense'];

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <div className="text-center py-2 border-b border-gray-300">
        <h2 className="font-bold text-[14px] underline">Branch Performance</h2>
      </div>

      <div className="m-3 border border-gray-300 bg-[#f4f4f4] px-4 py-3">
        <div className="grid grid-cols-6 gap-3 mb-3 items-end">
          <div>
            <div className="mb-0.5"><span className={lbl}>From Date</span></div>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={inp} />
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>To Date</span></div>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className={inp} />
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>Month</span></div>
            <select value={month} onChange={e => setMonth(e.target.value)} className={inp}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>Year</span></div>
            <select value={year} onChange={e => setYear(e.target.value)} className={inp}>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <div className="mb-0.5"><span className={lbl}>Show By</span></div>
            <select value={showBy} onChange={e => setShowBy(e.target.value)} className={inp}>
              <option>Summary</option>
              <option>Details</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => toast('Showing…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded w-full"
            >
              Show
            </button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3 items-end">
          <div>
            <div className="mb-0.5"><span className={lbl}>Branch</span></div>
            <input value={branch} onChange={e => setBranch(e.target.value)} className={inp} />
          </div>
        </div>
      </div>

      <div className="border border-gray-300 mx-3 mt-2">
        <div className="flex bg-[#0b8fd3]">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[13px] font-medium border-r border-blue-400 last:border-r-0
                ${activeTab === tab ? 'bg-[#f5a623] text-white' : 'text-white hover:bg-white/20'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto min-h-[180px]">
          <div className="border-t border-gray-300" />
          <div className="px-3 py-4 text-gray-400 text-[12px]">No records found.</div>
        </div>
      </div>
    </div>
  );
}
