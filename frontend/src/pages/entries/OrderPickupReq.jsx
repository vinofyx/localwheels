import React, { useState } from 'react';
import toast from 'react-hot-toast';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const TRANSIT_MODES = ['--Select--', 'ROAD', 'AIR', 'SEA', 'TRAIN'];

const lblR = 'whitespace-nowrap text-red-600 font-medium text-[13px]';
const lblO = 'whitespace-nowrap text-[#e67e00] font-medium text-[13px]';
const lbl  = 'whitespace-nowrap font-medium text-[13px]';
const inp  = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const inpR = 'border border-blue-400 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-500';
const topBtn = v => `flex items-center gap-1.5 text-white text-[12px] font-medium px-3 py-1.5 rounded ${
  v === 'save'   ? 'bg-[#1565c0] hover:bg-[#0d47a1]' :
  v === 'search' ? 'bg-[#0288d1] hover:bg-[#0277bd]' :
                   'bg-[#546e7a] hover:bg-[#455a64]'
}`;

export default function OrderPickupReq() {
  const [tab,             setTab]             = useState('consignor');
  const [entryNo,         setEntryNo]         = useState('');
  const [orderRefNo,      setOrderRefNo]      = useState('');
  const [orderDate,       setOrderDate]       = useState('');
  const [orderPartyName,  setOrderPartyName]  = useState('');
  const [fromLocation,    setFromLocation]    = useState('');
  const [fromPincode,     setFromPincode]     = useState('');
  const [toLocation,      setToLocation]      = useState('');
  const [toPincode,       setToPincode]       = useState('');
  const [qty,             setQty]             = useState('');
  const [actWt,           setActWt]           = useState('');
  const [remark,          setRemark]          = useState('');
  const [transitMode,     setTransitMode]     = useState('--Select--');
  const [pickupDate,      setPickupDate]      = useState('');
  const [pickupTime,      setPickupTime]      = useState('');
  const [assignBranch,    setAssignBranch]    = useState('');
  const [cancel,          setCancel]          = useState(false);
  const [contactPerson,   setContactPerson]   = useState('');
  const [mailId,          setMailId]          = useState('');
  const [contactNo,       setContactNo]       = useState('');
  const [mailCheck,       setMailCheck]       = useState(false);
  const [whatsApp,        setWhatsApp]        = useState(false);
  // Consignor/Consignee
  const [consignorCode,   setConsignorCode]   = useState('');
  const [consignorName,   setConsignorName]   = useState('');
  const [consignorAddr,   setConsignorAddr]   = useState('');
  const [consignorContact,setConsignorContact]= useState('');
  const [consignorGST,    setConsignorGST]    = useState('');
  const [consigneeCode,   setConsigneeCode]   = useState('');
  const [consigneeName,   setConsigneeName]   = useState('');
  const [consigneeAddr,   setConsigneeAddr]   = useState('');
  const [consigneeContact,setConsigneeContact]= useState('');
  const [consigneeGST,    setConsigneeGST]    = useState('');
  // Product rows
  const [productRows,     setProductRows]     = useState([]);

  const handleRefresh = () => {
    setEntryNo(''); setOrderRefNo(''); setOrderDate(''); setOrderPartyName('');
    setFromLocation(''); setFromPincode(''); setToLocation(''); setToPincode('');
    setQty(''); setActWt(''); setRemark(''); setTransitMode('--Select--');
    setPickupDate(''); setPickupTime(''); setAssignBranch(''); setCancel(false);
    setContactPerson(''); setMailId(''); setContactNo(''); setMailCheck(false); setWhatsApp(false);
    setConsignorCode(''); setConsignorName(''); setConsignorAddr(''); setConsignorContact(''); setConsignorGST('');
    setConsigneeCode(''); setConsigneeName(''); setConsigneeAddr(''); setConsigneeContact(''); setConsigneeGST('');
    setProductRows([]);
  };

  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#cfd6de' }}>

      {/* Top bar */}
      <div className="flex items-center mb-2">
        <p className="text-red-600 text-[12px] font-medium flex-1">* Mark fields are compulsory</p>
        <h2 className="font-bold text-[15px] tracking-wide" style={{ fontVariant: 'small-caps' }}>
          Order/Pickup Req.
        </h2>
        <div className="flex-1 flex justify-end gap-1.5">
          <button onClick={() => toast.success('Saved')} className={topBtn('save')}>{SaveIcon} Save</button>
          <button onClick={() => toast('Search')}        className={topBtn('search')}>{SearchIcon} Search</button>
          <button onClick={handleRefresh}                className={topBtn('gray')}>{RefreshIcon} Refresh</button>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded shadow-sm px-4 py-3 mb-2 overflow-x-auto">
        <div className="min-w-max">

          {/* Row 1: Entry No | Order/Ref No | Order date | Order Party Name */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-2">
              <label className={lbl}>Entry No</label>
              <input value={entryNo} onChange={e => setEntryNo(e.target.value)} className={`${inp} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Order/Ref No</label>
              <input value={orderRefNo} onChange={e => setOrderRefNo(e.target.value)} className={`${inpR} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Order date</label>
              <input value={orderDate} onChange={e => setOrderDate(e.target.value)} className={`${inpR} w-32`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Order Party Name</label>
              <input value={orderPartyName} onChange={e => setOrderPartyName(e.target.value)} className={`${inpR} w-44`} />
            </div>
          </div>

          {/* Row 2: From Location | From Pincode | To Location | To Pincode */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-2">
              <label className={lblO}>* From Location</label>
              <input value={fromLocation} onChange={e => setFromLocation(e.target.value)} className={`${inpR} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>From Pincode</label>
              <input value={fromPincode} onChange={e => setFromPincode(e.target.value)} className={`${inp} w-32`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* To Location</label>
              <input value={toLocation} onChange={e => setToLocation(e.target.value)} className={`${inpR} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>To Pincode</label>
              <input value={toPincode} onChange={e => setToPincode(e.target.value)} className={`${inp} w-32`} />
            </div>
          </div>

          {/* Row 3: Qty | Act Wt | Remark | Transit Mode */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-2">
              <label className={lbl}>Qty</label>
              <input value={qty} onChange={e => setQty(e.target.value)} className={`${inp} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Act Wt</label>
              <input value={actWt} onChange={e => setActWt(e.target.value)} className={`${inp} w-32`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Remark</label>
              <input value={remark} onChange={e => setRemark(e.target.value)} className={`${inp} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Transit Mode</label>
              <select value={transitMode} onChange={e => setTransitMode(e.target.value)} className={`${inp} w-36`}>
                {TRANSIT_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Row 4: PickUp Date-Time | Assign Branch | Docket No | Cancel */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-2">
              <label className={lblR}>* PickUp Date-Time</label>
              <input value={pickupDate} onChange={e => setPickupDate(e.target.value)} className={`${inpR} w-28`} placeholder="Date" />
              <input value={pickupTime} onChange={e => setPickupTime(e.target.value)} className={`${inp} w-24`} placeholder="Time" />
            </div>
            <div className="flex items-center gap-2">
              <label className={lblR}>* Assign Branch</label>
              <input value={assignBranch} onChange={e => setAssignBranch(e.target.value)} className={`${inpR} w-40`} />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-bold text-red-600 whitespace-nowrap text-[13px]">Docket No :</label>
              <input readOnly className="border border-gray-300 bg-gray-100 px-2 py-1 w-40 text-[13px] cursor-not-allowed" />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
              <input type="checkbox" checked={cancel} onChange={e => setCancel(e.target.checked)} />
              Cancel
            </label>
          </div>

          {/* Row 5: Contact Person | Mail ID | Contact No | Mail | WhatsApp */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <label className={lbl}>Contact Person</label>
              <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} className={`${inp} w-44`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Mail ID</label>
              <input value={mailId} onChange={e => setMailId(e.target.value)} className={`${inp} w-40`} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>Contact No</label>
              <input value={contactNo} onChange={e => setContactNo(e.target.value)} className={`${inp} w-44`} />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
              <input type="checkbox" checked={mailCheck} onChange={e => setMailCheck(e.target.checked)} />
              Mail
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[13px]">
              <input type="checkbox" checked={whatsApp} onChange={e => setWhatsApp(e.target.checked)} />
              WhatsApp
            </label>
          </div>
        </div>
      </div>

      {/* Tabs card */}
      <div className="bg-white rounded shadow-sm">
        <div className="flex border-b border-gray-200">
          {[['consignor','Consignor/Consignee Details'],['product','Product Details']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-[13px] font-medium border-r border-gray-200 last:border-r-0 ${
                tab === key ? 'bg-[#0b8fd3] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Consignor/Consignee Details */}
        {tab === 'consignor' && (
          <div className="px-4 py-3 overflow-x-auto">
            <div className="min-w-max">
              {/* Consignor */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <label className={lbl}>Consignor Code</label>
                  <input value={consignorCode} onChange={e => setConsignorCode(e.target.value)} className={`${inp} w-36`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={lblR}>* Name</label>
                  <input value={consignorName} onChange={e => setConsignorName(e.target.value)} className={`${inpR} w-36`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={lbl}>Address</label>
                  <input value={consignorAddr} onChange={e => setConsignorAddr(e.target.value)} className={`${inp} w-36`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={lbl}>Contact No</label>
                  <input value={consignorContact} onChange={e => setConsignorContact(e.target.value)} className={`${inp} w-36`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={lbl}>GST No</label>
                  <input value={consignorGST} onChange={e => setConsignorGST(e.target.value)} className={`${inp} w-36`} />
                </div>
              </div>
              {/* Consignee */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className={lbl}>Consignee Code</label>
                  <input value={consigneeCode} onChange={e => setConsigneeCode(e.target.value)} className={`${inp} w-36`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={lblR}>* Name</label>
                  <input value={consigneeName} onChange={e => setConsigneeName(e.target.value)} className={`${inpR} w-36`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={lbl}>Address</label>
                  <input value={consigneeAddr} onChange={e => setConsigneeAddr(e.target.value)} className={`${inp} w-36`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={lbl}>Contact No</label>
                  <input value={consigneeContact} onChange={e => setConsigneeContact(e.target.value)} className={`${inp} w-36`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={lbl}>GST No</label>
                  <input value={consigneeGST} onChange={e => setConsigneeGST(e.target.value)} className={`${inp} w-36`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details */}
        {tab === 'product' && (
          <div className="px-4 py-3">
            <button onClick={() => setProductRows(r => [...r, {}])}
              className="flex items-center gap-1.5 text-[13px] text-gray-700 hover:text-[#0b8fd3]">
              <span className="text-xl leading-none text-gray-600">⊕</span> Add Row
            </button>
            {productRows.length > 0 && (
              <div className="mt-2 text-gray-400 text-[12px]">{productRows.length} row(s) added</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
