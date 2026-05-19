import React, { useState } from 'react';
import toast from 'react-hot-toast';

/* ── helpers ─────────────────────────────────────────────────── */
function todayDMY() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* ── sort icon ────────────────────────────────────────────────── */
function SortIcon() {
  return (
    <svg className="w-3 h-3 inline ml-0.5 opacity-75" viewBox="0 0 24 24"
      fill="currentColor">
      <path d="M12 5l-7 7h14L12 5zm0 14l7-7H5l7 7z" />
    </svg>
  );
}

/* ── column definitions ──────────────────────────────────────── */
const COLUMNS = [
  { key: 'trackLR',        label: 'Track LR',        sort: false },
  { key: 'assignBranch',   label: 'Assign Branch',   sort: true  },
  { key: 'complaintDate',  label: 'Complaint Date',  sort: true  },
  { key: 'complaintNo',    label: 'Complaint No',    sort: true  },
  { key: 'lrNo',           label: 'LR No',           sort: true  },
  { key: 'from',           label: 'From',            sort: true  },
  { key: 'to',             label: 'To',              sort: true  },
  { key: 'complaintBy',    label: 'Complaint By',    sort: true  },
  { key: 'contactNo',      label: 'Contact No',      sort: true  },
  { key: 'email',          label: 'Email',           sort: true  },
  { key: 'priority',       label: 'Priority',        sort: true  },
  { key: 'complaintType',  label: 'Complaint Type',  sort: true  },
  { key: 'description',    label: 'Description',     sort: true  },
];

/* ── export icon buttons ─────────────────────────────────────── */
function ExportButtons() {
  return (
    <div className="flex items-center gap-1">
      <button title="Export PDF"
        onClick={() => toast('Exporting PDF…')}
        className="w-8 h-7 flex items-center justify-center rounded-sm border border-red-600
                   bg-white hover:bg-red-50 transition-colors">
        <span className="text-[10px] font-bold text-red-600 leading-none">PDF</span>
      </button>
      <button title="Export Excel"
        onClick={() => toast('Exporting Excel…')}
        className="w-8 h-7 flex items-center justify-center rounded-sm border border-green-600
                   bg-white hover:bg-green-50 transition-colors">
        <span className="text-[10px] font-bold text-green-600 leading-none">XLS</span>
      </button>
      <button title="Export Word"
        onClick={() => toast('Exporting Word…')}
        className="w-8 h-7 flex items-center justify-center rounded-sm border border-blue-700
                   bg-white hover:bg-blue-50 transition-colors">
        <span className="text-[10px] font-bold text-blue-700 leading-none">DOC</span>
      </button>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────── */
export default function ComplaintRegister() {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'closed'
  const [fromDate,  setFromDate]  = useState(todayDMY());
  const [toDate,    setToDate]    = useState(todayDMY());
  const [rows]                    = useState([]);           // empty — no data

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Title + action button ────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
        <div className="flex-1" />
        <h1 className="font-bold text-[15px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>Complaint Register</h1>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => toast.success('Mail sent successfully')}
            className="bg-[#0b8fd3] text-white px-4 py-1.5 rounded-sm
                       hover:bg-[#0a7ab8] transition-colors text-[13px]">
            Update And Send Mail
          </button>
        </div>
      </div>

      {/* ── Card ────────────────────────────────────────────── */}
      <div className="mx-6 mt-4 bg-white rounded border border-gray-200 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-5 py-2 text-[13px] font-medium border-r border-gray-200 transition-colors
                        ${activeTab === 'customer'
                          ? 'bg-[#0b8fd3] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            Customer Complaint
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-5 py-2 text-[13px] font-medium transition-colors
                        ${activeTab === 'closed'
                          ? 'bg-[#0b8fd3] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            Closed Complaint
          </button>
        </div>

        {/* ── Customer Complaint tab ───────────────────────── */}
        {activeTab === 'customer' && (
          <div>
            {/* Total count row */}
            <div className="px-4 py-2 border-b border-gray-200">
              <span className="font-bold text-gray-700">
                Total Count&nbsp;
                <span className="font-normal text-gray-500">{rows.length}</span>
              </span>
            </div>

            {/* Scrollable table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#0b8fd3] text-white text-[12px]">
                    {COLUMNS.map(col => (
                      <th key={col.key}
                        className="px-3 py-2 whitespace-nowrap text-left font-semibold
                                   border-r border-[#0a7ab8] last:border-r-0">
                        {col.label}
                        {col.sort && <SortIcon />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length}
                        className="text-center text-gray-400 py-5 text-[12px]">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7fafd]'}>
                        {COLUMNS.map(col => (
                          <td key={col.key} className="px-3 py-1.5 whitespace-nowrap border-b border-gray-100">
                            {row[col.key] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Closed Complaint tab ─────────────────────────── */}
        {activeTab === 'closed' && (
          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Filter row */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-gray-700 whitespace-nowrap">From Date</label>
                <input
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="border border-gray-300 px-2 py-1.5 text-[13px]
                             focus:outline-none focus:border-[#0b8fd3] bg-white w-36"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-700 whitespace-nowrap">To Date</label>
                <input
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="border border-gray-300 px-2 py-1.5 text-[13px]
                             focus:outline-none focus:border-[#0b8fd3] bg-white w-36"
                />
              </div>
              <button
                onClick={() => toast(`Showing closed complaints: ${fromDate} – ${toDate}`)}
                className="bg-[#0b8fd3] text-white px-5 py-1.5 rounded-sm
                           hover:bg-[#0a7ab8] transition-colors">
                Show
              </button>
              <div className="ml-auto">
                <ExportButtons />
              </div>
            </div>

            {/* Empty result area */}
            <div className="text-gray-400 text-[12px] text-center py-8">
              No records to display. Select a date range and click Show.
            </div>
          </div>
        )}
      </div>

      <div className="pb-8" />
    </div>
  );
}
