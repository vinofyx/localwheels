import React, { useState } from 'react';
import toast from 'react-hot-toast';

const INITIAL_LEVELS = [
  { id: 1,    name: 'ADMIN' },
  { id: 2,    name: 'BRANCH MANAGER' },
  { id: 3,    name: 'ACCOUNTANT' },
  { id: 4,    name: 'BILLING MANAGER' },
  { id: 5,    name: 'DATA ENTRY OPERATOR' },
  { id: 25,   name: 'DELIVERY INCHARGE' },
  { id: 28,   name: 'ACCOUNT MANGER' },
  { id: 32,   name: 'BOOKING INCHARGE' },
  { id: 1033, name: 'VASULI PAERSON' },
];

const MODULES = [
  'Master', 'Daily Entries', 'Modify/Print', 'Reports',
  'Account Entries', 'Account Reports', 'Tracking', 'Switch', 'Config', 'MIS',
];

function SaveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
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
function SortIcon() {
  return (
    <svg className="w-3 h-3 opacity-70 inline ml-1" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

export default function LevelMaster() {
  const [levelName, setLevelName] = useState('');
  const [levels]    = useState(INITIAL_LEVELS);
  const [search,  setSearch]   = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [checked,  setChecked]  = useState({});
  const [expanded, setExpanded] = useState({});

  const filtered = levels.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleEdit(lv) {
    setLevelName(lv.name);
    setSelectedId(lv.id);
  }

  function handleSave() {
    if (!levelName.trim()) { toast.error('Enter Level Name'); return; }
    toast.success('Level saved successfully');
  }

  function handleRefresh() {
    setLevelName('');
    setSelectedId(null);
    setChecked({});
    setExpanded({});
    toast('Refreshed');
  }

  function toggleCheck(mod) {
    setChecked(prev => ({ ...prev, [mod]: !prev[mod] }));
  }

  function toggleExpand(mod) {
    setExpanded(prev => ({ ...prev, [mod]: !prev[mod] }));
  }

  return (
    <div className="min-h-screen bg-[#eaf0fb] flex flex-col text-[13px]">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
        <div className="flex-1" />
        <h1 className="font-bold text-[15px] tracking-wide"
            style={{ fontVariant: 'small-caps' }}>Level Master</h1>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={handleSave}
            className="bg-[#0b8fd3] text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-[#0a7ab8] transition-colors">
            <SaveIcon /> Save
          </button>
          <button onClick={handleRefresh}
            className="bg-gray-500 text-white px-3 py-1.5 flex items-center gap-1.5
                       rounded-sm hover:bg-gray-600 transition-colors">
            <RefreshIcon /> Refersh
          </button>
        </div>
      </div>

      {/* ── Level Name input ────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <label className="font-medium text-gray-700 w-24">Level Name</label>
          <input
            value={levelName}
            onChange={e => setLevelName(e.target.value)}
            className="border border-gray-300 px-2 py-1.5 focus:outline-none
                       focus:border-[#0b8fd3] w-80 bg-white"
          />
        </div>
      </div>

      {/* ── Two-panel body ──────────────────────────────────── */}
      <div className="flex gap-3 p-3 flex-1" style={{ height: 'calc(100vh - 132px)' }}>

        {/* Left: Level table */}
        <div className="flex-1 bg-white border border-gray-200 rounded shadow-sm
                        flex flex-col overflow-hidden">
          {/* Search row */}
          <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-end
                          gap-2 flex-shrink-0">
            <span className="text-gray-600">Search:</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 px-2 py-1 focus:outline-none w-44"
            />
          </div>

          {/* Table */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#0b8fd3] text-white">
                  <th className="px-3 py-2 text-left font-semibold w-20">Level Id</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Level Name <SortIcon />
                  </th>
                  <th className="px-3 py-2 text-center font-semibold w-20">
                    Action <SortIcon />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lv, idx) => (
                  <tr key={lv.id}
                    onClick={() => handleEdit(lv)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors
                      ${selectedId === lv.id
                        ? 'bg-blue-50'
                        : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      hover:bg-blue-50`}>
                    <td className="px-3 py-1.5 text-gray-700">{lv.id}</td>
                    <td className="px-3 py-1.5 text-gray-800">{lv.name}</td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); handleEdit(lv); }}
                        className="text-[#0b8fd3] hover:text-[#0a7ab8]" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                               m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Module permission tree */}
        <div className="w-72 bg-white border border-gray-200 rounded shadow-sm
                        overflow-y-auto flex-shrink-0">
          <div className="p-2 space-y-0.5">
            {MODULES.map(mod => (
              <div key={mod}>
                <div className="flex items-center gap-2 py-1 px-1">
                  {/* ⊞ expand button */}
                  <button
                    onClick={() => toggleExpand(mod)}
                    className="w-5 h-5 border border-gray-400 flex items-center justify-center
                               text-[#0b8fd3] font-bold text-[11px] flex-shrink-0
                               hover:bg-gray-100 transition-colors">
                    {expanded[mod] ? '−' : '+'}
                  </button>
                  <input
                    type="checkbox"
                    checked={!!checked[mod]}
                    onChange={() => toggleCheck(mod)}
                    className="w-3.5 h-3.5 accent-[#0b8fd3] cursor-pointer flex-shrink-0"
                  />
                  <span
                    className="text-[#0b8fd3] text-[13px] cursor-pointer select-none"
                    onClick={() => toggleCheck(mod)}>
                    {mod}
                  </span>
                </div>
                {expanded[mod] && (
                  <div className="ml-10 py-1 text-[12px] text-gray-400 italic">
                    (sub-items)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
