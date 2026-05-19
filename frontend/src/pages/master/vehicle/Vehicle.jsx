import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
const InfoIcon    = <svg className="w-4 h-4 text-[#0b8fd3]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>;
const PlusBtn = () => (
  <button type="button"
    className="w-6 h-6 rounded-full bg-gray-800 text-white text-[14px] font-bold flex items-center justify-center hover:bg-gray-700 flex-shrink-0">+</button>
);

const OWNER_VENDOR_TYPES  = ['Market', 'KM', 'Attach', 'Company'];
const LOAD_TYPES          = ['--Select--', 'LCV', 'HCV', 'LCV-L'];
const SERVICE_TYPES_VEH   = ['GOODS', 'PASSENGER', 'MIXED'];

const INITIAL = {
  vehicleNo: '', loadType: '--Select--',
  ownerVendorType: 'Market', vehicleMileage: '',
  engineNo: '', chasisNo: '',
  rcBookNo: '', vehicleDiscontinue: false,
  // Diesel Card Info
  pumpVendorName: '', pumpCardNo: '', cardExpiryDate: '',
  // FASTag Info
  linkFASTagVehicleNo: '', linkLedgerToFASTag: '', fasTagAccountNo: '',
  // Company Vehicle Info
  driverName: '', linkLedger: '', vehicleAssignBranch: '',
  modelNo: '', manufacturingCompany: '', manufacturingDate: '',
  kinnerDriverSalary: '', vehicleServiceType: 'GOODS',
  // Market/Attach/KM
  vehicleOwnerName: '', vendorAgentName: '',
  // Vehicle Doc Upload
  documentName: '',
};

const TABS = ['Diesel Card Info', 'FASTag Info', 'Company Vehicle Info', 'Market/Attach/KM Vehicle Info', 'Vehicle Doc Upload', 'Import Data', 'Map Route'];

