import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const PRIORITY_STYLES = {
  High:   'bg-red-100 text-red-700 border border-red-200',
  Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  Low:    'bg-gray-100 text-gray-600 border border-gray-200',
};

const TYPE_ICONS = {
  'Breakdown':       '🔴',
  'Late Delivery':   '🟡',
  'Maintenance Due': '🔧',
  'Fuel Theft':      '⚠️',
  'Over Speed':      '🚨',
  'Vehicle Idle':    '⏸️',
  'Doc Expiry':      '📄',
  'Insurance Expiry':'📋',
  'Permit Expiry':   '📑',
  'POD Pending':     '📦',
  'Invoice Pending': '💰',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AINotifications() {
  const [data, setData]         = useState(null);
  const [loading, setLoad]      = useState(true);
  const [filter, setFilter]     = useState('All');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/ai/notifications')
      .then(r => {
        setData(r.data);
        setNotifications(r.data.recent || []);
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const unread = notifications.filter(n => !n.read).length;
  const allTypes = ['All', ...Object.keys(TYPE_ICONS)];
  const visible  = filter === 'All' ? notifications : notifications.filter(n => n.type === filter);

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  }

  function markOne(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f97316] to-[#ef4444] rounded shadow text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">
            🔔 AI Notifications Center
            {unread > 0 && (
              <span className="bg-white text-orange-600 text-[11px] font-bold px-2 py-0.5 rounded-full">{unread} new</span>
            )}
          </h1>
          <p className="text-orange-100 text-[12px]">Real-time alerts for fleet, deliveries, documents and AI insights</p>
        </div>
        <button onClick={markAllRead}
          className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-colors">
          ✓ Mark All Read
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {data.summary.slice(0, 6).map(s => (
          <div key={s.type}
            onClick={() => setFilter(s.type)}
            className={`bg-white rounded shadow-sm p-2.5 cursor-pointer border-l-4 hover:shadow-md transition-shadow ${filter === s.type ? 'ring-2 ring-orange-400' : ''}`}
            style={{ borderColor: s.count > 0 ? '#f97316' : '#e5e7eb' }}>
            <p className="text-lg font-bold text-gray-800">{s.icon} {s.count}</p>
            <p className="text-[9.5px] font-semibold text-gray-500 uppercase mt-0.5">{s.type}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm">
        {/* Filter bar */}
        <div className="border-b px-3 pt-2 flex gap-1 overflow-x-auto">
          {['All', 'Breakdown', 'Late Delivery', 'Maintenance Due', 'Fuel Theft', 'Over Speed'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`text-[11px] font-bold pb-2 px-3 border-b-2 whitespace-nowrap ${filter === t ? 'border-orange-500 text-orange-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'All' ? `All (${notifications.length})` : t}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="divide-y divide-gray-100">
          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications for this category</div>
          ) : visible.map(n => (
            <div key={n.id}
              onClick={() => markOne(n.id)}
              className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.read ? '' : 'bg-orange-50/40'}`}>
              {/* Icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${n.read ? 'bg-gray-100' : 'bg-orange-100'}`}>
                {TYPE_ICONS[n.type] || '🔔'}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.Low}`}>
                    {n.priority}
                  </span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{n.type}</span>
                  {!n.read && <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />}
                </div>
                <p className={`text-[12px] mt-1 leading-snug ${n.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                  {n.message}
                </p>
              </div>
              {/* Time */}
              <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(n.time)}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">{visible.length} notifications shown · {unread} unread</span>
          <span className="text-[11px] text-orange-600 font-semibold">Click a notification to mark as read</span>
        </div>
      </div>

      {/* All type summary */}
      <div className="bg-white rounded shadow-sm p-3">
        <h3 className="text-[12px] font-bold text-gray-700 mb-2">All Alert Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {data.summary.map(s => (
            <div key={s.type}
              onClick={() => setFilter(s.type)}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-orange-50 transition-colors">
              <span className="text-base">{s.icon}</span>
              <div>
                <p className="text-[12px] font-bold text-gray-800">{s.count}</p>
                <p className="text-[9.5px] text-gray-500 font-medium">{s.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
