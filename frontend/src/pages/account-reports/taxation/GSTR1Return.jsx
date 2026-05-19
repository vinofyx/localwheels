import React, { useState } from 'react';
import toast from 'react-hot-toast';

const TYPE_OPTS = ['BILL', 'LR', 'Credit Debit Note'];

const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-28';
const sel = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-40';

function Btn({ label, onClick }) {
  return (
    <button
      onClick={onClick || (() => toast(`${label}…`))}
      className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-3 py-1 rounded whitespace-nowrap">
      {label}
    </button>
  );
}

export default function GSTR1Return() {
  const [activeTab, setActiveTab] = useState('unfreeze');
  const [type,      setType]      = useState('BILL');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [selectAll, setSelectAll] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[13px]">
      {/* Title */}
      <div className="text-center py-2 border-b border-[#0b8fd3]">
        <span className="font-bold text-[14px] underline">GSTR1 Return</span>
      </div>

      {/* Main card */}
      <div className="border border-gray-300 mx-3 mt-3 mb-4 rounded overflow-hidden">

        {/* ── Tab bar ── */}
        <div className="bg-[#0b8fd3] flex">
          {[
            { id: 'unfreeze', label: 'Un-Freeze Data' },
            { id: 'freeze',   label: 'Freeze Data' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-[13px] font-medium transition-colors
                ${activeTab === t.id
                  ? 'bg-orange-500 text-white'
                  : 'text-white hover:bg-white/20'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Controls ── */}
        <div className="px-4 py-3 bg-white">
          <div className="flex flex-wrap items-center gap-3">

            {/* Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-gray-700">Type</span>
              <select value={type} onChange={e => setType(e.target.value)} className={sel}>
                {TYPE_OPTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* From / To Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-gray-700">FromDate</span>
              <input value={fromDate} onChange={e => setFromDate(e.target.value)}
                placeholder="DD/MM/YYYY" className={inp} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-gray-700">ToDate</span>
              <input value={toDate} onChange={e => setToDate(e.target.value)}
                placeholder="DD/MM/YYYY" className={inp} />
            </div>

            {/* Buttons — differ per tab */}
            {activeTab === 'unfreeze' ? (
              <>
                <Btn label="Show" />
                <Btn label="Freeze Data" />
                {/* Excel export icon */}
                <button onClick={() => toast('Export Excel…')}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-green-700 font-bold text-[15px]">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="1" fill="#e8f5e9" stroke="#388e3c"/>
                    <path d="M8 7l4 5-4 5M12 7v10" stroke="#388e3c" strokeWidth={1.5}/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Btn label="Show" />
                <Btn label="B2B" />
                <Btn label="CRDRNote" />
                <Btn label="EXEMP" />
                <Btn label="HSN" />
                <Btn label="DOCS" />
                <Btn label="Un-Freeze Data" />
                <Btn label="GenrateJson" />
              </>
            )}
          </div>

          {/* Select All — only in Un-Freeze tab */}
          {activeTab === 'unfreeze' && (
            <div className="mt-3 flex items-center gap-1.5">
              <input type="checkbox" id="selAll" checked={selectAll}
                onChange={e => setSelectAll(e.target.checked)}
                className="w-3.5 h-3.5" />
              <label htmlFor="selAll" className="text-[13px] text-gray-700 cursor-pointer">
                Select All
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="mx-3 text-center text-gray-400 py-8">No data available</div>
    </div>
  );
}