export default function Vehicle() {
  const [form, setForm]           = useState(INITIAL);
  const [activeTab, setActiveTab] = useState('Diesel Card Info');
  const [fileName, setFileName]   = useState('No file chosen');
  const [importFileName, setImportFileName] = useState('No file chosen');
  const fileRef       = useRef();
  const importFileRef = useRef();

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.vehicleNo.trim())          { toast.error('Vehicle No is required');        return; }
    if (form.loadType === '--Select--')  { toast.error('Load Type is required');         return; }
    if (!form.ownerVendorType)           { toast.error('Owner/Vendor Type is required'); return; }
    toast.success('Saved successfully');
    setForm(INITIAL);
    setFileName('No file chosen');
  };

  const handleRefresh = () => { setForm(INITIAL); setFileName('No file chosen'); };

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>
        <div className="flex-1 flex justify-center">
          <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>Vehicle</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSave}
            className="flex items-center gap-1.5 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SaveIcon} Save
          </button>
          <button
            className="flex items-center gap-1.5 bg-[#1976d2] hover:bg-[#1565c0] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {SearchIcon} Search
          </button>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white text-[12px] font-medium px-3 py-1.5 rounded">
            {RefreshIcon} Refresh
          </button>
        </div>
      </div>

      {/* ── Main form panel ─────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-6 py-4 mb-2">
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">

          {/* Row 1 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>Vehicle No</label>
            <input name="vehicleNo" value={form.vehicleNo} onChange={set}
              className="border border-blue-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-600" />
            <button type="button"
              className="px-3 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] font-medium rounded ml-1">
              Verify
            </button>
            <span className="ml-1">{InfoIcon}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>Load Type</label>
            <select name="loadType" value={form.loadType} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {LOAD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36"><span className="text-red-600">* </span>Owner/Vendor Type</label>
            <select name="ownerVendorType" value={form.ownerVendorType} onChange={set}
              className="border border-gray-400 px-2 py-1 w-44 text-[13px] bg-white focus:outline-none focus:border-blue-500">
              {OWNER_VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36">Vehicle Mileage</label>
            <input name="vehicleMileage" value={form.vehicleMileage} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 3 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36">Engine No</label>
            <input name="engineNo" value={form.engineNo} onChange={set}
              className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36 text-[#e65100]">Chasis No</label>
            <input name="chasisNo" value={form.chasisNo} onChange={set}
              className="border border-gray-400 px-2 py-1 flex-1 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>

          {/* Row 4 */}
          <div className="flex items-center gap-2">
            <label className="text-[13px] whitespace-nowrap w-36">RC Book No</label>
            <input name="rcBookNo" value={form.rcBookNo} onChange={set}
              className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="vehicleDiscontinue" checked={form.vehicleDiscontinue} onChange={set}
              id="vehicleDiscontinue" className="w-3.5 h-3.5 cursor-pointer" />
            <label htmlFor="vehicleDiscontinue" className="text-[13px] cursor-pointer">Vehicle Discontinue</label>
          </div>

        </div>
      </div>

      {/* ── Tabs + content panel ────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-4 py-3">

        {/* Tab bar */}
        <div className="flex flex-wrap gap-0 mb-4 border-b border-gray-300">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[12px] font-medium border border-b-0 rounded-t transition-colors ${
                activeTab === tab
                  ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Diesel Card Info ── */}
        {activeTab === 'Diesel Card Info' && (
          <div className="flex items-center gap-6 px-2 py-2">
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap text-[#e65100]">Pump Vendor Name</label>
              <input name="pumpVendorName" value={form.pumpVendorName} onChange={set}
                className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Pump Card No</label>
              <input name="pumpCardNo" value={form.pumpCardNo} onChange={set}
                className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap text-[#e65100]">Card Expiry Date</label>
              <input name="cardExpiryDate" value={form.cardExpiryDate} onChange={set}
                className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        )}

        {/* ── FASTag Info ── */}
        {activeTab === 'FASTag Info' && (
          <div className="flex items-center gap-6 px-2 py-2">
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Link FASTag Vehicle No</label>
              <input name="linkFASTagVehicleNo" value={form.linkFASTagVehicleNo} onChange={set}
                className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Link Ledger to FASTag</label>
              <input name="linkLedgerToFASTag" value={form.linkLedgerToFASTag} onChange={set}
                className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap text-[#1565c0]">FASTag Account No</label>
              <input name="fasTagAccountNo" value={form.fasTagAccountNo} onChange={set}
                className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        )}

        {/* ── Company Vehicle Info ── */}
        {activeTab === 'Company Vehicle Info' && (
          <div className="flex flex-col gap-3 px-2 py-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-36">Driver Name</label>
                <input name="driverName" value={form.driverName} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-28">LinkLedger</label>
                <input name="linkLedger" value={form.linkLedger} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
                <PlusBtn />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-40">Vehicle Assign Branch</label>
                <input name="vehicleAssignBranch" value={form.vehicleAssignBranch} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-36">Model No</label>
                <input name="modelNo" value={form.modelNo} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-28">Manufacturing Company</label>
                <input name="manufacturingCompany" value={form.manufacturingCompany} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-40">Manufacturing Date</label>
                <input name="manufacturingDate" value={form.manufacturingDate} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-36">Kinner+Driver Salary</label>
                <input name="kinnerDriverSalary" value={form.kinnerDriverSalary} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[13px] whitespace-nowrap w-28">Vehicle Service Type</label>
                <select name="vehicleServiceType" value={form.vehicleServiceType} onChange={set}
                  className="border border-gray-400 px-2 py-1 w-40 text-[13px] bg-white focus:outline-none focus:border-blue-500">
                  {SERVICE_TYPES_VEH.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Market/Attach/KM Vehicle Info ── */}
        {activeTab === 'Market/Attach/KM Vehicle Info' && (
          <div className="flex items-center gap-6 px-2 py-2">
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Vehicle Owner Name</label>
              <input name="vehicleOwnerName" value={form.vehicleOwnerName} onChange={set}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
              <PlusBtn />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[13px] whitespace-nowrap">Vendor/Agent Name</label>
              <input name="vendorAgentName" value={form.vendorAgentName} onChange={set}
                className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
              <PlusBtn />
            </div>
          </div>
        )}

        {/* ── Vehicle Doc Upload ── */}
        {activeTab === 'Vehicle Doc Upload' && (
          <div className="flex items-center gap-3 px-2 py-2">
            <label className="text-[13px] whitespace-nowrap">Document Name</label>
            <input name="documentName" value={form.documentName} onChange={set}
              className="border border-gray-400 px-2 py-1 w-40 text-[13px] focus:outline-none focus:border-blue-500" />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-2 py-0.5 border border-gray-400 bg-gray-100 text-[12px] hover:bg-gray-200 rounded-sm">
              Choose File
            </button>
            <span className="text-[12px] text-gray-500">{fileName}</span>
            <input ref={fileRef} type="file" className="hidden"
              onChange={e => setFileName(e.target.files[0]?.name || 'No file chosen')} />
            <button type="button"
              className="px-4 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">
              Upload File
            </button>
          </div>
        )}

        {/* ── Import Data ── */}
        {activeTab === 'Import Data' && (
          <div className="flex items-center gap-3 flex-wrap px-2 py-2">
            <span className="text-[#1565c0] text-[12px] underline cursor-pointer whitespace-nowrap">Download Sample Excel Template</span>
            <label className="text-[13px] font-medium whitespace-nowrap">Select Excel File</label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => importFileRef.current?.click()}
                className="px-2 py-0.5 border border-gray-400 bg-gray-100 text-[12px] hover:bg-gray-200 rounded-sm">
                Choose File
              </button>
              <span className="text-[12px] text-gray-500">{importFileName}</span>
              <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={e => setImportFileName(e.target.files[0]?.name || 'No file chosen')} />
            </div>
            <button className="px-4 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Show Data</button>
            <button className="px-4 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Import Data</button>
            <button onClick={() => setImportFileName('No file chosen')}
              className="px-4 py-1 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[12px] rounded">Refresh</button>
          </div>
        )}

        {/* ── Map Route ── */}
        {activeTab === 'Map Route' && (
          <div className="flex items-center gap-2 px-2 py-2">
            <label className="text-[13px] whitespace-nowrap">Route Name</label>
            <input name="routeName" value={form.routeName ?? ''} onChange={set}
              className="border border-gray-400 px-2 py-1 w-44 text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
        )}

      </div>
    </div>
  );
}
