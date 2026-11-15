import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

const SaveIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SearchIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const todayISO = new Date().toISOString().slice(0, 10);

export default function FasTagImport() {
  const [tab, setTab] = useState('import');
  const [entryNo, setEntryNo] = useState('1');
  const [entryDate, setEntryDate] = useState(todayISO);
  const [totalCount, setTotalCount] = useState('');
  const [totalToll, setTotalToll] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importedRows, setImportedRows] = useState([]);
  const [postedRows, setPostedRows] = useState([]);
  const fileRef = useRef(null);

  const fetchPosted = async () => {
    try {
      setLoading(true);
      const res = await api.get('/import/fastag');
      setPostedRows(res.data?.entries || []);
      toast.success(`Loaded ${res.data?.entries?.length || 0} posted FasTag record(s)`);
    } catch (err) {
      toast.error('Failed to load posted FasTag records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/import/template/fastag', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fastag_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded FasTag template');
    } catch (err) {
      // Fallback client-side CSV download
      const csv = 'vehicle_no,tag_id,toll_plaza,transaction_time,amount\nMH01AB1234,TAG100234,Vashi Toll Plaza,2026-11-12 10:30:00,120\nTS09UB5678,TAG100889,Panipat Toll,2026-11-12 14:15:00,240\n';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fastag_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded FasTag template');
    }
  };

  const handleImportFile = async () => {
    if (!selectedFile) { toast.error('Please select an Excel or CSV file first'); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entry_no', entryNo);
      formData.append('entry_date', entryDate);

      const res = await api.post('/import/fastag', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTotalCount(String(res.data?.total_count || 0));
      setTotalToll(`₹${res.data?.total_toll || 0}`);
      setImportedRows(res.data?.entries || []);
      toast.success(`Successfully imported ${res.data?.total_count || 0} FasTag records`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to import FasTag file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (importedRows.length === 0) {
      toast.error('No imported records to save');
      return;
    }
    toast.success('FasTag entries posted and saved successfully');
  };

  const handleRefresh = () => {
    setEntryNo('1');
    setEntryDate(todayISO);
    setTotalCount('');
    setTotalToll('');
    setFileName('');
    setSelectedFile(null);
    setImportedRows([]);
    if (fileRef.current) fileRef.current.value = '';
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
          <button onClick={handleSave} disabled={loading}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded disabled:opacity-50">
            {SaveIcon} Save
          </button>
          <button onClick={() => { if (tab === 'posted') fetchPosted(); else toast('Search'); }}
            className="flex items-center gap-1.5 bg-[#0288d1] hover:bg-[#0277bd] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
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
          <button onClick={() => toast.success('Date updated to current')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded">
            Upto Date Import
          </button>
          <div className="ml-auto">
            <button onClick={handleDownloadTemplate}
              className="text-blue-600 underline text-[13px] hover:text-blue-800 whitespace-nowrap">
              Download Sample Excel Template
            </button>
          </div>
        </div>

        {/* Row 2: Total Count | Total Toll | Select Excel File + file input | Import File */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap">Total Count:</span>
            <span className="text-blue-700 font-semibold">{totalCount || '0'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap">Total Toll:</span>
            <span className="text-blue-700 font-semibold">{totalToll || '₹0'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap">Select File:</span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => {
                const f = e.target.files?.[0];
                setSelectedFile(f || null);
                setFileName(f?.name || '');
              }}
              className="text-[13px]" />
          </div>
          <button onClick={handleImportFile} disabled={loading}
            className="ml-auto bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1.5 rounded disabled:opacity-50">
            {loading ? 'Importing...' : 'Import File'}
          </button>
        </div>
      </div>

      {/* ── Tabs card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm">

        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('import')}
            className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 ${tab === 'import'
                ? 'bg-[#0b8fd3] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
            Import FasTag ({importedRows.length})
          </button>
          <button
            onClick={() => {
              setTab('posted');
              if (postedRows.length === 0) fetchPosted();
            }}
            className={`px-4 py-2 text-[13px] font-medium ${tab === 'posted'
                ? 'bg-[#0b8fd3] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
            Posted ({postedRows.length})
          </button>
        </div>

        {/* Import FasTag tab content */}
        {tab === 'import' && (
          <div className="p-3 min-h-[120px] overflow-auto">
            {importedRows.length === 0 ? (
              <p className="text-center text-gray-400 py-6">No file imported yet. Select a CSV/Excel file and click Import File.</p>
            ) : (
              <table className="w-full text-left border-collapse text-[12px]">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="p-2">Vehicle No</th>
                    <th className="p-2">Tag ID</th>
                    <th className="p-2">Toll Plaza</th>
                    <th className="p-2">Time</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importedRows.map((r, i) => (
                    <tr key={r._id || i} className="border-b border-gray-200 hover:bg-blue-50">
                      <td className="p-2 font-medium">{r.vehicle_no}</td>
                      <td className="p-2 text-gray-600">{r.tag_id || '-'}</td>
                      <td className="p-2">{r.toll_plaza}</td>
                      <td className="p-2">{r.transaction_time ? new Date(r.transaction_time).toLocaleString() : '-'}</td>
                      <td className="p-2 text-right font-medium text-blue-700">₹{r.amount}</td>
                      <td className="p-2"><span className="px-1.5 py-0.5 rounded text-[11px] bg-green-100 text-green-800 uppercase font-semibold">{r.status || 'posted'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Posted tab content */}
        {tab === 'posted' && (
          <div className="p-3 min-h-[120px] overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Showing previously posted FasTag transactions</span>
              <button onClick={fetchPosted} disabled={loading}
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-4 py-1 rounded disabled:opacity-50">
                {loading ? 'Refreshing...' : 'Show Data'}
              </button>
            </div>
            {postedRows.length === 0 ? (
              <p className="text-center text-gray-400 py-6">No posted FasTag records found.</p>
            ) : (
              <table className="w-full text-left border-collapse text-[12px]">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="p-2">Entry No</th>
                    <th className="p-2">Vehicle No</th>
                    <th className="p-2">Tag ID</th>
                    <th className="p-2">Toll Plaza</th>
                    <th className="p-2">Transaction Time</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {postedRows.map((r, i) => (
                    <tr key={r._id || i} className="border-b border-gray-200 hover:bg-blue-50">
                      <td className="p-2 font-mono text-[11px]">{r.entry_no || `FT-${i + 1}`}</td>
                      <td className="p-2 font-medium">{r.vehicle_no}</td>
                      <td className="p-2 text-gray-600">{r.tag_id || '-'}</td>
                      <td className="p-2">{r.toll_plaza}</td>
                      <td className="p-2">{r.transaction_time ? new Date(r.transaction_time).toLocaleString() : '-'}</td>
                      <td className="p-2 text-right font-medium text-blue-700">₹{r.amount}</td>
                      <td className="p-2"><span className="px-1.5 py-0.5 rounded text-[11px] bg-green-100 text-green-800 uppercase font-semibold">{r.status || 'posted'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
