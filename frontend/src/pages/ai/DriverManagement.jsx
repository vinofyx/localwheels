import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const ATTENDANCE_COLOR = { Present: 'bg-green-100 text-green-700', Absent: 'bg-red-100 text-red-700', 'On Leave': 'bg-yellow-100 text-yellow-700' };
const STATUS_COLOR     = { 'On Trip': 'bg-blue-100 text-blue-700', Available: 'bg-green-100 text-green-700', 'Off Duty': 'bg-gray-100 text-gray-600' };

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [selected, setSel]    = useState(null);

  useEffect(() => {
    api.get('/ai/drivers')
      .then(r => setDrivers(r.data))
      .catch(() => toast.error('Failed to load drivers'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = drivers.filter(d => {
    const ms = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.license_no.includes(search.toUpperCase());
    const mf = filter === 'All' || d.attendance === filter || d.status === filter;
    return ms && mf;
  });

  const topDrivers = [...drivers].sort((a,b) => b.driving_score - a.driving_score).slice(0,6);

  function daysUntil(dateStr) {
    const d = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
    return d;
  }

  return (
    <div className="p-3 space-y-3">
      <div className="bg-gradient-to-r from-[#0b8fd3] to-[#0066aa] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">👤 Driver Management</h1>
          <p className="text-blue-100 text-[12px]">Attendance, driving score, violations, license/medical expiry alerts</p>
        </div>
        <div className="text-right text-[12px] text-blue-100">
          <p>Present: <b className="text-white">{drivers.filter(d=>d.attendance==='Present').length}</b></p>
          <p>On Trip: <b className="text-white">{drivers.filter(d=>d.status==='On Trip').length}</b></p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total Drivers',     val: drivers.length,                                          color: '#0b8fd3' },
          { label: 'Present Today',     val: drivers.filter(d=>d.attendance==='Present').length,       color: '#22c55e' },
          { label: 'Absent / Leave',    val: drivers.filter(d=>d.attendance!=='Present').length,       color: '#ef4444' },
          { label: 'License Expiring',  val: drivers.filter(d=>daysUntil(d.license_expiry)<=30).length,color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded shadow-sm p-3 border-l-4" style={{ borderColor: s.color }}>
            <p className="text-xl font-bold text-gray-800">{s.val}</p>
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Score Chart */}
        <div className="bg-white rounded shadow-sm p-3">
          <h2 className="text-[13px] font-bold text-gray-700 border-b pb-1 mb-2">Top Driver Scores</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topDrivers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={85} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="driving_score" name="Score" fill="#0b8fd3" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow-sm lg:col-span-2">
          <div className="px-3 py-2 border-b flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-[13px] font-bold text-gray-700">Driver Register ({filtered.length})</h2>
            <div className="flex gap-2 flex-wrap items-center">
              <input className="border border-gray-300 rounded px-2 py-1 text-[11px] w-32" placeholder="Name / License…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {['All','Present','Absent','On Leave','On Trip','Available'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${filter===f ? 'bg-[#0b8fd3] text-white border-[#0b8fd3]' : 'text-gray-600 border-gray-300'}`}>{f}</button>
              ))}
              <button className="text-[11px] font-bold px-3 py-1.5 bg-green-600 text-white rounded">Export</button>
            </div>
          </div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Name','License Expiry','Med. Expiry','Attendance','Trips/Mo','Score','Violations','Speed Avg','Rating','Status'].map(h => (
                      <th key={h} className="text-left px-2 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(d => {
                    const licDays = daysUntil(d.license_expiry);
                    const medDays = daysUntil(d.medical_expiry);
                    return (
                      <tr key={d.id} onClick={() => setSel(d)}
                        className={`hover:bg-gray-50 cursor-pointer ${selected?.id===d.id?'bg-blue-50':''}`}>
                        <td className="px-2 py-1.5 font-bold text-blue-700">{d.name}</td>
                        <td className="px-2 py-1.5">
                          <span className={licDays < 30 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                            {d.license_expiry} {licDays < 30 && '⚠️'}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={medDays < 30 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                            {d.medical_expiry} {medDays < 30 && '⚠️'}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ATTENDANCE_COLOR[d.attendance]}`}>{d.attendance}</span>
                        </td>
                        <td className="px-2 py-1.5">{d.trips_month}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-10 bg-gray-200 rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width:`${d.driving_score}%` }} />
                            </div>
                            <span>{d.driving_score}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-[11px]">
                          {d.violations > 0 ? <span className="text-red-500 font-bold">⚠️ {d.violations}</span> : <span className="text-green-600">0</span>}
                        </td>
                        <td className="px-2 py-1.5">{d.avg_speed} km/h</td>
                        <td className="px-2 py-1.5">⭐ {d.rating}</td>
                        <td className="px-2 py-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[d.status]}`}>{d.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div className="bg-white rounded shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[13px] font-bold text-gray-700">Driver Detail — {selected.name}</h2>
            <button onClick={() => setSel(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[12px]">
            {[
              ['License No',    selected.license_no],
              ['License Expiry',selected.license_expiry],
              ['Medical Expiry',selected.medical_expiry],
              ['Attendance',    selected.attendance],
              ['Trips / Month', selected.trips_month],
              ['Driving Score', `${selected.driving_score}%`],
              ['Violations',    selected.violations],
              ['Harsh Braking', selected.harsh_braking],
              ['Avg Speed',     `${selected.avg_speed} km/h`],
              ['Rating',        `⭐ ${selected.rating}`],
              ['Assigned Veh.', selected.vehicle_no],
              ['Status',        selected.status],
            ].map(([k,v]) => (
              <div key={k} className="bg-gray-50 rounded p-2">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">{k}</p>
                <p className="font-medium text-gray-800 mt-0.5 text-[11px]">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <button className="text-[11px] font-bold px-3 py-1.5 bg-[#0b8fd3] text-white rounded">📋 Trip History</button>
            <button className="text-[11px] font-bold px-3 py-1.5 bg-green-600 text-white rounded">📅 Mark Attendance</button>
            <button className="text-[11px] font-bold px-3 py-1.5 bg-orange-500 text-white rounded">🚨 Send Alert</button>
            <button className="text-[11px] font-bold px-3 py-1.5 bg-purple-600 text-white rounded">📄 Documents</button>
          </div>
        </div>
      )}
    </div>
  );
}
