import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const EditIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const SortIcon    = <svg className="w-3 h-3 inline-block ml-1 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5H7zm0 4l5 5 5-5H7z"/></svg>;

const DRIVER_TYPES = ['Driver1', 'Driver2', 'Kinner'];

const INITIAL_VEHICLE = { vehicleNo: '' };
const INITIAL_DETAIL  = { driverType: 'Driver1', driverName: '', effectiveDate: '' };

export default function DriverMapping() {
  const [vehicleNo, setVehicleNo]     = useState('');
  const [detail, setDetail]           = useState(INITIAL_DETAIL);
  const [rows, setRows]               = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [perPage, setPerPage]         = useState(10);
  const [page, setPage]               = useState(1);

  const setD = e => setDetail(d => ({ ...d, [e.target.name]: e.target.value }));

  const handleAdd = () => {
    if (!vehicleNo.trim())           { toast.error('Vehicle No is required');     return; }
    if (!detail.driverName.trim())   { toast.error('Driver Name is required');    return; }
    if (!detail.effectiveDate.trim()) { toast.error('Effective Date is required'); return; }
    setRows(r => [...r, {
      id: Date.now(),
      vehicleNo: vehicleNo.trim(),
      driverType: detail.driverType,
      driverName: detail.driverName.trim(),
      effectiveDate: detail.effectiveDate,
      status: 'Active',
    }]);
    setDetail(INITIAL_DETAIL);
    toast.success('Added successfully');
  };

  const handleEdit = id => {
    const row = rows.find(r => r.id === id);
    if (row) {
      setVehicleNo(row.vehicleNo);
      setDetail({ driverType: row.driverType, driverName: row.driverName, effectiveDate: row.effectiveDate });
      toast.success('Loaded for editing');
    }
  };

  const handleRefresh = () => {
    setVehicleNo('');
    setDetail(INITIAL_DETAIL);
    setGlobalSearch('');
    setPage(1);
  };

  const filtered = rows.filter(r =>
    [r.vehicleNo, r.driverType, r.driverName, r.effectiveDate, r.status]
      .join(' ').toLowerCase().includes(globalSearch.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const sliced     = filtered.slice((page - 1) * perPage, page * perPage);
  const from       = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to         = Math.min(page * perPage, filtered.length);

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Driver Mapping</h2>
        </div>
        <div className="flex gap-1.5">
          <button
            className="flex items-center gap-1.5 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
        </div>
      </div>

      {/* ── Vehicle No panel ─────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-4 mb-2">
        <div className="flex items-center gap-2">
          <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Vehicle No</label>
          <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)}
            className="border border-gray-300 px-2 py-1 w-56 text-[13px] focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* ── Driver Details panel ─────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-4 mb-2">
        <p className="font-semibold text-[13px] mb-3">Driver Details:-</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Driver Type</label>
            <select name="driverType" value={detail.driverType} onChange={setD}
              className="border border-gray-400 px-2 py-1 w-44 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {DRIVER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Driver Name</label>
            <input name="driverName" value={detail.driverName} onChange={setD}
              className="border border-gray-300 px-2 py-1 w-52 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap"><span className="text-red-600">* </span>Effective Date</label>
            <input name="effectiveDate" value={detail.effectiveDate} onChange={setD} type="date"
              className="border border-gray-300 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <button onClick={handleAdd}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Add
          </button>
        </div>
      </div>

      {/* ── Table panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">

        {/* Show entries + Search */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[13px]">
            <span>Show</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="border border-gray-300 px-1 py-0.5 text-[13px] bg-white">
              {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-gray-600">Search:</span>
            <input value={globalSearch} onChange={e => { setGlobalSearch(e.target.value); setPage(1); }}
              className="border border-gray-300 px-2 py-0.5 text-[13px] w-44 focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[20%]">Vehicle No {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[15%]">Driver Type {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[25%]">Driver Name {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[20%]">Effective Date {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[12%]">Status {SortIcon}</th>
                <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8] w-[8%]">Edit {SortIcon}</th>
              </tr>
            </thead>
            <tbody>
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500 border border-gray-200">
                    No data available in table
                  </td>
                </tr>
              ) : (
                sliced.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0] font-medium">{row.vehicleNo}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.driverType}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.driverName}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200">{row.effectiveDate}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-green-600 font-medium">{row.status}</td>
                    <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                      <button onClick={() => handleEdit(row.id)} className="text-gray-600 hover:text-blue-600">{EditIcon}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-2 text-[12px] text-gray-600">
          <span>
            Showing <span className="text-gray-800 font-medium">{from}</span> to{' '}
            <span className="text-gray-800 font-medium">{to}</span> of{' '}
            <span className="text-gray-800 font-medium">{filtered.length}</span> entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 border rounded ${p === page ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'border-gray-300 hover:bg-gray-100'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
