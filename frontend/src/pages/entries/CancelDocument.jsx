import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';

export default function CancelDocument() {
  const [docType,    setDocType]    = useState('LR');
  const [docSearch,  setDocSearch]  = useState('');
  const [cancelRemark, setCancelRemark] = useState('');

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>

      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Cancel Document
        </h2>
      </div>

      {/* Filter card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className={`${inp} w-40`}>
              <option>LR</option>
              <option>BILL AGAINST LR</option>
              <option>BILL WITHOUT LR</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Document Search</label>
            <input value={docSearch} onChange={e => setDocSearch(e.target.value)}
              className={`${inp} w-40`} />
          </div>
          <button onClick={() => toast('Searching…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Search
          </button>
          <button onClick={() => { setDocSearch(''); setCancelRemark(''); toast('Refreshed'); }}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
            Refresh
          </button>
          <div className="flex items-center gap-2">
            <label className="font-medium text-[13px] whitespace-nowrap">Cancellation Remark</label>
            <input value={cancelRemark} onChange={e => setCancelRemark(e.target.value)}
              className={`${inp} w-40`} />
          </div>
        </div>
      </div>

      {/* Empty results area */}
      <div className="bg-white rounded shadow-sm min-h-[200px]" />
    </div>
  );
}
