import React, { useState } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };
const getDaysAgo = n => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
};

const DATE_FILTERS = ['30 DAYS', '7 DAYS', 'TODAY', 'CUSTOM'];

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

export default function VerifyOrder() {
  const [dateFilter, setDateFilter] = useState('30 DAYS');
  const [fromDate,   setFromDate]   = useState(getDaysAgo(30));
  const [toDate,     setToDate]     = useState(getToday());
  const [party,      setParty]      = useState('');
  const [branch,     setBranch]     = useState('');
  const [tab,        setTab]        = useState('pickup');

  const isCustom = dateFilter === 'CUSTOM';

  const handleFilterChange = v => {
    setDateFilter(v);
    if (v === '30 DAYS') { setFromDate(getDaysAgo(30)); setToDate(getToday()); }
    else if (v === '7 DAYS') { setFromDate(getDaysAgo(7)); setToDate(getToday()); }
    else if (v === 'TODAY') { setFromDate(getToday()); setToDate(getToday()); }
  };

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Verify Order
        </h2>
      </div>

      {/* Filter card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Date(Filter)</label>
            <select value={dateFilter} onChange={e => handleFilterChange(e.target.value)}
              className={`${inp} w-28`}>
              {DATE_FILTERS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">From Date</label>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)}
              readOnly={!isCustom}
              className={`${inp} w-28 ${!isCustom ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">To Date</label>
            <input value={toDate} onChange={e => setToDate(e.target.value)}
              readOnly={!isCustom}
              className={`${inp} w-28 ${!isCustom ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Party</label>
            <input value={party} onChange={e => setParty(e.target.value)} className={`${inp} w-36`} />
          </div>
          <button onClick={() => toast('Showing data…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Show
          </button>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Branch</label>
            <input value={branch} onChange={e => setBranch(e.target.value)} className={`${inp} w-36`} />
          </div>
        </div>
      </div>

      {/* Tabs card */}
      <div className="bg-white rounded shadow-sm">
        <div className="flex border-b border-gray-200">
          {[['pickup','Pickup-Request'],['cancel','Cancel Orders'],['all','All Orders']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 last:border-r-0 ${
                tab === key ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Pickup-Request tab */}
        {tab === 'pickup' && (
          <div className="px-3 py-2 flex items-center">
            <span className="text-red-600 font-bold text-[13px]">Total Count :&nbsp;</span>
            <div className="ml-auto">
              <button onClick={() => toast('Link LR')}
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
                Link LR
              </button>
            </div>
          </div>
        )}

        {/* Cancel Orders tab */}
        {tab === 'cancel' && (
          <div className="px-3 py-2 min-h-[60px]">
            <span className="text-red-600 font-bold text-[13px]">Total Count :&nbsp;</span>
          </div>
        )}

        {/* All Orders tab */}
        {tab === 'all' && (
          <div className="px-3 py-2 flex items-center min-h-[60px]">
            <div className="ml-auto">
              <span className="text-red-600 font-bold text-[13px]">Total Count :&nbsp;</span>
            </div>
          </div>
        )}

        {/* Empty results area */}
        <div className="min-h-[120px]" />
      </div>
    </div>
  );
}
