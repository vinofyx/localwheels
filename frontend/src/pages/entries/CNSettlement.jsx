import React, { useState } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const PrintIcon   = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;

const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
  v==='save'   ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
  v==='search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
                 'bg-[#546e7a] hover:bg-[#455a64]'
}`;

const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const lbl  = 'whitespace-nowrap font-medium text-[13px]';
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';

const TABLE_COLS = [
  'LR Branch','LR No','LR Date','Consignor','Consignee',
  'LR Qty','Doc Type','Short/Dammage/Lost Qty','Settlement Qty','Delete',
];

export default function CNSettlement() {
  const [settlementDate, setSettlementDate] = useState(getToday());
  const [settlementType, setSettlementType] = useState('Short Qty');
  const [processType,    setProcessType]    = useState('Settlement');
  const [remark,         setRemark]         = useState('');
  const [rows,           setRows]           = useState([]);

  const handleRefresh = () => {
    setSettlementDate(getToday()); setSettlementType('Short Qty');
    setProcessType('Settlement'); setRemark(''); setRows([]);
  };

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Top bar */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>CN Settlement</h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')} className={topBtn('save')}>{SaveIcon} Save</button>
          <button onClick={() => toast('Search')}        className={topBtn('search')}>{SearchIcon} Search</button>
          <button onClick={handleRefresh}                className={topBtn('gray')}>{RefreshIcon} Refersh</button>
          <button onClick={() => toast('Printing...')}   className={topBtn('gray')}>{PrintIcon} Print</button>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">
        <div className="min-w-max">
          {/* Row 1 */}
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2">
              <label className={lblR}>* Settlement No.</label>
              <input value="1" readOnly className="border border-gray-300 bg-gray-100 px-2 py-1 w-32 text-[13px] cursor-not-allowed" />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Settlement Date</label>
              <input value={settlementDate} onChange={e => setSettlementDate(e.target.value)}
                className={`${inpR} w-28`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Settlement Type</label>
              <select value={settlementType} onChange={e => setSettlementType(e.target.value)}
                className={`${inp} w-36`}>
                <option>Short Qty</option>
                <option>Dammage Qty</option>
                <option>Excess Qty</option>
                <option>Lost Shipment</option>
              </select>
            </div>
          </div>
          {/* Row 2 */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className={lbl}>Process Type</label>
              <select value={processType} onChange={e => setProcessType(e.target.value)}
                className={`${inp} w-36`}>
                <option>Settlement</option>
                <option>Dispatch</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Remark</label>
              <input value={remark} onChange={e => setRemark(e.target.value)}
                className={`${inpR} w-56`} />
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-max">
          <thead>
            <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
              {TABLE_COLS.map(col => (
                <th key={col} className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                  {col !== 'LR Branch' && col !== 'Delete'
                    ? <>{col}<span className="ml-1 opacity-70 text-[10px]">⇅</span></>
                    : col}
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
