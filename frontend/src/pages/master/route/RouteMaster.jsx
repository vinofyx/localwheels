import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const ROUTE_TYPES    = ['Branch To Branch(Linehaul)', 'Direct Delivery', 'Local Delivery(DRS)', 'PickUp', 'Branch To Branch(Feeder)', 'Travel'];
const TABS           = ['Route Branch/Location', 'Link Sub Branch', 'Route Expenses', 'Import Route'];
const INITIAL_FORM   = { routeType: 'Branch To Branch(Linehaul)', sourceBranch: '', routeName: '', routeKm: '', transitTimeHrs: '', vehicleOutTimeHrs: '' };
const INITIAL_BRANCH = { routeBranch: '', km: '', transitTime: '' };
const LOAD_TYPES     = ['--Select--', 'LCV', 'HCV', 'LCV-L'];

const ROUTE_EXPENSES = [
  '2ND ATTEMPT CHARGES',
  'APPOINTMENT DELIVERY CHARGES', 
  'DRIVER FOODING EXPENSE CHARGES',
  'DRIVER UNLOADING CHARGES',
  'DRIVER-LOADING CHARGES',
  'HELPER FOODING EXPENSE CHARGES'
];

const INITIAL_EXPENSES = {
  routeName: '',
  loadType: '--Select--',
  transitPeriod: '',
  routeDiesel: '',
  routeAdvance: '',
  tollAmount: '',
  ...Object.fromEntries(ROUTE_EXPENSES.map(expense => [expense, '0']))
};

