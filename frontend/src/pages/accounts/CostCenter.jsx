import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';

const SaveIcon    = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>;
const SearchIcon  = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const RefreshIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;

const INITIAL = { costCenterName: '', underCostCenter: '--Primary--', category: '--Select--', listBy: 'Branch', costPercentage: '' };

export default function CostCenter() {
  const [form, setForm] = useState(INITIAL);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = () => {
    if (!form.costCenterName || form.category === '--Select--') {
      toast.error('Cost Center Name and Category are required');
      return;
    }
    api.post('/cost-center', form)
      .then(() => { toast.success('Saved successfully'); setForm(INITIAL); })
      .catch(() => toast.error('Save failed'));
  };

  const handleRefresh = () => setForm(INITIAL);

  return (
    <div className="p-3 bg-[#cfd6de] min-h-screen text-[13px]">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center mb-2">
        <span className="text-red-600 text-[12px] font-medium">* Mark fields are compulsory</span>

        <h2 className="flex-1 text-center font-bold text-[15px] tracking-wide"
          style={{ fontVariant: 'small-caps' }}>
          Cost Center
        </h2>

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

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <div className="bg-white rounded shadow-sm px-5 py-4">

        {/* Row 1 */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 mb-3">

          <div className="flex items-center gap-2">
            <label className="w-36 text-[13px] whitespace-nowrap">
              <span className="text-red-600">*</span> Cost Center Name
            </label>
            <input
              name="costCenterName"
              value={form.costCenterName}
              onChange={set}
              className="border border-gray-400 px-2 py-1 w-52 text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-36 text-[13px] whitespace-nowrap">Under Cost Center</label>
            <select
              name="underCostCenter"
              value={form.underCostCenter}
              onChange={set}
              className="border border-gray-400 px-2 py-1 w-52 text-[13px] bg-white focus:outline-none focus:border-blue-500"
            >
              <option>--Primary--</option>
              <option>Primary</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="w-24 text-[13px] whitespace-nowrap">
              <span className="text-red-600">*</span> Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={set}
              className="border border-gray-400 px-2 py-1 w-52 text-[13px] bg-white focus:outline-none focus:border-blue-500"
            >
              <option>--Select--</option>
              <option>Transport</option>
              <option>Operations</option>
              <option>Admin</option>
            </select>
          </div>

        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap gap-x-8 gap-y-3">

          <div className="flex items-center gap-2">
            <label className="w-36 text-[13px] whitespace-nowrap">List By</label>
            <select
              name="listBy"
              value={form.listBy}
              onChange={set}
              className="border border-gray-400 px-2 py-1 w-52 text-[13px] bg-white focus:outline-none focus:border-blue-500"
            >
              <option>Branch</option>
              <option>Customer</option>
              <option>Employee</option>
              <option>NA</option>
              
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="w-36 text-[13px] whitespace-nowrap">Cost Percentage</label>
            <input
              name="costPercentage"
              value={form.costPercentage}
              onChange={set}
              className="border border-gray-400 px-2 py-1 w-52 text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>

        </div>

      </div>
    </div>
  );
}
