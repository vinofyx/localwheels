import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const IMPORT_TYPES = [
  '--Select--',
  'LR (Lorry Receipt)',
  'Memo (Manifest)',
  'Party Master (Customer)',
  'Party Master (Vendor)',
  'Vehicle Master',
  'Driver Master',
  'Route Master',
  'Location Master',
  'Opening Bills',
  'Money Receipt (MR)',
  'Hire Vehicle Payment',
  'Voucher Entry',
  'LR Expenses',
  'Customer CR/DR Note',
];

const MAX_MB = 5;

function UploadIcon() {
  return (
    <svg className="w-10 h-10 text-[#0b8fd3] opacity-60" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

const inp = 'border border-gray-300 px-2 py-1.5 text-[13px] focus:outline-none ' +
            'focus:border-[#0b8fd3] bg-white';

export default function ImportUtility() {
  const [importType,   setImportType]   = useState('--Select--');
  const [file,         setFile]         = useState(null);
  const [overwrite,    setOverwrite]    = useState(false);
  const [results,      setResults]      = useState(null);   // null | { success, failed, rows }
  const fileRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large — max ${MAX_MB} MB`);
      e.target.value = '';
      return;
    }
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx', 'csv'].includes(ext)) {
      toast.error('Only .xls / .xlsx / .csv files are accepted');
      e.target.value = '';
      return;
    }
    setFile(f);
    setResults(null);
  }

  function handleImport() {
    if (importType === '--Select--') { toast.error('Select an import type'); return; }
    if (!file) { toast.error('Please choose a file first'); return; }
    toast.loading('Importing…', { id: 'imp' });
    setTimeout(() => {
      toast.dismiss('imp');
      // CSV import processing — results will be returned by the server in production
      toast.error('CSV import requires a live backend integration. Please contact support to import data.');
      setResults(null);
    }, 1800);
  }

  function handleRefresh() {
    setImportType('--Select--');
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
        <h1 className="font-bold text-[15px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>Import Utility</h1>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={handleImport}
            className="bg-[#0b8fd3] text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-[#0a7ab8] transition-colors">
            <SaveIcon /> Import
          </button>
          <button onClick={handleRefresh}
            className="bg-gray-500 text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-gray-600 transition-colors">
            <RefreshIcon /> Refersh
          </button>
        </div>
      </div>

      {/* ── Form card ───────────────────────────────────────── */}
      <div className="mx-6 mt-4 bg-white border border-gray-200 rounded shadow-sm">

        {/* Card header */}
        <div className="bg-[#0b8fd3] px-4 py-2">
          <span className="text-white font-bold text-[13px]">Import Configuration</span>
        </div>

        {/* Fields */}
        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Row 1 – Import Type */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-red-600 font-medium whitespace-nowrap w-32">
              * Import Type
            </label>
            <select
              value={importType}
              onChange={e => setImportType(e.target.value)}
              className={`${inp} w-64`}
            >
              {IMPORT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Row 2 – File */}
          <div className="flex items-start gap-3 flex-wrap">
            <label className="text-red-600 font-medium whitespace-nowrap w-32 pt-1">
              * Choose File
            </label>
            <div className="flex flex-col gap-1">
              <div
                className="border-2 border-dashed border-[#0b8fd3] rounded-lg bg-[#f0f8ff]
                           w-80 h-28 flex flex-col items-center justify-center gap-2 cursor-pointer
                           hover:bg-[#e6f3fb] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <UploadIcon />
                {file
                  ? <span className="text-[#0b8fd3] font-medium text-center px-2 break-all">{file.name}</span>
                  : <>
                      <span className="text-gray-500">Click to browse</span>
                      <span className="text-gray-400 text-[11px]">.xls / .xlsx / .csv — max {MAX_MB} MB</span>
                    </>
                }
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                onChange={handleFile}
                className="hidden"
              />
              {file && (
                <button
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-red-500 text-[11px] hover:underline self-start">
                  ✕ Remove
                </button>
              )}
            </div>
          </div>

          {/* Row 3 – Options */}
          <div className="flex items-center gap-6 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={e => setOverwrite(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#0b8fd3]"
              />
              Overwrite existing records
            </label>
          </div>

          {/* Download template link */}
          <div className="flex items-center gap-2 pt-1">
            <svg className="w-4 h-4 text-[#0b8fd3]" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <button
              onClick={() => toast('Template download started…')}
              className="text-[#0b8fd3] hover:underline text-[12px]">
              Download Import Template (.xlsx)
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
          <div className="px-5 py-4 flex items-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{results.rows}</p>
              <p className="text-gray-500 text-[12px]">Total Rows</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{results.success}</p>
              <p className="text-gray-500 text-[12px]">Success</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${results.failed > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                {results.failed}
              </p>
              <p className="text-gray-500 text-[12px]">Failed</p>
            </div>
            {results.failed === 0 && (
              <div className="flex items-center gap-1.5 text-green-600 font-medium ml-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                All records imported successfully
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
            <li>Download the import template for the selected import type.</li>
            <li>Fill in the data in the template without modifying headers.</li>
            <li>Save the file as <strong>.xlsx</strong> or <strong>.csv</strong> (max {MAX_MB} MB).</li>
            <li>Select the Import Type, choose the file, then click <strong>Import</strong>.</li>
            <li>Enable <em>Overwrite existing records</em> to update records that already exist.</li>
          </ul>
        </div>
      )}

      <div className="pb-8" />
    </div>
  );
}
