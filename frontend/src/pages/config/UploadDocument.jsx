import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  '--Select--',
  'LR', 'GDM', 'LHS', 'BILL', 'BILL WITHOUT LR', 'BILL SUBMISSION',
  'VENDOR CR/DR NOTE', 'MR', 'VENDER/HIRE VEHICLE PAYMENT',
  'VOUCHER ENTRY', 'OTHER VENDOR BILL', 'DIESELENTRY',
  'EXTRA DIESEL/ADVANCE', 'TRIP SETTLEMENT/CLOSING',
];

const MAX_FILE_MB = 3;

export default function UploadDocument() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  const [docType,   setDocType]   = useState('--Select--');
  const [docSearch, setDocSearch] = useState('');
  const [docName,   setDocName]   = useState('');
  const [file,      setFile]      = useState(null);
  const [fileError, setFileError] = useState('');

  function handleSearch() {
    if (docType === '--Select--') { toast.error('Please select a Document Type'); return; }
    toast(`Searching "${docType}"…`);
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) { setFile(null); setFileError(''); return; }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`File exceeds ${MAX_FILE_MB} MB limit`);
      setFile(null);
      e.target.value = '';
      return;
    }
    setFileError('');
    setFile(f);
  }

  function handleUpload() {
    if (!docName.trim()) { toast.error('Enter Document Name'); return; }
    if (!file)            { toast.error('Choose a file to upload'); return; }
    toast.success(`"${file.name}" uploaded successfully`);
    setDocName('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Dark teal header ────────────────────────────── */}
      <div className="flex items-center px-4 py-3" style={{ backgroundColor: '#1a6070' }}>
        <div className="flex-1" />
        <h1 className="text-white font-bold text-[16px] tracking-wide">
          Upload Documents
        </h1>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#0b8fd3] text-white px-4 py-1.5 text-[13px]
                       hover:bg-[#0a7ab8] transition-colors">
            Home
          </button>
        </div>
      </div>

      {/* ── Filter card ─────────────────────────────────── */}
      <div className="mx-3 mt-3 bg-white border border-gray-200 rounded shadow-sm px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">

          {/* Document Type */}
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700 whitespace-nowrap">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="border border-gray-300 px-2 py-1.5 bg-white
                         focus:outline-none focus:border-[#0b8fd3] w-52">
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Document Search */}
          <div className="flex items-center gap-2">
            <label className="text-gray-700 whitespace-nowrap">Document Search</label>
            <input
              value={docSearch}
              onChange={e => setDocSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="border border-gray-300 px-2 py-1.5 focus:outline-none w-40"
            />
          </div>

          <button
            onClick={handleSearch}
            className="bg-[#0b8fd3] text-white px-5 py-1.5 hover:bg-[#0a7ab8] transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* ── Empty result placeholder ─────────────────────── */}
      <div className="mx-3 mt-2 bg-white border border-gray-200 rounded shadow-sm px-4 py-2 min-h-[40px]" />

      {/* ── Upload card ─────────────────────────────────── */}
      <div className="mx-3 mt-2 bg-white border border-gray-200 rounded shadow-sm px-4 py-4">
        <div className="flex items-center gap-4 flex-wrap">

          {/* * Document Name */}
          <div className="flex items-center gap-2">
            <label className="text-red-600 font-medium whitespace-nowrap">* Document Name</label>
            <input
              value={docName}
              onChange={e => setDocName(e.target.value)}
              className="border border-gray-300 px-2 py-1.5 focus:outline-none w-44"
            />
          </div>

          {/* Max size notice */}
          <span className="text-orange-500 font-medium whitespace-nowrap">
            Maximum size {MAX_FILE_MB}(MB)
          </span>

          {/* File chooser */}
          <input
            ref={fileRef}
            type="file"
            onChange={handleFileChange}
            className="text-[13px] text-gray-600"
          />

          {/* Upload button */}
          <button
            onClick={handleUpload}
            className="bg-[#0b8fd3] text-white px-5 py-1.5 hover:bg-[#0a7ab8] transition-colors">
            Upload File
          </button>
        </div>

        {/* File error */}
        {fileError && (
          <p className="text-red-500 text-[12px] mt-1.5">{fileError}</p>
        )}
      </div>

    </div>
  );
}
