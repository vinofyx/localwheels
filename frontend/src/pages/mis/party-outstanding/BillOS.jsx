import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-1.5 py-1 text-[13px] focus:outline-none focus:border-blue-400 w-full bg-white';
const lbl = 'font-medium text-[13px] whitespace-nowrap';

const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
const defaultFrom = '01/04/2010';
const defaultTo   = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).split('/').join('/');

export default function BillOS() {
  const [partyMode,      setPartyMode]      = useState('specific'); // 'specific' | 'all'
  const [selectParty,    setSelectParty]    = useState('');
  const [fromDate,       setFromDate]       = useState(defaultFrom);
  const [toDate,         setToDate]         = useState(defaultTo);
  const [receivedUpto,   setReceivedUpto]   = useState('');
  const [showBy,         setShowBy]         = useState('Outstanding Bills');
  const [billingBranch,  setBillingBranch]  = useState('');
  const [recoveryBranch, setRecoveryBranch] = useState('');
  const [display,        setDisplay]        = useState('Bill Wise');
  const [aging,          setAging]          = useState('YES');
  const [agingOnDate,    setAgingOnDate]    = useState('Bill Date');
  const [mailParty,      setMailParty]      = useState('');
  const [emailId,        setEmailId]        = useState('');

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>
      <div className="text-center mb-2">
        <h2 className="font-bold text-[15px] underline">Bill O/S</h2>
      </div>

      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2">
        {/* Party mode tabs + filter row */}
        <div className="flex items-start gap-3 mb-2">
          {/* Tab buttons */}
          <div className="flex flex-col border border-gray-300 rounded overflow-hidden text-[12px] flex-shrink-0 mt-4">
            <button
              onClick={() => setPartyMode('specific')}
              className={`px-3 py-1 font-medium ${partyMode === 'specific' ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Specific Party
            </button>
            <button
              onClick={() => setPartyMode('all')}
              className={`px-3 py-1 font-medium border-t border-gray-300 ${partyMode === 'all' ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              All Parties
            </button>
          </div>

          {/* Filter grid */}
          <div className="flex-1">
            {/* Row 1 */}
            <div className="grid grid-cols-6 gap-x-3 gap-y-1.5 items-end mb-2">
              <div>
                <div className="mb-0.5"><span className={lbl}>Select Party</span></div>
                <input
                  value={selectParty}
                  onChange={e => setSelectParty(e.target.value)}
                  disabled={partyMode === 'all'}
                  className={`${inp} ${partyMode === 'all' ? 'bg-gray-100 text-gray-400' : ''}`}
                />
              </div>
              <div>
                <div className="mb-0.5"><span className={lbl}>From Date</span></div>
                <input value={fromDate} onChange={e => setFromDate(e.target.value)} className={inp} />
              </div>
              <div>
                <div className="mb-0.5"><span className={lbl}>To Date</span></div>
                <input value={toDate} onChange={e => setToDate(e.target.value)} className={inp} />
              </div>
              <div>
                <div className="mb-0.5"><span className={lbl}>Received Upto Date</span></div>
                <input value={receivedUpto} onChange={e => setReceivedUpto(e.target.value)} className={inp} />
              </div>
              <div>
                <div className="mb-0.5"><span className={lbl}>Show By</span></div>
                <select value={showBy} onChange={e => setShowBy(e.target.value)} className={inp}>
                  <option>Outstanding Bills</option>
                  <option>All Bills</option>
                  <option>Outstanding (Singleline)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => toast('Showing…')}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded w-full"
                >
                  Show
                </button>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-6 gap-x-3 gap-y-1.5 items-end">
              <div>
                <div className="mb-0.5"><span className={lbl}>Billing Branch</span></div>
                <input value={billingBranch} onChange={e => setBillingBranch(e.target.value)} className={inp} />
              </div>
              <div>
                <div className="mb-0.5"><span className={lbl}>Recovery Branch</span></div>
                <input value={recoveryBranch} onChange={e => setRecoveryBranch(e.target.value)} className={inp} />
              </div>
              <div>
                <div className="mb-0.5"><span className={lbl}>Display</span></div>
                <select value={display} onChange={e => setDisplay(e.target.value)} className={inp}>
                  <option>Bill Wise</option>                  
                  <option>Summary</option>
                </select>
              </div>
              <div>
                <div className="mb-0.5"><span className={lbl}>Aging</span></div>
                <select value={aging} onChange={e => setAging(e.target.value)} className={inp}>
                  <option>YES</option>
                  <option>NO</option>
                </select>
              </div>
              <div>
                <div className="mb-0.5"><span className={lbl}>Aging on Date</span></div>
                <select value={agingOnDate} onChange={e => setAgingOnDate(e.target.value)} className={inp}>
                  <option>Bill Date</option>
                  <option>Submit Date</option>
                                  </select>
              </div>
            </div>
          </div>
        </div>

        {/* Mail row */}
        <div className="border-t border-gray-200 pt-2 flex items-center gap-3 flex-wrap">
          <label className={lbl}>Mail Send Party</label>
          <input
            value={mailParty}
            onChange={e => setMailParty(e.target.value)}
            className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none w-44"
          />
          <label className={lbl}>Email ID</label>
          <input
            value={emailId}
            onChange={e => setEmailId(e.target.value)}
            className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none w-52"
          />
          <button
            onClick={() => toast('Sending mail…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded"
          >
            SendMail
          </button>
          <span className="text-red-600 text-[12px] font-medium">Multiple mail ids separated by commas</span>
        </div>
      </div>

      {/* Results area */}
      <div className="bg-white rounded shadow-sm min-h-[40px]" />
    </div>
  );
}
