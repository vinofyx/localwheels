import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const IMPORT_TYPES = [
  { label: '--Select--',                value: '',                  endpoint: null },
  { label: 'Customer Master',           value: 'customers',         endpoint: '/import/customers' },
  { label: 'Supplier Master',           value: 'suppliers',         endpoint: '/import/suppliers' },
  { label: 'Vehicle Master',            value: 'vehicles',          endpoint: '/import/vehicles' },
  { label: 'Driver Master',             value: 'drivers',           endpoint: '/import/drivers' },
  { label: 'Inventory / Stock',         value: 'inventory',         endpoint: '/import/inventory',  needsBranch: true },
  { label: 'Chart of Accounts',         value: 'chart_of_accounts', endpoint: '/import/chart-of-accounts' },
  { label: 'Opening Balance',           value: 'opening_balance',   endpoint: '/import/opening-balance' },
];

const MAX_MB = 10;

function UploadIcon() {
  return (
    <svg className="w-10 h-10 text-[#0b8fd3] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

const inp = 'border border-gray-300 px-2 py-1.5 text-[13px] focus:outline-none focus:border-[#0b8fd3] bg-white rounded';

export default function ImportUtility() {
  const { branch } = useAuth();
  const [importType,   setImportType]   = useState('');
  const [file,         setFile]         = useState(null);
  const [overwrite,    setOverwrite]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [results,      setResults]      = useState(null);
  const fileRef = useRef(null);

  const selected = IMPORT_TYPES.find(t => t.value === importType);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) { toast.error(`File too large — max ${MAX_MB} MB`); e.target.value = ''; return; }
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv'].includes(ext)) { toast.error('Only .csv files are accepted'); e.target.value = ''; return; }
    setFile(f);
    setResults(null);
  }

  async function handleImport() {
    if (!importType || !selected?.endpoint) { toast.error('Select an import type'); return; }
    if (!file) { toast.error('Please choose a CSV file first'); return; }
    if (selected.needsBranch && !branch?._id) { toast.error('Please select a branch first'); return; }

    setLoading(true);
    const id = toast.loading('Importing data…', { id: 'imp' });
    try {
      const form = new FormData();
      form.append('file', file);
      if (selected.needsBranch && branch?._id) form.append('branch_id', branch._id);
      if (overwrite) form.append('overwrite', 'true');

      const { data } = await api.post(selected.endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.dismiss(id);
      setResults(data);
      if (data.inserted > 0) {
        toast.success(`Imported ${data.inserted} records successfully`);
      } else {
        toast.error(data.errors?.[0]?.error || 'No records were imported');
      }
    } catch (e) {
      toast.dismiss(id);
      toast.error(e.response?.data?.error || 'Import failed. Please check the file format.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadTemplate() {
    if (!importType) { toast.error('Select an import type first'); return; }
    try {
      const res = await api.get(`/import/template/${importType}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${importType}_template.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download template');
    }
  }

  function handleRefresh() {
    setImportType('');
    setFile(null);
    setOverwrite(false);
    setResults(null);
    if (fileRef.current) fileRef.current.value = '';
    toast('Refreshed');
  }

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
        <div className="flex-1" />
        <h1 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Import Utility</h1>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={handleImport} disabled={loading}
            className="bg-[#0b8fd3] text-white px-3 py-1.5 flex items-center gap-1.5 rounded-sm hover:bg-[#0a7ab8] transition-colors disabled:opacity-60">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            {loading ? 'Importing…' : 'Import'}
          </button>
          <button onClick={handleRefresh}
            className="bg-gray-500 text-white px-3 py-1.5 flex items-center gap-1.5 rounded-sm hover:bg-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Form card ───────────────────────────────────────── */}
      <div className="mx-6 mt-4 bg-white border border-gray-200 rounded shadow-sm">
        <div className="bg-[#0b8fd3] px-4 py-2">
          <span className="text-white font-bold text-[13px]">Import Configuration</span>
        </div>
        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Import Type */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-red-600 font-medium whitespace-nowrap w-32">* Import Type</label>
            <select value={importType} onChange={e => { setImportType(e.target.value); setResults(null); }} className={`${inp} w-64`}>
              {IMPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* File upload */}
          <div className="flex items-start gap-3 flex-wrap">
            <label className="text-red-600 font-medium whitespace-nowrap w-32 pt-1">* Choose File</label>
            <div className="flex flex-col gap-1">
              <div
                className="border-2 border-dashed border-[#0b8fd3] rounded-lg bg-[#f0f8ff] w-80 h-28 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#e6f3fb] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <UploadIcon />
                {file
                  ? <span className="text-[#0b8fd3] font-medium text-center px-2 break-all">{file.name}</span>
                  : <>
                      <span className="text-gray-500">Click to browse</span>
                      <span className="text-gray-400 text-[11px]">.csv — max {MAX_MB} MB</span>
                    </>
                }
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              {file && (
                <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-red-500 text-[11px] hover:underline self-start">
                  ✕ Remove
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-6 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} className="w-3.5 h-3.5 accent-[#0b8fd3]" />
              Skip duplicate records (by phone/registration)
            </label>
          </div>

          {/* Download template */}
          <div className="flex items-center gap-2 pt-1">
            <svg className="w-4 h-4 text-[#0b8fd3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <button onClick={downloadTemplate} className="text-[#0b8fd3] hover:underline text-[12px]">
              Download CSV Template for {selected?.label || 'selected type'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Result card ─────────────────────────────────────── */}
      {results && (
        <div className="mx-6 mt-4 bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="bg-[#0b8fd3] px-4 py-2">
            <span className="text-white font-bold text-[13px]">Import Result</span>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-8 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{results.total}</p>
                <p className="text-gray-500 text-[12px]">Total Rows</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{results.inserted ?? results.updated ?? 0}</p>
                <p className="text-gray-500 text-[12px]">{results.inserted !== undefined ? 'Inserted' : 'Updated'}</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${results.skipped > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{results.skipped}</p>
                <p className="text-gray-500 text-[12px]">Skipped</p>
              </div>
              {(results.inserted ?? results.updated) > 0 && results.skipped === 0 && (
                <div className="flex items-center gap-1.5 text-green-600 font-medium ml-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  All records imported
                </div>
              )}
            </div>
            {results.errors?.length > 0 && (
              <div className="border border-red-200 rounded bg-red-50 p-3 mt-2">
                <p className="text-red-600 font-medium text-[12px] mb-1">Errors ({results.errors.length} rows):</p>
                <ul className="text-[12px] text-red-500 space-y-0.5">
                  {results.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>Row {e.row}: {e.error}</li>
                  ))}
                  {results.errors.length > 10 && <li>…and {results.errors.length - 10} more</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Instructions ────────────────────────────────────── */}
      {!results && (
        <div className="mx-6 mt-4 bg-white border border-gray-200 rounded shadow-sm">
          <div className="bg-[#e8f4fb] px-4 py-2 border-b border-gray-200">
            <span className="text-[#0b8fd3] font-bold text-[13px]">Instructions</span>
          </div>
          <ul className="px-5 py-4 flex flex-col gap-1.5 text-gray-600 list-disc list-inside">
            <li>Select the Import Type, then click <strong>Download CSV Template</strong>.</li>
            <li>Fill in the template — do not modify the header row.</li>
            <li>Save as <strong>.csv</strong> (max {MAX_MB} MB).</li>
            <li>Upload the file and click <strong>Import</strong>.</li>
            <li>Duplicate records (matched by phone / registration number) are skipped automatically.</li>
            <li>Errors are shown per-row — fix and re-import only the failed rows.</li>
          </ul>
        </div>
      )}

      <div className="pb-8" />
    </div>
  );
}
