import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const todayISO = new Date().toISOString().slice(0, 10);

export default function FasTagImport() {
  const [tab,        setTab]        = useState('import');
  const [entryNo,    setEntryNo]    = useState('1');
  const [entryDate,  setEntryDate]  = useState(todayISO);
  const [totalCount, setTotalCount] = useState('');
  const [totalToll,  setTotalToll]  = useState('');
  const [fileName,   setFileName]   = useState('');
  const fileRef = useRef(null);

  const handleSave    = () => toast.success('Saved successfully');
  const handleSearch  = () => toast('Search');
  const handleRefresh = () => {
    setEntryNo('1'); setEntryDate(todayISO);
    setTotalCount(''); setTotalToll(''); setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImportFile = () => {
    if (!fileName) { toast.error('Please select an Excel file first'); return; }
    toast.success(`Importing ${fileName}…`);
  };

  const inp = 'border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          FasTag Import
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button onClick={handleSearch}
            className="flex items-center gap-1.5 bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refersh
          </button>
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4 mb-2">

        {/* Row 1: Entry No | Entry Date | Upto Date Import | Download link */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <label className="font-medium whitespace-nowrap">Entry No</label>
            <input value={entryNo} onChange={e => setEntryNo(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium whitespace-nowrap">Entry Date</label>
            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)}
              className={`${inp} w-36`} />
          </div>
          <button onClick={() => toast('Upto Date Import')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded">
            Upto Date Import
          </button>
          <div className="ml-auto">
            <button onClick={() => toast('Downloading template…')}
              className="text-blue-600 underline text-[13px] hover:text-blue-800 whitespace-nowrap">
              Download Sample Excel Template
            </button>
          </div>
        </div>

        {/* Row 2: Total Count | Total Toll | Select Excel File + file input | Import File */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap">Total Count</span>
            {totalCount && <span className="text-gray-700">{totalCount}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap">Total Toll</span>
            {totalToll && <span className="text-gray-700">{totalToll}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap">Select Excel File</span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => setFileName(e.target.files?.[0]?.name || '')}
              className="text-[13px]" />
          </div>
          <button onClick={handleImportFile}
            className="ml-auto bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded">
            Import File
          </button>
        </div>
      </div>

      {/* ── Tabs card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm">

        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('import')}
            className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 ${
              tab === 'import'
                ? 'bg-[#0b8fd3] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            Import FasTag
          </button>
          <button
            onClick={() => setTab('posted')}
            className={`px-4 py-2 text-[13px] font-medium ${
              tab === 'posted'
                ? 'bg-[#0b8fd3] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            Posted
          </button>
        </div>

        {/* Import FasTag tab content */}
        {tab === 'import' && (
          <div className="p-3 min-h-[80px]" />
        )}

        {/* Posted tab content */}
        {tab === 'posted' && (
          <div className="p-3 min-h-[80px] flex items-center justify-end">
            <button onClick={() => toast('Show Data')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded">
              Show Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
