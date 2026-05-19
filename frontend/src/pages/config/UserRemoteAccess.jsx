import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function UserRemoteAccess() {
  const [selectAll, setSelectAll] = useState(false);
  const [items]     = useState([]);          // empty — no pending approvals

  function handleActive() {
    if (!selectAll) { toast.error('Select items first'); return; }
    toast.success('Selected items activated');
  }

  return (
    <div className="min-h-screen bg-[#dce9f5] flex flex-col text-[13px]">

      {/* ── Title ───────────────────────────────────────── */}
      <div className="flex items-center justify-center py-5">
        <h1 className="font-bold text-[15px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>User Remote Access</h1>
      </div>

      {/* ── Card ────────────────────────────────────────── */}
      <div className="mx-8 bg-white rounded-lg shadow-md overflow-hidden">

        {/* Teal header */}
        <div className="bg-[#0b8fd3] px-4 py-2.5 flex items-center justify-between">
          <span className="text-white font-bold text-[13px]">Pending Approvals</span>
          <span className="text-white text-[13px]">
            Total Count:&nbsp;<strong>{items.length}</strong>
          </span>
        </div>

        {/* Body */}
        <div className="bg-[#f3f6fa] px-4 py-4 min-h-[80px] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={e => setSelectAll(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#0b8fd3]"
              />
              <span>Select All</span>
            </label>

            <button
              onClick={handleActive}
              className="bg-[#0b8fd3] text-white px-4 py-1 rounded-sm text-[13px]
                         hover:bg-[#0a7ab8] transition-colors">
              Active
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-gray-400 text-[12px] text-center py-2">
              No pending approvals
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
