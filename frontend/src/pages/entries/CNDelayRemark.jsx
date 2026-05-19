import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
  v==='save'   ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
  v==='search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
                 'bg-[#546e7a] hover:bg-[#455a64]'
}`;

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

const REASONS = [
  { label: '--Select--', color: '' },
  { label: 'HOLD INSTRUCTION BY CONSIGNEE DUE TO OUT OF STATION', color: 'text-orange-600' },
  { label: 'CONCERN PERSON NOT AVAIALBLE ON DELIVERY ATTEMPT', color: '' },
  { label: 'SHIPMENT MISSROUTED', color: '' },
  { label: 'HOLD INSTRUCTIONS FROM CONSIGNEE', color: 'text-orange-600' },
  { label: 'HOLD INSTRUCTIONS FROM CONSIGNOR', color: 'text-orange-600' },
  { label: 'VALID DOCUMENTS NOT PROVIDED BY CONSIGNOR', color: 'text-orange-600' },
  { label: 'Consignee WeekOff On Tuesday', color: '' },
  { label: 'CONSIGNEE CONTACT NUMBER INVALID', color: '' },
  { label: 'CONSIGNEE STORE CLOSED ON LATE DELIVERY ATTEMPT', color: '' },
  { label: 'PUBLIC HOLIDAY', color: '' },
  { label: 'CONSIGNEE ADDRESS NOT FOUND CONTACT NUMBER NOT AVAILABLE IN INVOICE', color: '' },
  { label: 'REQURED CONTACT PERSON NUMBER', color: '' },
  { label: 'REQURED APPOINTMENT DATE /TIME & CONTACT PERSON NUMBER', color: '' },
  { label: 'TRANSIT-VECHILE BREAK-DOWN', color: '' },
  { label: 'Hold Instructions From Consignee Due To Road Construction', color: '' },
  { label: 'SHIPMENT DELAYED DUE TO DOCUMENTS MISSING IN TRANSIT VECHILE.', color: '' },
  { label: 'Road closed due to festival Procession', color: '' },
  { label: 'Delayed Due To A Regional Fuel Supply Shortage', color: '' },
];

const FILTER_OPTIONS = ['LR','MEMO/MANIFEST','LDM'];

export default function CNDelayRemark() {
  const [remarkType, setRemarkType] = useState('LR Delay Remark');
  const [reason,     setReason]     = useState('--Select--');
  const [filter,     setFilter]     = useState('LR');
  const [enterLRNo,  setEnterLRNo]  = useState('');
  const [excelFile,  setExcelFile]  = useState(null);

  const handleRefresh = () => {
    setRemarkType('LR Delay Remark'); setReason('--Select--');
    setFilter('LR'); setEnterLRNo(''); setExcelFile(null);
  };

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Top bar */}
      <div className="flex items-center mb-2">
        <div className="flex-1" />
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>CN Delay Remark</h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')} className={topBtn('save')}>{SaveIcon} Save</button>
          <button onClick={() => toast('Search')}        className={topBtn('search')}>{SearchIcon} Search</button>
          <button onClick={handleRefresh}                className={topBtn('gray')}>{RefreshIcon} Refresh</button>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">
        <div className="min-w-max">
          {/* Row 1 */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Remark Type</label>
              <select value={remarkType} onChange={e => setRemarkType(e.target.value)}
                className={`${inp} w-44`}>
                <option>LR Delay Remark</option>
                <option>Godown Stock Remark</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)}
                className={`${inp} w-80`}>
                {REASONS.map(r => (
                  <option key={r.label} value={r.label} className={r.color}>{r.label}</option>
                ))}
              </select>
            </div>
            <button onClick={() => toast('Set All applied')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Set All
            </button>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Filter</label>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className={`${inp} w-28`}>
                {FILTER_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <button onClick={() => toast('Selecting LR…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Select LR
            </button>
          </div>
          {/* Row 2 */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Enter LR No</label>
              <input value={enterLRNo} onChange={e => setEnterLRNo(e.target.value)}
                className={`${inp} w-40`} />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium text-[13px] whitespace-nowrap">Select Excel File</label>
              <input type="file" accept=".xlsx,.xls,.csv"
                onChange={e => setExcelFile(e.target.files[0])}
                className="text-[13px]" />
            </div>
            <button onClick={() => toast('Importing data…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
              Import Data
            </button>
            <button onClick={() => toast('Downloading template…')}
              className="text-blue-600 hover:underline text-[13px] font-medium">
              Download Sample Excel Template
            </button>
          </div>
        </div>
      </div>

      {/* Empty results area */}
      <div className="bg-white rounded shadow-sm min-h-[200px]" />
    </div>
  );
}
