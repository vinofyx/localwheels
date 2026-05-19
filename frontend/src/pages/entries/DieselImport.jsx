import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SortIcon = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const todayISO = new Date().toISOString().slice(0, 10);

const IMPORT_TYPES = ['Trip Wise', 'Without Trip'];

const REPORT_COLS = [
  'Entry No', 'Date', 'Vendor Name', 'Vehicle No',
  'Transcation No', 'Rate', 'Liter', 'Amount',
  'UREALiter', 'RunningKM', 'VendorNo', 'UrealtrRate',
];

export default function DieselImport() {
  const [tab,          setTab]          = useState('import');
  const [importType,   setImportType]   = useState('Trip Wise');
  const [dieselAgent,  setDieselAgent]  = useState('');
  const [fileName,     setFileName]     = useState('');
  const [fromDate,     setFromDate]     = useState(todayISO);
  const [toDate,       setToDate]       = useState(todayISO);
  const [reportRows,   setReportRows]   = useState([]);
  const [searched,     setSearched]     = useState(false);
  const fileRef = useRef(null);

  const handleShowData = () => {
    if (tab === 'import') { toast('Show Data'); return; }
    if (!fromDate) { toast.error('From Date is required'); return; }
    if (!toDate)   { toast.error('To Date is required');   return; }
    setReportRows([]); setSearched(true);
  };

  const handleImportData = () => {
    if (!dieselAgent.trim()) { toast.error('Diesel Agent is required'); return; }
    if (!fileName)           { toast.error('Please select an import file'); return; }
    toast.success('Importing data…');
  };

  const handleRefresh = () => {
    setImportType('Trip Wise'); setDieselAgent(''); setFileName('');
    setFromDate(todayISO); setToDate(todayISO);
    setReportRows([]); setSearched(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const inp  = 'border border-gray-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
  const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-600';
  const lblR = 'whitespace-nowrap font-medium text-red-600';
  const btn  = 'bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded';

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* ── Title ────────────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Diesel Import
        </h2>
      </div>

      {/* ── Main card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm overflow-hidden">

        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('import')}
            className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 ${
              tab === 'import' ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            Import
          </button>
          <button
            onClick={() => setTab('report')}
            className={`px-4 py-2 text-[13px] font-medium ${
              tab === 'report' ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}>
            Report
          </button>
        </div>

        {/* ── Import tab ─────────────────────────────────────────── */}
        {tab === 'import' && (
          <div className="px-5 py-4">

            {/* Row 1: Import Type | Diesel Agent | Select File | Buttons | Download link */}
            <div className="flex items-center gap-4 flex-wrap mb-4">
              <div className="flex flex-col gap-0.5">
                <label className="font-medium whitespace-nowrap">Import Type</label>
                <select value={importType} onChange={e => setImportType(e.target.value)}
                  className={`${inp} w-36`}>
                  {IMPORT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className={lblR}>* Diesel Agent</label>
                <input value={dieselAgent} onChange={e => setDieselAgent(e.target.value)}
                  className={`${inpR} w-48`} />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="font-medium whitespace-nowrap">Select Import File</label>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
                  onChange={e => setFileName(e.target.files?.[0]?.name || '')}
                  className="text-[13px]" />
              </div>

              <div className="flex items-end gap-2 flex-wrap">
                <button onClick={handleShowData}   className={btn}>Show Data</button>
                <button onClick={handleImportData} className={btn}>Import Data</button>
                <button onClick={handleRefresh}    className={btn}>Refresh</button>
              </div>

              <div className="ml-auto self-end pb-0.5">
                <button onClick={() => toast('Downloading template…')}
                  className="text-blue-600 underline text-[13px] hover:text-blue-800 whitespace-nowrap">
                  Download Sample Excel Template
                </button>
              </div>
            </div>

            {/* Row 2: Total Count | Total Diesel Amount */}
            <div className="flex items-center gap-8">
              <span className="font-bold text-[13px]">Total Count :</span>
              <span className="font-bold text-[13px]">Total Diesel Amount :</span>
            </div>
          </div>
        )}

        {/* ── Report tab ─────────────────────────────────────────── */}
        {tab === 'report' && (
          <div className="px-5 py-4">

            {/* Date filter row */}
            <div className="flex items-center gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-2">
                <label className={lblR}>* From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className={`${inp} w-36`} />
              </div>
              <div className="flex items-center gap-2">
                <label className={lblR}>* To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className={`${inp} w-36`} />
              </div>
              <button onClick={handleShowData} className={btn}>Show Data</button>
            </div>

            {/* Previously Imported Data */}
            <div className="mb-2">
              <span className="font-bold underline text-[13px]">Previously Imported Data</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                    {REPORT_COLS.map(col => (
                      <th key={col}
                        className="px-3 py-2 text-left font-medium border border-[#0a7ab8] whitespace-nowrap">
                        {col} {SortIcon}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr>
                      <td colSpan={REPORT_COLS.length}
                        className="px-3 py-4 text-center text-gray-500 border-b border-gray-200">
                        No data available in table
                      </td>
                    </tr>
                  ) : reportRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {REPORT_COLS.map(col => (
                        <td key={col} className="px-3 py-1.5 border-b border-gray-200">
                          {row[col] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
