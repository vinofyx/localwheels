import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  '--Select--',
  'LR', 'GDM/MANIFEST', 'Loading Sheet', 'LCM', 'LDM', 'VAR',
  'AKNOWLEDGMENT/DELIVERY STATUS', 'POD SEND', 'POD RECEIVED',
  'BILL', 'BILL WITHOUT LR', 'BILL SUBMISSION',
  'CUSTOMER CR/DR NOTE', 'VENDOR CR/DR NOTE', 'MR',
  'VENDER/HIRE VEHICLE PAYMENT', 'LR/MEMO EXPENSES',
  'DAILY EXPENSES VOUCHER', 'VOUCHER ENTRY', 'BANK RECONCILIATION',
  'OTHER VENDOR BILL', 'LR WISE EXPENCES', 'DIESELENTRY',
  'EXTRA DIESEL/ADVANCE', 'TRIP SETTLEMENT/CLOSING', 'VEHICLE MAINTANANCE',
  'PURCHASE INVOICE', 'ITEM ISSUE', 'PARTY/CUSTOMER MASTER',
  'VENDOR MASTER', 'VEHICLE MASTER', 'LEDGER MASTER',
  'PARTY CONTRACT', 'PURCHASE CONTRACT', 'ROUTE MASTER',
  'MARKET LOAD', 'MARKET PAYMENT', 'CREDIT CARD BILL',
  'PARTY LINK TO SUPERPARTY', 'LHS', 'OPENING MEMO', 'OPENING BILL',
  'VASULI SHEET', 'INWARD(BatchWise)', 'OUTWARD(BatchWise)',
  'INWARD (ProductWise)', 'OUTWARD (ProductWise)', 'WAREHOUSEDAMAGE(CFA)',
  'TRIP LOG BOOK', 'TRIP CONTRACT', 'TRIP BILLING',
  'VENDOR BILL PAYMENT', 'COMMISSION MEMO', 'ORDER/DO ENTRY',
  'Sale Invoice', 'Infra (PI)', 'SALARY PAYMENT', 'SALARY ADVANCE',
  'SALARY SLIP', 'Vehicle In/Out', 'UPLOAD POD',
];

export default function DocumentDeletion() {
  const [docType,        setDocType]        = useState('--Select--');
  const [docSearch,      setDocSearch]      = useState('');
  const [deletionRemark, setDeletionRemark] = useState('');
  const [searched,       setSearched]       = useState(false);

  function handleSearch() {
    if (docType === '--Select--') { toast.error('Please select a Document Type'); return; }
    setSearched(true);
    toast(`Searching "${docType}"…`);
  }

  function handleRefresh() {
    setDocType('--Select--');
    setDocSearch('');
    setDeletionRemark('');
    setSearched(false);
    toast('Refreshed');
  }

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Title + filter card ─────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 pt-3 pb-3 shadow-sm">

        {/* Centered title */}
        <h1 className="text-center font-bold text-[15px] tracking-wide mb-3"
            style={{ fontVariant: 'small-caps' }}>
          Document Deletion
        </h1>

        {/* Filter row */}
        <div className="flex items-center gap-4 flex-wrap">

          {/* Document Type */}
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700 whitespace-nowrap">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="border border-gray-300 px-2 py-1.5 bg-white
                         focus:outline-none focus:border-[#0b8fd3] w-48">
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Document Search */}
          <div className="flex items-center gap-2">
            <label className="text-gray-700 whitespace-nowrap">Document Search</label>
            <input
              value={docSearch}
              onChange={e => setDocSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="border border-gray-300 px-2 py-1.5 focus:outline-none w-36"
            />
          </div>

          {/* Buttons */}
          <button
            onClick={handleSearch}
            className="bg-[#0b8fd3] text-white px-5 py-1.5 hover:bg-[#0a7ab8] transition-colors">
            Search
          </button>
          <button
            onClick={handleRefresh}
            className="bg-[#0b8fd3] text-white px-5 py-1.5 hover:bg-[#0a7ab8] transition-colors">
            Refresh
          </button>

          {/* Deletion Remark */}
          <div className="flex items-center gap-2">
            <label className="text-gray-700 whitespace-nowrap">Deletion Remark</label>
            <input
              value={deletionRemark}
              onChange={e => setDeletionRemark(e.target.value)}
              className="border border-gray-300 px-2 py-1.5 focus:outline-none w-40"
            />
          </div>
        </div>
      </div>

      {/* ── Result area ─────────────────────────────────── */}
      <div className="mx-3 mt-3 bg-white border border-gray-200 rounded shadow-sm flex-1
                      flex items-start justify-start overflow-auto">
        {!searched ? (
          <p className="text-gray-400 p-6">
            Select a Document Type and click Search to view records.
          </p>
        ) : (
          <p className="text-gray-400 p-6">No records found for "{docType}".</p>
        )}
      </div>

    </div>
  );
}
