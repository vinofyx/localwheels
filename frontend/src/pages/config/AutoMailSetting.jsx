import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1.5 text-[13px] focus:outline-none ' +
            'focus:border-[#0b8fd3] bg-white';

const inpDisabled = 'border border-gray-200 px-2 py-1.5 text-[13px] bg-[#e9e9e9] ' +
                    'text-gray-400 cursor-not-allowed';

function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

export default function AutoMailSetting() {
  const [customerName,         setCustomerName]         = useState('');
  const [outstandingMail,      setOutstandingMail]      = useState(false);
  const [outstandingMailAddr,  setOutstandingMailAddr]  = useState('');
  const [outstandingDays,      setOutstandingDays]      = useState('');
  const [misMail,              setMisMail]              = useState(false);
  const [misMailAddr,          setMisMailAddr]          = useState('');
  const [misDays,              setMisDays]              = useState('');
  const [linkSubParty,         setLinkSubParty]         = useState('');
  const [subParties,           setSubParties]           = useState([]);

  function handleSave() {
    if (!customerName.trim()) { toast.error('Customer Name is required'); return; }
    toast.success('Auto Mail Setting saved');
  }

  function handleRefresh() {
    setCustomerName(''); setOutstandingMail(false); setOutstandingMailAddr('');
    setOutstandingDays(''); setMisMail(false); setMisMailAddr(''); setMisDays('');
    setLinkSubParty(''); setSubParties([]);
    toast('Refreshed');
  }

  function handleAdd() {
    if (!linkSubParty.trim()) return;
    setSubParties(p => [...p, linkSubParty.trim()]);
    setLinkSubParty('');
  }

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
        <div className="flex-1" />
        <h1 className="font-bold text-[15px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>Auto Mail Setting</h1>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={handleSave}
            className="bg-[#0b8fd3] text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-[#0a7ab8] transition-colors">
            <SaveIcon /> Save
          </button>
          <button onClick={() => toast('Searching…')}
            className="bg-[#0b8fd3] text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-[#0a7ab8] transition-colors">
            <SearchIcon /> Search
          </button>
          <button onClick={handleRefresh}
            className="bg-gray-500 text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-gray-600 transition-colors">
            <RefreshIcon /> Refersh
          </button>
        </div>
      </div>

      {/* ── Form card ───────────────────────────────────────── */}
      <div className="mx-6 mt-4 bg-white rounded border border-gray-200 shadow-sm">
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Customer Name */}
          <div className="flex items-center gap-4">
            <label className="text-gray-700 w-36 whitespace-nowrap">Customer Name</label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className={`${inp} w-80`}
            />
          </div>

          {/* Outstanding Mail row */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* left: checkbox + mail input */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer w-36">
                <input
                  type="checkbox"
                  checked={outstandingMail}
                  onChange={e => setOutstandingMail(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0b8fd3]"
                />
                <span className="text-gray-700">Outstanding Mail</span>
              </label>
              <input
                value={outstandingMailAddr}
                onChange={e => setOutstandingMailAddr(e.target.value)}
                disabled={!outstandingMail}
                placeholder={outstandingMail ? 'Email address…' : ''}
                className={`w-80 ${outstandingMail ? inp : inpDisabled}`}
              />
            </div>
            {/* right: schedule days */}
            <div className="flex items-center gap-2 ml-8">
              <label className="text-gray-700 whitespace-nowrap">Outstanding Schedule Days</label>
              <input
                type="number"
                value={outstandingDays}
                onChange={e => setOutstandingDays(e.target.value)}
                disabled={!outstandingMail}
                className={`w-40 ${outstandingMail ? inp : inpDisabled}`}
              />
            </div>
          </div>

          {/* MIS Report Mail row */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* left: checkbox + mail input */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer w-36">
                <input
                  type="checkbox"
                  checked={misMail}
                  onChange={e => setMisMail(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0b8fd3]"
                />
                <span className="text-gray-700">MIS Report Mail</span>
              </label>
              <input
                value={misMailAddr}
                onChange={e => setMisMailAddr(e.target.value)}
                disabled={!misMail}
                placeholder={misMail ? 'Email address…' : ''}
                className={`w-80 ${misMail ? inp : inpDisabled}`}
              />
            </div>
            {/* right: schedule days */}
            <div className="flex items-center gap-2 ml-8">
              <label className="text-gray-700 whitespace-nowrap">MIS Schedule Days</label>
              <input
                type="number"
                value={misDays}
                onChange={e => setMisDays(e.target.value)}
                disabled={!misMail}
                className={`w-40 ${misMail ? inp : inpDisabled}`}
              />
            </div>
          </div>

          {/* Link Sub Party */}
          <div className="flex items-center gap-4">
            <label className="text-gray-700 w-36 whitespace-nowrap">Link Sub Party</label>
            <input
              value={linkSubParty}
              onChange={e => setLinkSubParty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className={`${inp} w-80`}
            />
            <button
              onClick={handleAdd}
              className="bg-[#0b8fd3] text-white px-5 py-1.5 rounded-sm
                         hover:bg-[#0a7ab8] transition-colors">
              Add
            </button>
          </div>

          {/* Sub-party chips */}
          {subParties.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-40">
              {subParties.map((p, i) => (
                <span key={i}
                  className="bg-blue-50 border border-blue-200 text-blue-700
                             px-2 py-0.5 rounded text-[12px] flex items-center gap-1">
                  {p}
                  <button
                    onClick={() => setSubParties(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-blue-400 hover:text-red-500 leading-none">×</button>
                </span>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Empty results bar ───────────────────────────────── */}
      <div className="mx-6 mt-3 bg-white border border-gray-200 rounded h-8 shadow-sm" />

      <div className="pb-8" />
    </div>
  );
}
