import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const pad = n => String(n).padStart(2, '0');
const getToday = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; };

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const POD_TYPES = ['With POD Send', 'Without POD Send'];

const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const btn  = 'bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded';

export default function PODReceived() {
  const [tab,            setTab]           = useState('received');
  const [receivedDate,   setReceivedDate]  = useState(getToday());
  const [receivedPerson, setReceivedPerson]= useState('');
  const [podType,        setPodType]       = useState('With POD Send');
  const [enterLrNo,      setEnterLrNo]     = useState('');
  const [searchVal,      setSearchVal]     = useState('');
  const [fileName,       setFileName]      = useState('');
  const fileRef = useRef(null);

  const handleRefresh = () => {
    setReceivedDate(getToday()); setReceivedPerson('');
    setPodType('With POD Send'); setEnterLrNo('');
    setSearchVal(''); setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
    v === 'save'   ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
    v === 'search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
                     'bg-[#546e7a] hover:bg-[#455a64]'
  }`;

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#cfd6de' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          POD Received
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')}  className={topBtn('save')}>  {SaveIcon}    Save    </button>
          <button onClick={() => toast('Search')}         className={topBtn('search')}>{SearchIcon}  Search  </button>
          <button onClick={handleRefresh}                 className={topBtn('gray')}>  {RefreshIcon} Refersh </button>
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className={lblR}>* Received Date</label>
            <input value={receivedDate} onChange={e => setReceivedDate(e.target.value)}
              className={`${inpR} w-32`} />
          </div>
          <div className="flex items-center gap-2">
            <label className={lblR}>* Received Person</label>
            <input value={receivedPerson} onChange={e => setReceivedPerson(e.target.value)}
              className={`${inpR} w-40`} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <select value={podType} onChange={e => setPodType(e.target.value)}
              className={`${inp} w-44`}>
              {POD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={() => toast('Select LR')} className={btn}>Select LR</button>
            <label className="font-medium whitespace-nowrap text-[13px]">Enter LR No</label>
            <input value={enterLrNo} onChange={e => setEnterLrNo(e.target.value)}
              className={`${inp} w-40`} />
          </div>
        </div>
      </div>

      {/* ── Tabs card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm">
        <div className="flex border-b border-gray-200">
          {[['received','POD Received'],['bulk','Bulk POD Received']].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 last:border-r-0 ${
                tab === key ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* POD Received tab */}
        {tab === 'received' && (
          <div className="px-3 py-3">
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="border border-gray-300 px-2 py-1 w-full text-[13px] focus:outline-none focus:border-blue-400"
              placeholder="" />
          </div>
        )}

        {/* Bulk POD Received tab */}
        {tab === 'bulk' && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="font-medium whitespace-nowrap text-[13px]">Select Excel File</label>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
                  onChange={e => setFileName(e.target.files?.[0]?.name || '')}
                  className="text-[13px]" />
              </div>
              <button onClick={() => toast('Show Data')}       className={btn}>Show Data</button>
              <button onClick={() => {
                if (!fileName) { toast.error('Please select an Excel file'); return; }
                toast.success('Importing…');
              }} className={btn}>Import Data</button>
              <button onClick={() => {
                setFileName('');
                if (fileRef.current) fileRef.current.value = '';
                toast('Refreshed');
              }} className={btn}>Refresh Import</button>
              <button onClick={() => toast('Downloading template…')}
                className="text-blue-600 underline text-[13px] hover:text-blue-800 whitespace-nowrap ml-auto">
                Download Sample Excel Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
