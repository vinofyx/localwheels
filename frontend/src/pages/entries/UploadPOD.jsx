import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const btn = 'bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded';

export default function UploadPOD() {
  const [tab,        setTab]       = useState('upload');
  const [files1,     setFiles1]    = useState('');
  const [file2,      setFile2]     = useState('');
  const fileRef1 = useRef(null);
  const fileRef2 = useRef(null);

  const handleRefresh1 = () => { setFiles1(''); if (fileRef1.current) fileRef1.current.value = ''; };
  const handleRefresh2 = () => { setFile2('');  if (fileRef2.current) fileRef2.current.value = ''; };

  const TABS = [['upload','Upload POD'],['multi','Multi POD Upload'],['delivery','Multi LR Delivery']];

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* ── Title ─────────────────────────────────────────────── */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Upload POD
        </h2>
      </div>

      {/* ── Tabs card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm">

        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 last:border-r-0 ${
                tab === key ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Upload POD tab ─────────────────────────────────────── */}
        {tab === 'upload' && (
          <div className="px-4 py-3">
            <div className="flex justify-end gap-2 mb-3">
              <button onClick={() => toast('Uploaded POD')} className={btn}>Uploaded POD</button>
              <button onClick={() => toast('Pending POD')}  className={btn}>Pending POD</button>
            </div>
            <div className="min-h-[200px]" />
          </div>
        )}

        {/* ── Multi POD Upload tab ───────────────────────────────── */}
        {tab === 'multi' && (
          <div>
            {/* Controls row */}
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
              <input ref={fileRef1} type="file" multiple accept="image/*,.pdf"
                onChange={e => setFiles1(e.target.files?.length ? `${e.target.files.length} file(s)` : '')}
                className="text-[13px]" />
              <button onClick={() => toast('Show Files')}    className={btn}>Show Files</button>
              <button onClick={() => {
                if (!files1) { toast.error('Please select files'); return; }
                toast.success('Uploading POD…');
              }} className={btn}>Upload POD</button>
              <button onClick={handleRefresh1} className={btn}>Refresh</button>
              <span className="text-red-600 text-[13px] font-medium">Per POD Maximum size 3(MB) exceeded</span>
            </div>

            {/* Stats row */}
            <div className="border-b border-gray-300">
              <div className="flex items-start gap-0 px-3 py-2">
                <div className="flex-1">
                  <div className="font-bold text-[13px]">Total POD:</div>
                  <div className="text-red-500 text-[12px]">if POD already uploaded then it will be overwrite</div>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[13px]">POD Not Uploaded:</div>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[13px]">POD Already Uploaded:</div>
                  <div className="text-red-500 text-[12px]">If Delivery Pending then delivery date will be compulsory</div>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[13px]">Delivery Pending:</div>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[13px]">LR Not Link:</div>
                  <div className="text-red-500 text-[12px]">If LR Not Link then First Link LR in System</div>
                </div>
              </div>
            </div>

            {/* Gray scrollable area */}
            <div className="bg-gray-200 min-h-[220px]" />
          </div>
        )}

        {/* ── Multi LR Delivery tab ──────────────────────────────── */}
        {tab === 'delivery' && (
          <div>
            {/* Controls row */}
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
              <button onClick={() => toast('Downloading template…')}
                className="text-blue-600 underline text-[13px] hover:text-blue-800 whitespace-nowrap">
                Download Sample Excel Template
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <input ref={fileRef2} type="file" accept=".xlsx,.xls,.csv"
                  onChange={e => setFile2(e.target.files?.[0]?.name || '')}
                  className="text-[13px]" />
                <button onClick={() => toast('Show Data')}  className={btn}>Show Data</button>
                <button onClick={() => {
                  if (!file2) { toast.error('Please select a file'); return; }
                  toast.success('Saving…');
                }} className={btn}>Save</button>
                <button onClick={handleRefresh2} className={btn}>Refresh</button>
              </div>
            </div>

            {/* Gray scrollable area */}
            <div className="bg-gray-200 min-h-[220px]" />
          </div>
        )}
      </div>
    </div>
  );
}
