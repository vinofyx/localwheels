import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp  = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none';
const lbl  = 'text-[13px] text-gray-800';
const lblB = 'text-[13px] text-[#0b8fd3] font-medium';

const REPORT_TYPES = ['Ledgerwise', 'Groupwise'];
const SHOW_BY      = ['Details', 'Summary'];
const AGING_OPTS   = ['NO', 'YES(30-90 Above)', 'YES(90-180 Above)', 'YES(30-365 Above)'];

export default function OSReport() {
  const [reportType,       setReportType]       = useState('Ledgerwise');
  const [ledger,           setLedger]           = useState('');
  const [fromDate,         setFromDate]         = useState('');
  const [toDate,           setToDate]           = useState('');
  const [showBy,           setShowBy]           = useState('Details');
  const [aging,            setAging]            = useState('NO');
  const [receivedUptoDate, setReceivedUptoDate] = useState('');
  const [rows,             setRows]             = useState([]);

  const handleShow = () => {
    if (!fromDate) { toast.error('From Date is required'); return; }
    if (!toDate)   { toast.error('To Date is required');   return; }
    toast('Fetching O/S Report…');
  };

  return (
    <div className="min-h-screen bg-white text-[13px]">
      {/* Title */}
      <div className="text-center py-2">
        <span className="font-bold text-[14px] underline">O/S Report</span>
      </div>

      {/* Filter box */}
      <div className="border border-gray-300 mx-3 mb-4 px-4 py-3 bg-white">
        {/* Row 1 */}
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className={lbl}>Report<br />Type</span>
            <select value={reportType} onChange={e => setReportType(e.target.value)}
              className={`${inp} w-28`}>
              {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <span className={lbl}>Ledger</span>
            <input value={ledger} onChange={e => setLedger(e.target.value)}
              className={`${inp} flex-1`} />
          </div>

          <div className="flex items-center gap-2">
            <span className={`${lblB} whitespace-nowrap`}>From Date</span>
            <input value={fromDate} onChange={e => setFromDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className={`${inp} w-32`} />
          </div>

          <div className="flex items-center gap-2">
            <span className={`${lbl} whitespace-nowrap`}>To Date</span>
            <input value={toDate} onChange={e => setToDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className={`${inp} w-32`} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={lbl}>ShowBy</span>
            <select value={showBy} onChange={e => setShowBy(e.target.value)}
              className={`${inp} w-24`}>
              {SHOW_BY.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className={lbl}>Aging</span>
            <select value={aging} onChange={e => setAging(e.target.value)}
              className={`${inp} w-44`}>
              {AGING_OPTS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className={`${lbl} whitespace-nowrap`}>Received Upto<br />Date</span>
            <input value={receivedUptoDate} onChange={e => setReceivedUptoDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className={`${inp} w-32`} />
          </div>

          <button onClick={handleShow}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-8 py-1.5 rounded">
            Show
          </button>
        </div>
      </div>

      {/* Results table placeholder */}
      {rows.length === 0 && (
        <div className="mx-3 text-center text-gray-400 py-10 text-[13px]">
          No data available
        </div>
      )}
    </div>
  );
}
