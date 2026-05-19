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

const TABLE_COLS = [
  'Order No', 'Order Date', 'Order Ref No', 'Party Name', 'From Location', 'To Location',
  'Qty', 'Act Wt', 'Pickup Date', 'Assign Branch', 'Contact Person', 'Contact No',
  'Transit Mode', 'Status', 'Docket No', 'Assigned Vehicle', 'Remark',
];

const STATUS_OPTIONS = ['ALL', 'PENDING', 'VERIFIED', 'ASSIGNED', 'CANCELLED'];

export default function OrderRegister() {
  const [dateFilter, setDateFilter] = useState('30 DAYS');
  const [fromDate,   setFromDate]   = useState(getDaysAgo(30));
  const [toDate,     setToDate]     = useState(getToday());
  const [party,      setParty]      = useState('');
  const [branch,     setBranch]     = useState('');
  const [status,     setStatus]     = useState('ALL');
  const [rows,       setRows]       = useState([]);

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
          Order Register
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
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Branch</label>
            <input value={branch} onChange={e => setBranch(e.target.value)} className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={`${inp} w-28`}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={() => toast('Showing data…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Show
          </button>
        </div>
      </div>

      {/* Results card */}
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <div className="flex items-center px-3 py-2 border-b border-gray-200 gap-4 flex-wrap">
          <span className="text-red-600 font-bold text-[13px]">
            Total Count :&nbsp;<span className="font-normal text-black">{rows.length}</span>
          </span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => toast('Export Excel')}
              className="bg-[#217346] hover:bg-[#1a5c38] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Excel
            </button>
            <button onClick={() => toast('Print')}
              className="bg-[#546e7a] hover:bg-[#455a64] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Print
            </button>
          </div>
        </div>
        <table className="w-full border-collapse text-[13px] min-w-max">
          <thead>
            <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
              {TABLE_COLS.map(col => (
                <th key={col} className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                  {col}<span className="ml-1 opacity-70 text-[10px]">⇅</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLS.length} className="text-center py-6 text-gray-500">
                  No data available in table
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {TABLE_COLS.map(col => (
                    <td key={col} className="px-3 py-1.5 border-b border-gray-200">{r[col] || ''}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
