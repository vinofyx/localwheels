import React, { useState } from 'react';
import toast from 'react-hot-toast';

const lbl = 'text-[13px] whitespace-nowrap font-medium text-orange-600';

export default function VehicleProfitability() {
  const [reportType, setReportType] = useState('Trip Wise(LR Income)');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [vehicle,    setVehicle]    = useState('');
  const [detail,     setDetail]     = useState('Detail');
  const [company,    setCompany]    = useState('COMPANY');

  return (
    <div className="min-h-screen text-[13px]" style={{ backgroundColor: '#d6e8f5' }}>
      <div className="text-center py-2">
        <h2 className="font-bold text-[14px] underline">Vehicle Profitablity</h2>
      </div>

      <div className="mx-3 border border-gray-300 rounded bg-white px-4 py-3 mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-48"
          >
            <option>Trip Wise(LR Income)</option>
            <option>Trip Wise(Trip Freight Income)</option>
            <option>Vehicle Wise</option>
          </select>

          <span className={lbl}>From Date</span>
          <input
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32"
          />

          <span className={lbl}>To Date</span>
          <input
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32"
          />

          <span className={lbl}>Vehicle</span>
          <input
            value={vehicle}
            onChange={e => setVehicle(e.target.value)}
            className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32"
          />

          <select
            value={detail}
            onChange={e => setDetail(e.target.value)}
            className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-24"
          >
            <option>Detail</option>
            <option>Summary</option>
          </select>

          <select
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="border border-gray-300 px-1.5 py-1 text-[13px] bg-white focus:outline-none w-32"
          >
            <option>COMPANY</option>
            <option>OWN</option>
            <option>HIRED</option>
          </select>

          <button
            onClick={() => toast('Showing…')}
            className="bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white text-[13px] font-medium px-6 py-1.5 rounded"
          >
            Show
          </button>
        </div>
      </div>

      <div className="mx-3 bg-white border border-gray-200 rounded min-h-[40px]" />
    </div>
  );
}
