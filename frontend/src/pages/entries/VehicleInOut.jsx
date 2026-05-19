import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SortIcon = (
  <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/>
  </svg>
);

const BRANCHES = [
  '--Select--',
  'HYDERABAD', 'WARANGAL', 'KARIMNAGAR', 'KHAMMAM', 'MAHBUBNAGAR',
  'NIZAMABAD', 'VIJAYAWADA', 'RAJAHMUNDRY', 'VISAKHAPATNAM', 'KURNOOL',
  'ANANTHAPUR', 'HYDERABAD-HEAD OFFICE', 'TAMILNADU', 'ADILABAD', 'NALGONDA',
  'SANGAREDDY', 'ONGOLE', 'NELLORE', 'GUNTUR', 'TIRUPATHI', 'CUDDAPAH',
  'TEST_API_BRANCH', 'TEST_API_2', 'HYDERABAD1', 'MANCHERIAL', 'VIKARABAD',
];

const TABLE_COLS = [
  'Branch', 'Doc Type', 'Doc No', 'Doc Date',
  'Vehicle No', 'Route Name', 'Vehicle Current Status',
  'IN/OUT Date', 'Remark', 'IN/OUT',
];

const today       = new Date().toISOString().slice(0, 10);
const fiveDaysAgo = (() => {
  const d = new Date(); d.setDate(d.getDate() - 5); return d.toISOString().slice(0, 10);
})();

export default function VehicleInOut() {
  const [branch,   setBranch]   = useState('HYDERABAD-HEAD OFFICE');
  const [fromDate, setFromDate] = useState(fiveDaysAgo);
  const [toDate,   setToDate]   = useState(today);
  const [type,     setType]     = useState('INWARD');
  const [tab,      setTab]      = useState('vehicle');
  const [rows,     setRows]     = useState([]);
  const [searched, setSearched] = useState(false);

  const handleShow = () => {
    if (!fromDate) { toast.error('From Date is required'); return; }
    if (!toDate)   { toast.error('To Date is required');   return; }
    setRows([]);
    setSearched(true);
  };

  const handleRefresh = () => {
    setBranch('HYDERABAD-HEAD OFFICE');
    setFromDate(fiveDaysAgo);
    setToDate(today);
    setType('INWARD');
    setRows([]);
    setSearched(false);
  };

  const sel = 'border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* ── Title ──────────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Vehicle In/Out
        </h2>
      </div>

      {/* ── Filter card ────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <p className="text-red-600 text-[12px] font-medium mb-2">* Mark fields are compulsory</p>
        <div className="flex items-center gap-4 flex-wrap">

          {/* Branch */}
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap">Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}
              className={`${sel} min-w-[190px]`}>
              {BRANCHES.map(b => <option key={b} value={b === '--Select--' ? '' : b}>{b}</option>)}
            </select>
          </div>

          {/* From Date */}
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-red-600 font-medium">* From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-red-600 font-medium">* To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Type */}
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className={`${sel} w-28`}>
              <option>INWARD</option>
              <option>OUTWARD</option>
            </select>
          </div>

          {/* Buttons */}
          <button onClick={handleShow}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-5 py-1.5 rounded">
            Show
          </button>
          <button onClick={handleRefresh}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-5 py-1.5 rounded">
            Refersh
          </button>
        </div>
      </div>

      {/* ── Tabs + content card ─────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm">

        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('vehicle')}
            className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 ${
              tab === 'vehicle'
                ? 'bg-[#0b8fd3] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            Vehicle In/Out
          </button>
          <button
            onClick={() => setTab('report')}
            className={`px-4 py-2 text-[13px] font-medium ${
              tab === 'report'
                ? 'bg-[#0b8fd3] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            Report
          </button>
        </div>

        {/* Tab: Vehicle In/Out */}
        {tab === 'vehicle' && (
          <div className="p-3">
            <p className="text-red-600 font-bold text-[13px] mb-2">
              Total Count : {searched ? rows.length : 0}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                    <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                      View
                    </th>
                    {TABLE_COLS.map(col => (
                      <th key={col} className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                        {col} {SortIcon}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={TABLE_COLS.length + 1}
                        className="px-3 py-4 text-center text-gray-500 border border-gray-200">
                        No data available in table
                      </td>
                    </tr>
                  ) : rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                        <button className="text-blue-600 underline text-[12px]">View</button>
                      </td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.branch}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.docType}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.docNo}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.docDate}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.vehicleNo}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.routeName}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.vehicleCurrentStatus}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.inOutDate}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.remark}</td>
                      <td className="px-3 py-1.5 border-b border-gray-200">{row.inOut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Report */}
        {tab === 'report' && (
          <div className="p-3">
            <p className="text-red-600 font-bold text-[13px]">Total Count :</p>
          </div>
        )}
      </div>
    </div>
  );
}
