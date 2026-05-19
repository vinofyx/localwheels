import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';

const today = new Date();
const fmt = d => d.toLocaleDateString('en-GB').split('/').join('/');
const firstOfYear = new Date(today.getFullYear(), 3, 1); // April 1

export default function AccountAnalysis() {
  const [fromDate,       setFromDate]       = useState(fmt(firstOfYear));
  const [toDate,         setToDate]         = useState(fmt(today));
  const [statementType,  setStatementType]  = useState('INCOME');
  const [grouping,       setGrouping]       = useState('MONTH WISE');

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <div className="text-center py-2 border-b border-gray-300">
        <h2 className="font-bold text-[14px] underline">Account Analysis</h2>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 flex-wrap px-4 py-3 border border-gray-300 bg-white mx-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium whitespace-nowrap">From Date</span>
          <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} w-28`} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium whitespace-nowrap">To Date</span>
          <input value={toDate} onChange={e => setToDate(e.target.value)} className={`${inp} w-28`} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium whitespace-nowrap">Statement Type</span>
          <select value={statementType} onChange={e => setStatementType(e.target.value)} className={`${inp} w-44`}>
            <option>INCOME</option>
            <option>EXPENSES</option>
            <option>CASH FLOW</option>
            <option>BANK FLOW</option>
            <option>SALES</option>
            <option>PROFIT-LOSS</option>
            <option>PURCHASE</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium whitespace-nowrap">Grouping</span>
          <select value={grouping} onChange={e => setGrouping(e.target.value)} className={`${inp} w-36`}>
            <option>MONTH WISE</option>
            <option>BRANCH WISE</option>
            <option>HEAD WISE</option>
          </select>
        </div>
        <button
          onClick={() => toast('Showing…')}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded"
        >
          Show
        </button>
      </div>

      <div className="p-2 text-[12px] text-gray-500">.</div>

      {/* Content placeholder with blue side panel */}
      <div className="flex gap-2 mx-4 mt-2">
        <div className="flex-1 min-h-[300px] border border-gray-200" />
        <div className="w-64 min-h-[180px] bg-[#0b8fd3] rounded" />
      </div>
    </div>
  );
}
