import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
  v === 'save' ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
  v === 'search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
  'bg-[#546e7a] hover:bg-[#455a64]'
}`;

const TABLE_COLS = [
  'Branch','LR No','LR Date','Consigner','Consignee',
  'From Location','To Location','Stock Qty','Stock WT',
  'Qty','Type','TAT Extend Days','Upload Image','Reason','Remark',
];

export default function HoldLostDamage() {
  const [lrNo,   setLrNo]   = useState('');
  const [type,   setType]   = useState('Hold');
  const [rows,   setRows]   = useState([]);

  const handleRefresh = () => { setLrNo(''); setType('Hold'); setRows([]); };

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Top bar */}
      <div className="flex items-center mb-2">
        <div className="flex-1" />
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Hold/Lost/Damage
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')} className={topBtn('save')}>{SaveIcon} Save</button>
          <button onClick={() => toast('Search')}        className={topBtn('search')}>{SearchIcon} Search</button>
          <button onClick={handleRefresh}                className={topBtn('gray')}>{RefreshIcon} Refresh</button>
        </div>
      </div>

      {/* Entry card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="font-medium text-[13px] whitespace-nowrap">Enter LR No</label>
          <input value={lrNo} onChange={e => setLrNo(e.target.value)}
            className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400 w-40" />
          <select value={type} onChange={e => setType(e.target.value)}
            className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400 w-28">
            <option>Hold</option>
            <option>Lost</option>
            <option>Damage</option>
          </select>
          <button onClick={() => toast('Selecting LR…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
            Select LR
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded shadow-sm overflow-x-auto">
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
                <td colSpan={TABLE_COLS.length} className="text-center py-5 text-gray-500">
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
