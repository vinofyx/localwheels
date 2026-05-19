import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

// ─── Inline SVG icons (no external dependency) ───────────────────────────────
const Icons = {
  EwayBill:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  HoldLost:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  ShortQty:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
  DamageQty:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="14" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4m-2-2h4"/></svg>,
  ExcessQty:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>,
  Undelivered: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1"/></svg>,
  PodSubmit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  PodSend:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
  PodReceived: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  BadPod:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  PodUpload:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>,
  Customer:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
  PaidOut:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
  TopayOut:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
  Overdue:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Bill:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Cash:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>,
};

// ─── 15 card definitions (from JSON config) ──────────────────────────────────
const CARDS = [
  { key: 'eway_expiry',      title: "TODAY'S EXPIRY EWAY BILL", border: '#f59e0b', icon: Icons.EwayBill,    bg: '#fffbeb', color: '#d97706', to: '/shipments?filter=eway' },
  { key: 'hold_cn',          title: 'HOLD/LOST CN',             border: '#22c55e', icon: Icons.HoldLost,    bg: '#f0fdf4', color: '#16a34a', to: '/shipments?status=hold' },
  { key: 'short_qty',        title: 'SHORT QTY',                border: '#f97316', icon: Icons.ShortQty,    bg: '#fff7ed', color: '#ea580c', to: '/shipments?filter=short' },
  { key: 'damage_qty',       title: 'DAMAGE QTY',               border: '#a855f7', icon: Icons.DamageQty,   bg: '#faf5ff', color: '#9333ea', to: '/shipments?filter=damage' },
  { key: 'excess_qty',       title: 'EXCESS QTY',               border: '#8b5cf6', icon: Icons.ExcessQty,   bg: '#f5f3ff', color: '#7c3aed', to: '/shipments' },
  { key: 'undelivered_lr',   title: 'UN-DELIVERED LR',          border: '#6366f1', icon: Icons.Undelivered, bg: '#eef2ff', color: '#4f46e5', to: '/shipments?status=returned' },
  { key: 'pod_submit',       title: 'POD SUBMIT PENDING',       border: '#14b8a6', icon: Icons.PodSubmit,   bg: '#f0fdfa', color: '#0d9488', to: '/pod?status=pending' },
  { key: 'pod_send',         title: 'POD SEND PENDING',         border: '#3b82f6', icon: Icons.PodSend,     bg: '#eff6ff', color: '#2563eb', to: '/pod' },
  { key: 'pod_received',     title: 'POD RECEIVED PENDING',     border: '#eab308', icon: Icons.PodReceived, bg: '#fefce8', color: '#ca8a04', to: '/pod' },
  { key: 'pod_reject',       title: 'BAD / REJECT POD',         border: '#ec4899', icon: Icons.BadPod,      bg: '#fdf2f8', color: '#db2777', to: '/pod' },
  { key: 'paid_outstanding', title: 'PAID OUTSTANDING',         border: '#f59e0b', icon: Icons.PaidOut,     bg: '#fffbeb', color: '#d97706', to: '/payments?payment_type=paid',  currency: true },
  { key: 'to_pay',           title: 'TO PAY OUTSTANDING',       border: '#6366f1', icon: Icons.TopayOut,    bg: '#eef2ff', color: '#4f46e5', to: '/payments?payment_type=topay', currency: true },
  { key: 'overdue',          title: 'OVER DUE OUTSTANDING',     border: '#f97316', icon: Icons.Overdue,     bg: '#fff7ed', color: '#ea580c', to: '/payments?status=overdue',     currency: true },
  { key: 'bill_pending',     title: 'BILL SUBMISSION PENDING',  border: '#14b8a6', icon: Icons.Bill,        bg: '#f0fdfa', color: '#0d9488', to: '/payments' },
  { key: 'cash',             title: 'CASH IN HAND',             border: '#ef4444', icon: Icons.Cash,        bg: '#fef2f2', color: '#dc2626', to: '/payments',                    currency: true },
];

