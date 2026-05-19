import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ExcelIcon = (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="4" fill="#1D6F42"/>
    <text x="4" y="22" fontSize="14" fontWeight="bold" fill="white" fontFamily="Arial">X</text>
    <rect x="14" y="6" width="14" height="20" rx="1" fill="#fff" opacity="0.15"/>
    <line x1="14" y1="11" x2="28" y2="11" stroke="white" strokeWidth="1" opacity="0.5"/>
    <line x1="14" y1="16" x2="28" y2="16" stroke="white" strokeWidth="1" opacity="0.5"/>
    <line x1="14" y1="21" x2="28" y2="21" stroke="white" strokeWidth="1" opacity="0.5"/>
    <line x1="21" y1="6"  x2="21" y2="26" stroke="white" strokeWidth="1" opacity="0.5"/>
  </svg>
);

const INITIAL = { fromDate: '', toDate: '', customerName: '', bookingBranch: '', deliveryBranch: '' };

export default function TATCalculate() {
  const [form, setForm]   = useState(INITIAL);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleShow = () => {
    if (!form.fromDate.trim()) { toast.error('From Date is required'); return; }
    if (!form.toDate.trim())   { toast.error('To Date is required');   return; }
    setSearched(true);
    setResults([]);
    toast('No records found for the selected criteria');
  };

  const handleCalculate = () => {
    if (!form.fromDate.trim()) { toast.error('From Date is required'); return; }
    if (!form.toDate.trim())   { toast.error('To Date is required');   return; }
    setSearched(true);
    setResults([]);
    toast('TAT Calculate executed');
  };

  const handleExport = () => {
    if (results.length === 0) { toast('No data to export'); return; }
    toast('Exporting to Excel…');
  };

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ───────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>TAT Calculate</h2>
        </div>
        <div className="flex-1" />
      </div>

      {/* ── Form panel ────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        {/* Row 1 */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">
              <span className="text-red-600 font-bold">* </span>From Date
            </label>
            <input name="fromDate" value={form.fromDate} onChange={set}
              placeholder="DD/MM/YYYY"
              className="border border-gray-400 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">
              <span className="text-red-600 font-bold">* </span>To Date
            </label>
            <input name="toDate" value={form.toDate} onChange={set}
              placeholder="DD/MM/YYYY"
              className="border border-gray-400 px-2 py-1 w-36 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Customer Name</label>
            <input name="customerName" value={form.customerName} onChange={set}
              className="border border-gray-400 px-2 py-1 w-48 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          <button onClick={handleShow}
            className="bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-semibold px-5 py-1.5 rounded">
            Show
          </button>

          <button onClick={handleCalculate}
            className="bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-semibold px-4 py-1.5 rounded">
            TAT Calculate
          </button>

          <button onClick={handleExport} className="ml-auto" title="Export to Excel">
            {ExcelIcon}
          </button>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Booking Branch</label>
            <input name="bookingBranch" value={form.bookingBranch} onChange={set}
              className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[13px] whitespace-nowrap">Delivery Branch</label>
            <input name="deliveryBranch" value={form.deliveryBranch} onChange={set}
              className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* ── Results area ──────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3 min-h-[180px]">
        {!searched ? (
          <div />
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-[13px]">
            No data available
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">LR No</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Booking Date</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Customer</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">From</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">To</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">TAT Days</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Actual Days</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.lrNo}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.bookingDate}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.customer}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.from}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.to}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.tatDays}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.actualDays}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
