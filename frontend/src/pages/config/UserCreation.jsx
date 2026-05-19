import React, { useState } from 'react';
import toast from 'react-hot-toast';

// ── Constants ──────────────────────────────────────────────────────────────────
const LEVELS = [
  '--Select--', 'ACCOUNT MANGER', 'ACCOUNTANT', 'ADMIN', 'BILLING MANAGER',
  'BOOKING INCHARGE', 'BRANCH MANAGER', 'CRM', 'DATA ENTRY OPERATOR',
  'DELIVERY INCHARGE', 'DEMO', 'FTL', 'FTL - OPERATION-ACCOUNT-FLEET',
  'K.ADINARAYANA', 'OPERATION-ACCOUNT-PAYROLL', 'OPERATIONAL BRANCH',
  'PAYROLL', 'PTL-OPTERTATION+ACCOUNT', 'VASULI PAERSON',
];

const USER_TYPES = ['Common', 'Delivery Person', 'Sale Person', 'CS Person'];

const PAY_TYPES = ['Select', 'PAID', 'TOPAY', 'TBB'];

const MOBILE_MENUS = ['Booking', 'Delivery/POD', 'Loading', 'Pendancy Report', 'Tracking', 'Unloading'];

const TABS = ['Users', 'Working Branch', 'Mobile Setting', 'Link Customer', 'Controlling Branch', 'User Other Info'];

const REPORTING_PERSONS = [
  '--Select--', 'ANANTHAPUR', 'ANIL', 'ASHOK BABU', 'avsofttech',
  'CUDDAPAH', 'D.SATYANARAYANA', 'D.SUNILKUMAR', 'Dayakar', 'DHIRAJ KUMAR',
  'GUNTUR', 'HYDERABAD-HEADOFFICE', 'HYDERABAD1', 'K.ADINARAYANA',
  'K.BHASKAR', 'KAKINADA', 'KARIMNAGAR', 'KHAMMAM', 'KURNOOL', 'MAHBUBNAGAR',
  'MANCHERIAL', 'NALGONDA', 'NELLORE', 'NIZAMABAD', 'ONGOLE',
  'RAJAHMUNDRY', 'SECUNDERABAD', 'SRIKAKULAM', 'TIRUPATI',
  'VIJAYAWADA', 'VISAKHAPATNAM', 'WARANGAL',
];

const inp = 'border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-full';
const req = 'text-red-600 text-[12px] font-medium';
const lbl = 'text-[12px] font-medium text-gray-700';