// ─── Format Indian number ─────────────────────────────────────────────────────
function fmtIndian(n, currency = false) {
  const num = Number(n) || 0;
  if (currency) return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num.toLocaleString('en-IN');
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

// ─── Single KPI card ─────────────────────────────────────────────────────────
function KPICard({ card, value }) {
  const display = fmtIndian(value, card.currency);
  return (
    <Link to={card.to} className="block group">
      <div
        className="bg-white rounded shadow-sm hover:shadow-md transition-shadow duration-150 p-3 h-full"
        style={{ borderLeft: `4px solid ${card.border}` }}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Icon box */}
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: card.bg, color: card.color }}
          >
            <div className="w-6 h-6">{card.icon}</div>
          </div>
          {/* Value */}
          <span className="text-[15px] font-bold text-red-600 leading-tight text-right break-all">
            {display}
          </span>
        </div>
        <div className="mt-2">
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide leading-tight">
            {card.title}
          </p>
          <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-0.5 group-hover:underline">
            View Details
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { branch } = useAuth();
  const [branches, setBranches] = useState([]);
  const [filterBranchId, setFilterBranchId] = useState('');
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(todayStr());
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  // Load branch list for filter dropdown
  useEffect(() => {
    api.get('/branches/user').then(r => {
      setBranches(r.data);
      if (!filterBranchId && r.data.length > 0) {
        const defaultId = branch?._id || branch?.id || r.data[0]._id || r.data[0].id;
        setFilterBranchId(String(defaultId));
      }
    }).catch(() => {});
  }, [branch]);

  const fetchMetrics = useCallback(() => {
    const bid = filterBranchId || branch?.id;
    if (!bid) return;
    setLoading(true);
    api.get(`/dashboard?branch_id=${bid}&from_date=${fromDate}&to_date=${toDate}`)
      .then(r => setMetrics(r.data || {}))
      .catch(() => setMetrics({}))
      .finally(() => setLoading(false));
  }, [branch, filterBranchId, fromDate, toDate]);

  // Auto-fetch when branch ready
  useEffect(() => {
    if (filterBranchId) fetchMetrics();
  }, [filterBranchId]);

  // All missing keys default to 0
  const vals = {};
  CARDS.forEach(c => { vals[c.key] = metrics[c.key] ?? 0; });

  return (
    <div>
      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-semibold text-gray-700 whitespace-nowrap">Assign Branch :</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-[13px] bg-white min-w-[180px]"
            value={filterBranchId}
            onChange={e => setFilterBranchId(e.target.value)}
          >
            {branches.map(b => (
              <option key={b._id || b.id} value={b._id || b.id}>{b.branch_name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[13px] font-semibold text-gray-700">From Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-2 py-1 text-[13px]"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[13px] font-semibold text-gray-700">To Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-2 py-1 text-[13px]"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>

        <button
          onClick={fetchMetrics}
          className="bg-[#00b4a0] hover:bg-[#009d8c] text-white font-semibold px-8 py-1 rounded text-[13px] transition-colors"
        >
          Show
        </button>
      </div>

      {/* ── KPI Cards Grid ──────────────────────────────────────────── */}
      <div className="p-3">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CARDS.map(card => (
              <KPICard key={card.key} card={card} value={vals[card.key]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StatusBadge (used by other pages) ───────────────────────────────────────
const STATUS_LABELS = {
  booked: 'Booked', in_transit: 'In Transit', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', hold: 'On Hold', lost: 'Lost', returned: 'Returned',
};
const STATUS_COLORS = {
  booked: 'bg-blue-100 text-blue-700', in_transit: 'bg-amber-100 text-amber-700',
  out_for_delivery: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
  hold: 'bg-red-100 text-red-700', lost: 'bg-gray-100 text-gray-600',
  returned: 'bg-orange-100 text-orange-700',
};
export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
