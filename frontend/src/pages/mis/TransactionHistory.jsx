import React, { useState } from 'react';
import toast from 'react-hot-toast';

const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('/');

const BRANCHES = ['--ALL--', 'HYDERABAD'];

export default function TransactionHistory() {
  const [fromDate, setFromDate] = useState(today);
  const [toDate,   setToDate]   = useState(today);
  const [branch,   setBranch]   = useState('--ALL--');
  const [activeTab, setActiveTab] = useState('Transaction History');

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <div className="text-center py-2 border-b border-gray-300">
        <h2 className="font-bold text-[14px] underline">Transaction History</h2>
      </div>

      {/* Filter bar */}
      <div className="mx-0 border border-gray-300 bg-[#f4f4f4] px-6 py-3">
        <div className="flex items-center gap-8 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium whitespace-nowrap">From Date</span>
            <input
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium whitespace-nowrap">To Date</span>
            <input
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium whitespace-nowrap">Branch</span>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-40"
            >
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <button
            onClick={() => toast('Showing…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded ml-auto"
          >
            Show
          </button>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="border border-gray-300 mx-0 mt-2">
        {/* Tab bar */}
        <div className="flex bg-[#0b8fd3]">
          {['Transaction History', 'Mobile/System'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[13px] font-medium border-r border-blue-400 last:border-r-0
                ${activeTab === tab
                  ? 'bg-[#f5a623] text-white'
                  : 'text-white hover:bg-white/20'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {activeTab === 'Transaction History' && (
            <div>
              <p className="text-red-600 font-medium text-[13px] px-3 py-2">
                Click On Branch For Transaction Details
              </p>
              <hr className="border-gray-400" />
              <div className="h-16 bg-gray-200 mx-0 mt-2" />
            </div>
          )}
          {activeTab === 'Mobile/System' && (
            <div className="overflow-x-auto">
              <div className="min-w-full h-8 flex items-center px-2">
                <span className="text-gray-400 text-[12px]">No records found.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