// ── Tab bar ────────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div className="flex flex-wrap border-b border-gray-300">
      {TABS.map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={`px-4 py-2 text-[13px] font-medium border border-b-0 mr-0.5 -mb-px
            ${active === t
              ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Users tab ──────────────────────────────────────────────────────────────────
function UsersTab() {
  const COLS = ['User ID', 'User Full Name', 'Email ID', 'Level', 'Is Active', 'Is EndUser', 'Is ExpiryAlert', 'Edit'];
  const [show,   setShow]   = useState('10');
  const [search, setSearch] = useState('');
  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px]">Show</span>
          <select value={show} onChange={e => setShow(e.target.value)}
            className="border border-gray-300 px-1 py-0.5 text-[12px] bg-white focus:outline-none w-14">
            {['10', '25', '50', '100'].map(n => <option key={n}>{n}</option>)}
          </select>
          <span className="text-[13px]">entries</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px]">Search:</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 px-2 py-0.5 text-[12px] focus:outline-none w-36" />
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full border-collapse text-[12px] min-w-[700px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              {COLS.map(h => (
                <th key={h} className="px-3 py-1.5 text-left font-medium whitespace-nowrap border-r border-blue-400 last:border-r-0">
                  {h}{h !== 'Edit' && <span className="text-[10px] ml-1">⇅</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={COLS.length} className="text-center py-5 text-gray-400">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="text-[12px] text-gray-500 mt-2">Showing 0 to 0 of 0 entries</div>
    </div>
  );
}

// ── Working Branch tab ─────────────────────────────────────────────────────────
function BranchTab({ title }) {
  const [branchName, setBranchName] = useState('');
  const [branches,   setBranches]   = useState([]);
  const handleAdd = () => {
    if (!branchName.trim()) { toast.error('Enter branch name'); return; }
    setBranches(p => [...p, branchName.trim()]);
    setBranchName('');
  };
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className={lbl}>Branch Name</span>
        <input value={branchName} onChange={e => setBranchName(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none w-56" />
        <button onClick={handleAdd}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1 rounded">
          Add
        </button>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-1.5 text-left font-medium border-r border-blue-400 w-full">
                Branch <span className="text-[10px]">⇅</span>
              </th>
              <th className="px-3 py-1.5 text-left font-medium whitespace-nowrap">
                Delete <span className="text-[10px]">⇅</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-5 text-gray-400">No data available in table</td></tr>
            ) : branches.map((b, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1">{b}</td>
                <td className="px-3 py-1 text-center">
                  <button onClick={() => setBranches(p => p.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 font-bold">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Link Customer tab ──────────────────────────────────────────────────────────
function LinkCustomerTab() {
  const [custName, setCustName] = useState('');
  const [customers, setCustomers] = useState([]);
  const handleAdd = () => {
    if (!custName.trim()) { toast.error('Enter customer name'); return; }
    setCustomers(p => [...p, custName.trim()]);
    setCustName('');
  };
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className={lbl}>Customer Name</span>
        <input value={custName} onChange={e => setCustName(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none w-56" />
        <button onClick={handleAdd}
          className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1 rounded">
          Add
        </button>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#0b8fd3] text-white">
              <th className="px-3 py-1.5 text-left font-medium border-r border-blue-400 w-full">
                Customer Name <span className="text-[10px]">⇅</span>
              </th>
              <th className="px-3 py-1.5 text-left font-medium whitespace-nowrap">
                Delete <span className="text-[10px]">⇅</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={2} className="text-center py-5 text-gray-400">No data available in table</td></tr>
            ) : customers.map((c, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-1">{c}</td>
                <td className="px-3 py-1 text-center">
                  <button onClick={() => setCustomers(p => p.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 font-bold">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Mobile Setting tab ─────────────────────────────────────────────────────────
function MobileSettingTab() {
  const [allowMobile,  setAllowMobile]  = useState(false);
  const [linkEmployee, setLinkEmployee] = useState(false);
  const [custName,     setCustName]     = useState('');
  const [custBranch,   setCustBranch]   = useState('');
  const [payType,      setPayType]      = useState('Select');
  const [manualLR,     setManualLR]     = useState(false);
  const [menuState,    setMenuState]    = useState({});
  const toggleMenu = n => setMenuState(p => ({ ...p, [n]: !p[n] }));
  return (
    <div className="p-3 flex gap-4 flex-wrap">
      {/* Left */}
      <div className="flex-1 min-w-[300px]">
        <p className="font-bold text-[13px] border-b border-gray-300 pb-1 mb-3">Mobile Booking Setting</p>
        <div className="flex gap-4 mb-3 flex-wrap">
          {[['Allow Mobile Booking', allowMobile, setAllowMobile], ['Link Employee', linkEmployee, setLinkEmployee]].map(([label, val, set]) => (
            <label key={label} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="w-3.5 h-3.5" />
              <span className="text-[13px]">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div>
            <span className={req}>*Customer Name</span>
            <input value={custName} onChange={e => setCustName(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none w-36 block mt-0.5" />
          </div>
          <div>
            <span className={req}>*Branch</span>
            <input value={custBranch} onChange={e => setCustBranch(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] focus:outline-none w-28 block mt-0.5" />
          </div>
          <div>
            <span className={req}>*Pay Type</span>
            <select value={payType} onChange={e => setPayType(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-28 block mt-0.5">
              {PAY_TYPES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer pb-0.5">
            <input type="checkbox" checked={manualLR} onChange={e => setManualLR(e.target.checked)} className="w-3.5 h-3.5" />
            <span className="text-[13px]">Manually LR</span>
          </label>
          <button onClick={() => toast('Add…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] px-4 py-1 rounded">
            Add
          </button>
        </div>
        <div className="border border-gray-200 rounded overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              <tr><td className="text-center py-4 text-gray-400">No data available in table</td></tr>
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 mt-1">
          <button className="text-gray-500 hover:text-gray-700 text-[12px]">◀</button>
          <button className="text-gray-500 hover:text-gray-700 text-[12px]">▶</button>
        </div>
      </div>
      {/* Right — Mobile Menu */}
      <div className="w-60 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-[13px]">Mobile Menu</span>
          <button onClick={() => toast.success('Mobile menu saved')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] px-4 py-1 rounded">
            Save
          </button>
        </div>
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#0b8fd3] text-white">
                <th className="px-3 py-1.5 text-left font-medium border-r border-blue-400">Menu Name <span className="text-[10px]">⇅</span></th>
                <th className="px-3 py-1.5 text-center font-medium">IsActive <span className="text-[10px]">⇅</span></th>
              </tr>
            </thead>
            <tbody>
              {MOBILE_MENUS.map(m => (
                <tr key={m} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1.5">{m}</td>
                  <td className="px-3 py-1.5 text-center">
                    <input type="checkbox" checked={!!menuState[m]} onChange={() => toggleMenu(m)} className="w-3.5 h-3.5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── User Other Info tab ────────────────────────────────────────────────────────
function UserOtherInfoTab() {
  const [reportingPerson, setReportingPerson] = useState('--Select--');
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <span className={lbl}>Reporting Person</span>
        <select value={reportingPerson} onChange={e => setReportingPerson(e.target.value)}
          className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-52">
          {REPORTING_PERSONS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function UserCreation() {
  const [userId,      setUserId]      = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [fullName,    setFullName]    = useState('');
  const [level,       setLevel]       = useState('--Select--');
  const [mailId,      setMailId]      = useState('');
  const [contactNo,   setContactNo]   = useState('');
  const [isActive,    setIsActive]    = useState(true);
  const [expiryAlert, setExpiryAlert] = useState(false);
  const [activeTBB,   setActiveTBB]   = useState(false);
  const [assignBranch,setAssignBranch]= useState('Assign Branch');
  const [userType,    setUserType]    = useState('Common');
  const [userFilter,  setUserFilter]  = useState('active');
  const [activeTab,   setActiveTab]   = useState('Users');

  const handleSave = () => {
    if (!userId)              { toast.error('User ID is required');        return; }
    if (!password)            { toast.error('Password is required');       return; }
    if (!fullName)            { toast.error('User Full Name is required'); return; }
    if (level === '--Select--') { toast.error('Level is required');        return; }
    toast.success('User saved successfully');
  };

  return (
    <div className="min-h-screen bg-[#eaf0fb] text-[13px]">

      {/* ── ActionBar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-300 relative">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <h2 className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2 tracking-wide"
          style={{ fontVariant: 'small-caps' }}>
          User Creation
        </h2>
        <div className="flex gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] px-3 py-1.5 rounded">
            <span>⬇</span> Save
          </button>
          <button onClick={() => toast('Refreshing…')}
            className="flex items-center gap-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] px-3 py-1.5 rounded">
            <span>↺</span> Refersh
          </button>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="border border-gray-300 rounded mx-3 mt-3 mb-3 px-4 py-3 bg-white">

        {/* Row 1: User ID | Password + Show Password */}
        <div className="grid grid-cols-2 gap-6 mb-3">
          <div>
            <span className={req}>* User ID</span>
            <input value={userId} onChange={e => setUserId(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Password</span>
            <div className="flex items-center gap-2 mt-0.5">
              <input value={password} onChange={e => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'} className={inp} />
              <label className="flex items-center gap-1 whitespace-nowrap cursor-pointer">
                <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} className="w-3.5 h-3.5" />
                <span className={lbl}>Show Password</span>
              </label>
            </div>
          </div>
        </div>

        {/* Row 2: User Full Name | Level */}
        <div className="grid grid-cols-2 gap-6 mb-3">
          <div>
            <span className={req}>* User Full Name</span>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={req}>* Level</span>
            <select value={level} onChange={e => setLevel(e.target.value)} className={`${inp} mt-0.5`}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3: Mail Id | Contact No */}
        <div className="grid grid-cols-2 gap-6 mb-3">
          <div>
            <span className={lbl}>Mail Id</span>
            <input value={mailId} onChange={e => setMailId(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
          <div>
            <span className={lbl}>Contact No</span>
            <input value={contactNo} onChange={e => setContactNo(e.target.value)} className={`${inp} mt-0.5`} />
          </div>
        </div>

        {/* Row 4: Checkboxes + Assign Branch */}
        <div className="flex flex-wrap items-center gap-6 mb-3">
          {[
            ['Is Active',          isActive,    setIsActive],
            ['Expiry Alert',       expiryAlert, setExpiryAlert],
            ['Active TBB Charges', activeTBB,   setActiveTBB],
          ].map(([label, val, set]) => (
            <label key={label} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="w-3.5 h-3.5" />
              <span className={lbl}>{label}</span>
            </label>
          ))}
          <div className="ml-auto">
            <select value={assignBranch} onChange={e => setAssignBranch(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-36">
              <option>Assign Branch</option>
              <option>All Branch</option>
            </select>
          </div>
        </div>

        {/* Row 5: User Type | Warning */}
        <div className="flex flex-wrap items-center gap-6 mb-3">
          <div className="flex items-center gap-2">
            <span className={lbl}>User Type</span>
            <select value={userType} onChange={e => setUserType(e.target.value)}
              className="border border-gray-300 px-2 py-1 text-[13px] bg-white focus:outline-none w-36">
              {USER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <span className="text-red-500 text-[12px] font-medium">
            **Hide LR Charges &amp; LR Total from LR,GDM,LCM,LDM pages
          </span>
        </div>

        {/* Row 6: Active / Deactive radio */}
        <div className="flex items-center gap-6">
          {[['active', 'Active User'], ['deactive', 'Deactive User']].map(([val, label]) => (
            <label key={val} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" checked={userFilter === val} onChange={() => setUserFilter(val)}
                className="w-3.5 h-3.5 accent-[#0b8fd3]" />
              <span className="text-[13px]">{label} (0)</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border border-gray-300 rounded mx-3 mb-4 bg-white overflow-hidden">
        <TabBar active={activeTab} onChange={setActiveTab} />
        <div>
          {activeTab === 'Users'              && <UsersTab />}
          {activeTab === 'Working Branch'     && <BranchTab title="Working Branch" />}
          {activeTab === 'Mobile Setting'     && <MobileSettingTab />}
          {activeTab === 'Link Customer'      && <LinkCustomerTab />}
          {activeTab === 'Controlling Branch' && <BranchTab title="Controlling Branch" />}
          {activeTab === 'User Other Info'    && <UserOtherInfoTab />}
        </div>
      </div>
    </div>
  );
}
