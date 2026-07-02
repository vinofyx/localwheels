import React, { useState } from 'react';
import toast from 'react-hot-toast';

const inp = 'border border-gray-300 px-2 py-1 text-[13px] focus:outline-none focus:border-blue-400';
const SearchIcon = () => <svg className="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>;
const PdfIcon   = () => <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="3" fill="#e53e3e"/><text x="4" y="22" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial">PDF</text></svg>;
const ExcelIcon = () => <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="3" fill="#217346"/><text x="3" y="22" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">XLS</text></svg>;
const WordIcon  = () => <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="3" fill="#2b579a"/><text x="3" y="22" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">DOC</text></svg>;
const FILTERS = ['SEND DATE','LR NO','BRANCH','CUSTOMER'];
export default function PodSendRegister() {
  const [filter, setFilter] = useState(FILTERS[0]);
  const [from, setFrom]     = useState('');
  const [to, setTo]         = useState('');
  return (
    <div className="p-3 min-h-screen text-[13px]" style={{ backgroundColor: '#dce9f5' }}>
      <div className="text-center mb-2"><h2 className="font-bold text-[15px] tracking-wide underline">POD Send Register</h2></div>
      <div className="bg-white rounded shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2" style={{ backgroundColor: '#e8e8e8' }}>
          <label className="font-medium text-[13px] whitespace-nowrap">Filter</label>
          <select value={filter} onChange={e => setFilter(e.target.value)} className={`${inp} w-44`}>{FILTERS.map(f => <option key={f}>{f}</option>)}</select>
          <input value={from} onChange={e => setFrom(e.target.value)} className={`${inp} w-32`} placeholder="From" />
          <input value={to}   onChange={e => setTo(e.target.value)}   className={`${inp} w-32`} placeholder="To" />
          <button onClick={() => toast('Searching…')} className="flex items-center"><SearchIcon /></button>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => toast('PDF')} title="PDF"><PdfIcon /></button>
            <button onClick={() => toast('Excel')} title="Excel"><ExcelIcon /></button>
            <button onClick={() => toast('Word')} title="Word"><WordIcon /></button>
          </div>
        </div>
        <div className="border-t-2 border-b-2 border-black h-1" />
        <div className="p-6 text-center text-gray-400">No records found. Use the filter above to search.</div>
      </div>
    </div>
  );
}