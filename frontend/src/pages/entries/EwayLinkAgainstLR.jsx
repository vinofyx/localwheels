import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

const PdfIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="3" fill="#e53e3e"/>
    <text x="4" y="22" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial">PDF</text>
  </svg>
);
const ExcelIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="3" fill="#217346"/>
    <text x="3" y="22" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">XLS</text>
  </svg>
);
const WordIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="3" fill="#2b579a"/>
    <text x="3" y="22" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">DOC</text>
  </svg>
);

export default function EwayLinkAgainstLR() {
  const [transporterId, setTransporterId] = useState('--Select--');
  const [tab,           setTab]           = useState('Import EWB Against LR');
  const [importFile,    setImportFile]    = useState(null);
  const [ewbNos,        setEwbNos]        = useState('');
  const fileRef = useRef(null);

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Link E-WayBill AgainstLR
        </h2>
      </div>

      {/* Transporter ID card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <div className="flex items-center gap-4">
          <label className="font-medium text-[13px] text-[#e67e00] whitespace-nowrap">Transporter ID</label>
          <select value={transporterId} onChange={e => setTransporterId(e.target.value)}
            className={`${inp} w-56`}>
            <option>--Select--</option>
            <option>ALL</option>
            <option>36AAFCL7262D1ZJ</option>
          </select>
        </div>
      </div>

      {/* Tabs + content card */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-300">
          {['Import EWB Against LR', 'Import EWB'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 text-[13px] font-medium border-r border-gray-300 last:border-r-0 ${
                tab === t
                  ? 'bg-[#0b8fd3] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Import EWB Against LR */}
        {tab === 'Import EWB Against LR' && (
          <div className="px-4 py-3" style={{ backgroundColor: '#f5f5f5' }}>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="font-medium text-[13px] whitespace-nowrap">Select Import File</label>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
                onChange={e => setImportFile(e.target.files[0])}
                className="text-[13px]" />
              <button onClick={() => toast('Showing data…')}
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
                Show Data
              </button>
              <button onClick={() => toast('Linking EwayBill…')}
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
                Link EwayBill
              </button>
              <button onClick={() => { setImportFile(null); if (fileRef.current) fileRef.current.value = ''; toast('Refreshed'); }}
                className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
                Refresh
              </button>
              <button onClick={() => toast('Downloading template…')}
                className="text-blue-600 hover:underline text-[13px] font-medium">
                Download Sample Excel Template
              </button>
            </div>
            <div className="mt-2 min-h-[200px] bg-white border border-gray-200" />
          </div>
        )}

        {/* Import EWB */}
        {tab === 'Import EWB' && (
          <div className="px-4 py-3 min-h-[280px]">
            <button onClick={() => toast('Importing EwayBill…')}
              className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded mb-2">
              Import EwayBill
            </button>
            <textarea
              value={ewbNos}
              onChange={e => setEwbNos(e.target.value)}
              placeholder="Enter E-Way Bill numbers..."
              className="w-48 border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400 resize-none"
              rows={10}
            />
          </div>
        )}
      </div>
    </div>
  );
}
