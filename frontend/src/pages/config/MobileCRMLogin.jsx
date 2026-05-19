import React, { useState } from 'react';
import toast from 'react-hot-toast';

const USER_TYPES = ['Customer', 'Vendor', 'Driver'];

const inp = 'border border-gray-300 px-2 py-1.5 text-[13px] focus:outline-none ' +
            'focus:border-[#0b8fd3] bg-white';

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

export default function MobileCRMLogin() {
  const [userType,    setUserType]    = useState('Customer');
  const [userName,    setUserName]    = useState('');
  const [password,    setPassword]    = useState('');
  const [linkParty,   setLinkParty]   = useState('');
  const [activePortal,setActivePortal]= useState(true);
  const [activeMobile,setActiveMobile]= useState(false);
  const [contactPerson,setContactPerson] = useState('');
  const [contactNo,   setContactNo]   = useState('');
  const [mailId,      setMailId]      = useState('');
  const [activeReqMail, setActiveReqMail] = useState(false);
  const [allowMobileBooking, setAllowMobileBooking] = useState(false);
  const [assignedBranch, setAssignedBranch] = useState('');
  const [linkSubParty, setLinkSubParty] = useState('');
  const [subParties,  setSubParties]  = useState([]);

  function handleSave() {
    if (!password.trim()) { toast.error('Password is required'); return; }
    if (!linkParty.trim()) { toast.error('Link Party Name is required'); return; }
    toast.success('Saved successfully');
  }
  function handleRefresh() {
    setUserType('Customer'); setUserName(''); setPassword(''); setLinkParty('');
    setActivePortal(true); setActiveMobile(false); setContactPerson('');
    setContactNo(''); setMailId(''); setActiveReqMail(false);
    setAllowMobileBooking(false); setAssignedBranch('');
    setLinkSubParty(''); setSubParties([]);
    toast('Refreshed');
  }
  function handleAddSubParty() {
    if (!linkSubParty.trim()) return;
    setSubParties(p => [...p, linkSubParty.trim()]);
    setLinkSubParty('');
  }

  const sectionLabel = userType.toUpperCase() + ' LOGIN';

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Action bar ──────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
        <div className="flex-1" />
        <h1 className="font-bold text-[15px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>Mobile/CRM Login</h1>
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

      {/* ── User Type + User Name row ───────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-red-600 font-medium whitespace-nowrap">* User Type</label>
            <select value={userType} onChange={e => setUserType(e.target.value)}
              className={`${inp} w-44`}>
              {USER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-gray-700 whitespace-nowrap">User Name</label>
            <input value={userName} onChange={e => setUserName(e.target.value)}
              className={`${inp} flex-1`} />
          </div>
        </div>
      </div>

      {/* ── Section header bar ──────────────────────────── */}
      <div className="bg-[#0b8fd3] px-4 py-2">
        <span className="text-white font-bold text-[13px]">{sectionLabel}</span>
      </div>

      {/* ── Form fields ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 px-4 py-4 flex flex-col gap-4">

        {/* Row 1 */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-red-600 font-medium w-24 whitespace-nowrap">* Password</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              className={`${inp} w-44`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-red-600 font-medium whitespace-nowrap">* Link Party Name</label>
            <input value={linkParty} onChange={e => setLinkParty(e.target.value)}
              className={`${inp} w-44`} />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={activePortal}
              onChange={e => setActivePortal(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#0b8fd3]" />
            Active (Portal)
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={activeMobile}
              onChange={e => setActiveMobile(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#0b8fd3]" />
            Active (Mobile App)
          </label>
        </div>

        {/* Row 2 */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-gray-700 w-24 whitespace-nowrap">Contact Person</label>
            <input value={contactPerson} onChange={e => setContactPerson(e.target.value)}
              className={`${inp} w-44`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-700 whitespace-nowrap">Contact No.</label>
            <input value={contactNo} onChange={e => setContactNo(e.target.value)}
              className={`${inp} w-44`} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-700 whitespace-nowrap">Mail ID</label>
            <input value={mailId} onChange={e => setMailId(e.target.value)}
              className={`${inp} w-44`} />
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex items-center gap-8 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={activeReqMail}
              onChange={e => setActiveReqMail(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#0b8fd3]" />
            Active Request Mail
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={allowMobileBooking}
              onChange={e => setAllowMobileBooking(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#0b8fd3]" />
            Allow Mobile Booking
          </label>
          <div className="flex items-center gap-2">
            <label className="text-gray-700 whitespace-nowrap">Assigned Branch</label>
            <input value={assignedBranch} onChange={e => setAssignedBranch(e.target.value)}
              className={`${inp} w-44`} />
          </div>
        </div>

        {/* Link Sub Party */}
        <div className="flex flex-col gap-2">
          <label className="text-[#0b8fd3] font-medium">Link Sub Party</label>
          <div className="flex items-center gap-2">
            <input
              value={linkSubParty}
              onChange={e => setLinkSubParty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubParty()}
              className={`${inp} flex-1`}
            />
            <button onClick={handleAddSubParty}
              className="bg-[#0b8fd3] text-white px-5 py-1.5 hover:bg-[#0a7ab8] transition-colors">
              Add
            </button>
          </div>
          {subParties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {subParties.map((p, i) => (
                <span key={i}
                  className="bg-blue-50 border border-blue-200 text-blue-700
                             px-2 py-0.5 rounded text-[12px]">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
