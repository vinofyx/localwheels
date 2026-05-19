import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const lbl = 'font-medium text-[13px] whitespace-nowrap w-36';

export default function MissingDocument() {
  const [rangeType,    setRangeType]    = useState('Series Allocation');
  const [branch,       setBranch]       = useState('--Select--');
  const [docType,      setDocType]      = useState('LR');
  const [fromDate,     setFromDate]     = useState('');
  const [seriesList,   setSeriesList]   = useState('');
  const [freightType,  setFreightType]  = useState('--Select--');

  return (
    <div className="p-4 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>
      <div className="text-center mb-3">
        <h2 className="font-bold text-[15px] tracking-wide underline">Missing Document</h2>
      </div>

      <div className="rounded shadow-sm px-5 py-4" style={{ backgroundColor: '#f0f0f0' }}>
        {/* Row 1 */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <label className={lbl}>Range Type</label>
            <select value={rangeType} onChange={e => setRangeType(e.target.value)} className={`${inp} w-44`}>
              <option>Series Allocation</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)} className={`${inp} w-44`}>
              <option>--Select--</option>
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <label className={lbl}>Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className={`${inp} w-44`}>
              <option>LR</option>
              <option>MEMO</option>
              <option>MR</option>
              <option>BILL</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>From Issue Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inp} w-36`} />
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <label className={lbl}>Series List</label>
            <input value={seriesList} onChange={e => setSeriesList(e.target.value)} className={`${inp} w-44`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lbl}>Freight Type</label>
            <select value={freightType} onChange={e => setFreightType(e.target.value)} className={`${inp} w-44`}>
              <option>--Select--</option>
              <option>TBB</option>
              <option>PAID/TOPAY</option>
              <option>Free</option>
            </select>
            <button onClick={() => toast('Searching…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded ml-2">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