export default function RouteMaster() {
  const [form, setForm]             = useState(INITIAL_FORM);
  const [activeTab, setActiveTab]   = useState(0);
  const [branch, setBranch]         = useState(INITIAL_BRANCH);
  const [subBranch, setSubBranch]   = useState('');
  const [branchRows, setBranchRows] = useState([]);
  const [expenses, setExpenses]     = useState(INITIAL_EXPENSES);
  const importRef = useRef(null);

  const setF = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const setB = e => setBranch(b => ({ ...b, [e.target.name]: e.target.value }));
  const setE = e => setExpenses(exp => ({ ...exp, [e.target.name]: e.target.value }));

  const handleSave = () => {
    if (!form.sourceBranch.trim())  { toast.error('Source Branch is required');   return; }
    if (!form.routeName.trim())     { toast.error('Route Name is required');       return; }
    if (!form.routeKm.trim())       { toast.error('Route KM is required');         return; }
    if (!form.transitTimeHrs.trim()){ toast.error('Transit Time is required');     return; }
    toast.success('Route saved successfully');
  };

  const handleAddBranch = () => {
    if (!branch.routeBranch.trim()) { toast.error('Route Branch is required'); return; }
    setBranchRows(r => [...r, { id: Date.now(), ...branch }]);
    setBranch(INITIAL_BRANCH);
    toast.success('Branch added');
  };

  const handleRefresh = () => {
    setForm(INITIAL_FORM);
    setBranch(INITIAL_BRANCH);
    setSubBranch('');
    setBranchRows([]);
    setExpenses(INITIAL_EXPENSES);
    setActiveTab(0);
  };

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Route Master</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button
            className="flex items-center gap-1.5 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
        </div>
      </div>

      {/* ── Main Form ───────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-4 mb-2">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-24">Route Type</label>
            <select name="routeType" value={form.routeType} onChange={setF}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {ROUTE_TYPES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-32"><span className="text-red-600">* </span>Source Branch</label>
            <input name="sourceBranch" value={form.sourceBranch} onChange={setF}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28"><span className="text-red-600">* </span>Route Name</label>
            <input name="routeName" value={form.routeName} onChange={setF}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-24"><span className="text-red-600">* </span>Route KM</label>
            <input name="routeKm" value={form.routeKm} onChange={setF}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-32"><span className="text-red-600">* </span>Transit Time(Hrs)</label>
            <input name="transitTimeHrs" value={form.transitTimeHrs} onChange={setF}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-28">Vehicle OutTime(Hrs)</label>
            <input name="vehicleOutTimeHrs" value={form.vehicleOutTimeHrs} onChange={setF}
              className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm">

        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-2 text-[13px] font-medium border-r border-gray-200 whitespace-nowrap transition-colors
                ${activeTab === i ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">

          {/* ── Tab 0: Route Branch/Location ── */}
          {activeTab === 0 && (
            <div>
              <div className="flex items-end gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px]">Route Branch</label>
                  <input name="routeBranch" value={branch.routeBranch} onChange={setB}
                    className="border border-gray-300 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px]">KM</label>
                  <div className="flex items-center gap-1">
                    <input name="km" value={branch.km} onChange={setB}
                      className="border border-gray-300 px-2 py-1 w-32 text-[13px] focus:outline-none focus:border-blue-500" />
                    <button type="button"
                      className="w-7 h-7 rounded-full bg-gray-800 text-white text-[16px] font-bold flex items-center justify-center hover:bg-gray-700 flex-shrink-0">
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px]">Transit Time(Hrs)</label>
                  <input name="transitTime" value={branch.transitTime} onChange={setB}
                    className="border border-gray-300 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <button type="button" onClick={handleAddBranch}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded self-end">
                  Add Branch
                </button>
              </div>
              {branchRows.length > 0 && (
                <table className="w-full border-collapse text-[13px] mt-2">
                  <thead>
                    <tr style={{ backgroundColor: '#0b8fd3', color: '#fff' }}>
                      <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Route Branch</th>
                      <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">KM</th>
                      <th className="px-3 py-2 text-left font-medium border border-[#0a7ab8]">Transit Time(Hrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchRows.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-1.5 border-b border-gray-200 text-[#1565c0]">{row.routeBranch}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.km}</td>
                        <td className="px-3 py-1.5 border-b border-gray-200">{row.transitTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <hr className="mt-4 border-gray-200" />
            </div>
          )}

          {/* ── Tab 1: Link Sub Branch ── */}
          {activeTab === 1 && (
            <div>
              <div className="flex items-center gap-3">
                <label className="text-[13px] whitespace-nowrap">Route Branch</label>
                <select value={subBranch} onChange={e => setSubBranch(e.target.value)}
                  className="border border-gray-400 px-2 py-1 w-44 text-[13px] bg-white focus:outline-none focus:border-blue-500">
                  <option value="">-- Select --</option>
                  {branchRows.map(r => (
                    <option key={r.id} value={r.routeBranch}>{r.routeBranch}</option>
                  ))}
                </select>
                <button type="button" onClick={() => toast.success('Sub branch saved')}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-5 py-1.5 rounded">
                  Save
                </button>
              </div>
              <hr className="mt-4 border-gray-200" />
            </div>
          )}

          {/* ── Tab 2: Route Expenses ── */}
          {activeTab === 2 && (
            <div>
              {/* Route Expenses Header */}
              <div className="grid grid-cols-3 gap-x-8 gap-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-[13px] whitespace-nowrap w-24">Route Name</label>
                  <input name="routeName" value={expenses.routeName} onChange={setE}
                    className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[13px] whitespace-nowrap w-32">Load Type</label>
                  <select name="loadType" value={expenses.loadType} onChange={setE}
                    className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
                    {LOAD_TYPES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[13px] whitespace-nowrap w-40">Transit Period(Days)</label>
                  <input name="transitPeriod" value={expenses.transitPeriod} onChange={setE}
                    className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* Route Details */}
              <div className="grid grid-cols-3 gap-x-8 gap-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <label className="text-[13px] whitespace-nowrap w-32">Route Diesel [In Litre]</label>
                  <input name="routeDiesel" value={expenses.routeDiesel} onChange={setE}
                    className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[13px] whitespace-nowrap w-28">Route Advance</label>
                  <input name="routeAdvance" value={expenses.routeAdvance} onChange={setE}
                    className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[13px] whitespace-nowrap w-24">Toll Amount</label>
                  <input name="tollAmount" value={expenses.tollAmount} onChange={setE}
                    className="border border-gray-300 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* Route Expense Table */}
              <div className="border border-gray-300 rounded">
                <div className="bg-[#0b8fd3] text-white px-4 py-2 text-[13px] font-medium">
                  Route Expense
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Route Charge</div>
                      {ROUTE_EXPENSES.map((expense, index) => (
                        <div key={expense} className="py-1.5 border-b border-gray-100 last:border-0">
                          {expense}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-2">Route Expenses</div>
                      {ROUTE_EXPENSES.map((expense, index) => (
                        <div key={expense} className="py-1.5 border-b border-gray-100 last:border-0">
                          <input
                            name={expense}
                            value={expenses[expense]}
                            onChange={setE}
                            className="border border-gray-300 px-2 py-0.5 w-full text-[13px] focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <hr className="mt-4 border-gray-200" />
            </div>
          )}

          {/* ── Tab 3: Import Route ── */}
          {activeTab === 3 && (
            <div>
              <div className="flex items-center gap-4 flex-wrap">
                <a href="#" className="text-[#0b8fd3] underline text-[13px] whitespace-nowrap">
                  Download Sample Excel Template
                </a>
                <span className="text-[13px] font-medium whitespace-nowrap">Select Excel File</span>
                <input type="file" ref={importRef} accept=".xlsx,.xls,.csv" className="hidden" />
                <button type="button" onClick={() => importRef.current && importRef.current.click()}
                  className="border border-gray-400 px-3 py-1 text-[13px] bg-white hover:bg-gray-50 rounded-sm">
                  Choose File
                </button>
                <span className="text-[13px] text-gray-500">No file chosen</span>
                <button type="button" className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
                  Show Data
                </button>
                <button type="button" className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
                  Import Data
                </button>
                <button type="button" onClick={handleRefresh}
                  className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-4 py-1.5 rounded">
                  Refresh
                </button>
              </div>
              <hr className="mt-4 border-gray-200" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
