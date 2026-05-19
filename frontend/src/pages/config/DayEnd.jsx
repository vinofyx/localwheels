import React, { useState } from 'react';
import toast from 'react-hot-toast';

const MODULES = [
  'LR', 'MEMO', 'LHS', 'LCM', 'LDM/DRS', 'VAR', 'DELIVERY',
  'BILLING (WITH LR)', 'BILLING (WITHOUT LR)', 'MONEY RECEIPT (MR)',
  'VOUCHER ENTRY', 'HIRE VEHICLE PAYMENT', 'LR EXPENSES',
  'CUSTOMER CR/DR NOTE', 'VENDOR BILL', 'VENDOR BILL PAYMENT',
];

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function DayEnd() {
  const [date,       setDate]       = useState(today());
  const [processing, setProcessing] = useState(false);
  const [done,       setDone]       = useState(false);
  const [selected,   setSelected]   = useState(() =>
    Object.fromEntries(MODULES.map(m => [m, true]))
  );

  function toggleAll(val) {
    setSelected(Object.fromEntries(MODULES.map(m => [m, val])));
  }

  function handleProcess() {
    const chosen = MODULES.filter(m => selected[m]);
    if (!chosen.length) { toast.error('Select at least one module'); return; }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      toast.success('Day End processed successfully');
    }, 1500);
  }

  function handleReset() {
    setDone(false);
    setDate(today());
    toggleAll(true);
  }

  const allChecked  = MODULES.every(m => selected[m]);
  const noneChecked = MODULES.every(m => !selected[m]);

  return (
    <div className="min-h-screen bg-white flex flex-col text-[13px]">

      {/* ── Title ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center py-4">
        <h1 className="font-bold text-[15px] underline underline-offset-2">Day End</h1>
      </div>

      {/* ── Thick dividers ─────────────────────────────────── */}
      <div className="border-t-4 border-black" />
      <div className="border-t-2 border-black mt-0.5" />

      {/* ── Filter / Date row ──────────────────────────────── */}
      <div className="bg-[#f3f3f3] border-b border-gray-300 px-6 py-3 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700 whitespace-nowrap">Day End Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-[#0b8fd3] bg-white"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => toggleAll(!allChecked)}
            className="border border-gray-400 bg-white px-3 py-1 hover:bg-gray-100 transition-colors">
            {allChecked ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={handleProcess}
            disabled={processing || done}
            className="bg-[#0b8fd3] text-white px-5 py-1 hover:bg-[#0a7ab8] transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
            {processing && (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
            {processing ? 'Processing…' : done ? 'Processed ✓' : 'Process Day End'}
          </button>
          {done && (
            <button
              onClick={handleReset}
              className="bg-gray-500 text-white px-4 py-1 hover:bg-gray-600 transition-colors">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Module table ───────────────────────────────────── */}
      <div className="mx-6 mt-4 rounded overflow-hidden border border-gray-300 shadow-sm">

        {/* Table header */}
        <div className="bg-[#0b8fd3] text-white grid grid-cols-[40px_1fr_120px] px-3 py-2">
          <span className="text-center">#</span>
          <span className="font-bold">Module</span>
          <span className="text-center font-bold">Include</span>
        </div>

        {/* Rows */}
        {MODULES.map((mod, i) => (
          <div
            key={mod}
            className={`grid grid-cols-[40px_1fr_120px] px-3 py-1.5 border-b border-gray-200
                        ${i % 2 === 0 ? 'bg-white' : 'bg-[#f7fafd]'}
                        ${done && selected[mod] ? 'opacity-60' : ''}`}
          >
            <span className="text-gray-400 text-center">{i + 1}</span>
            <span className="text-gray-800">{mod}</span>
            <span className="text-center">
              <input
                type="checkbox"
                checked={!!selected[mod]}
                disabled={done}
                onChange={e => setSelected(p => ({ ...p, [mod]: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#0b8fd3]"
              />
            </span>
          </div>
        ))}
      </div>

      {/* ── Result banner ──────────────────────────────────── */}
      {done && (
        <div className="mx-6 mt-4 bg-green-50 border border-green-300 rounded px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700 font-medium">
            Day End for <strong>{date}</strong> completed successfully.
            {' '}({MODULES.filter(m => selected[m]).length} modules processed)
          </span>
        </div>
      )}

      <div className="pb-8" />
    </div>
  );
}
