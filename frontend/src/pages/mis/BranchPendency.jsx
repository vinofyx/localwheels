import React, { useState } from 'react';
import toast from 'react-hot-toast';

const STATES = [
  '--ALL--', 'ANDAMAN AND NICOBAR ISLANDS', 'ANDHRA PRADESH', 'ANDHRA PRADESH-OLD',
  'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR', 'CHANDIGARH', 'CHHATTISGARH',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', 'DAMAN AND DIU', 'DELHI', 'DEMO',
  'GOA', 'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JAMMU AND KASHMIR',
  'JHARKHAND', 'KARNATAKA', 'KERALA', 'LADAKH', 'LAKSHADWEEP',
  'MADHYA PRADESH', 'MAHARASHTRA', 'MANIPUR', 'MEGHALAYA', 'MIZORAM',
  'NAGALAND', 'ODISHA', 'PUDUCHERRY', 'PUNJAB', 'RAJASTHAN', 'SIKKIM',
  'TAMILNADU', 'TELANGANA', 'TRIPURA', 'UTTAR PRADESH', 'UTTARAKHAND', 'WEST BENGAL',
];

const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';
const lbl = 'text-red-600 font-medium text-[13px] whitespace-nowrap';

export default function BranchPendency() {
  const [fromDate,  setFromDate]  = useState('11/11/2025');
  const [toDate,    setToDate]    = useState('11/05/2026');
  const [state,     setState]     = useState('--ALL--');
  const [region,    setRegion]    = useState('--ALL--');
  const [branch,    setBranch]    = useState('');
  const [activeTab, setActiveTab] = useState('Transactional');

  const TABS = ['Transactional', 'POD', 'Account'];

  return (
    <div className="min-h-screen bg-white text-[13px]">
      <div className="text-center py-2 border-b border-gray-300">
        <h2 className="font-bold text-[14px] underline">Branch Pendency</h2>
      </div>

      {/* Filter bar */}
      <div className="border border-gray-300 bg-[#f4f4f4] px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className={lbl}>* From<br />Date</span>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} w-28 border-red-400`} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={lbl}>* To<br />Date</span>
            <input value={toDate} onChange={e => setToDate(e.target.value)} className={`${inp} w-28 border-red-400`} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={lbl}>* State</span>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className={`${inp} w-44 border-red-400`}
              size={1}
            >
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium whitespace-nowrap">Region</span>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className={`${inp} w-28`}
            >
              <option>--ALL--</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium whitespace-nowrap">Branch</span>
            <input value={branch} onChange={e => setBranch(e.target.value)} className={`${inp} w-36`} />
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
      <div className="border border-gray-300 mt-2">
        {/* Tab bar */}
        <div className="flex bg-[#0b8fd3]">
          {TABS.map(tab => (
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

        {/* Content area with horizontal scroll */}
        <div className="overflow-x-auto min-h-[180px]">
          <div className="min-w-full">
            <hr className="border-gray-300" />
            <div className="px-3 py-4 text-gray-400 text-[12px]">No records found.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
