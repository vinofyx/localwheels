import { useState, useEffect, useRef } from 'react';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const h = () => ({ Authorization: `Bearer ${localStorage.getItem('lw_token')}`, 'Content-Type': 'application/json' });

const STATUS_COLOR = { pending: 'bg-yellow-100 text-yellow-700', in_transit: 'bg-blue-100 text-blue-700', out_for_delivery: 'bg-indigo-100 text-indigo-700', delivered: 'bg-green-100 text-green-700', delayed: 'bg-red-100 text-red-700', on_hold: 'bg-orange-100 text-orange-700' };

export default function CustomerPortal2() {
  const [dash, setDash]           = useState(null);
  const [tab, setTab]             = useState('dashboard');
  const [shipments, setShipments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [invoices, setInvoices]   = useState([]);
  const [pods, setPods]           = useState([]);
  const [settings, setSettings]   = useState(null);
  const [chat, setChat]           = useState([]);
  const [chatMsg, setChatMsg]     = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [lrSearch, setLrSearch]   = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [booking, setBooking]     = useState({ origin: '', destination: '', pickup_date: '', cargo_type: 'general', weight_kg: '' });
  const [loading, setLoading]     = useState(true);
  const chatEnd = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, s, c, p] = await Promise.all([
        fetch(`${_BASE}/customer-portal/dashboard`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/customer-portal/settings`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/customer-portal/complaints`, { headers: h() }).then(r => r.json()),
        fetch(`${_BASE}/customer-portal/pods`, { headers: h() }).then(r => r.json()),
      ]);
      setDash(d.data || d);
      setSettings(s.data || s);
      setComplaints(c.data?.complaints || []);
      setPods(p.data?.pods || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadShipments = async () => {
    const r = await fetch(`${_BASE}/customer-portal/shipments?limit=20`, { headers: h() }).then(r => r.json());
    setShipments(r.data?.shipments || []);
  };

  const loadInvoices = async () => {
    const r = await fetch(`${_BASE}/customer-portal/invoices`, { headers: h() }).then(r => r.json());
    setInvoices(r.data?.invoices || []);
  };

  const track = async () => {
    if (!lrSearch.trim()) return;
    const r = await fetch(`${_BASE}/customer-portal/tracking/${lrSearch}`, { headers: h() }).then(r => r.json());
    setTrackResult(r.data || r);
  };

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    const userMsg = { role: 'user', text: chatMsg };
    setChat(prev => [...prev, userMsg]);
    setChatMsg('');
    setChatLoading(true);
    try {
      const r = await fetch(`${_BASE}/customer-portal/ai-assistant`, { method: 'POST', headers: h(), body: JSON.stringify({ message: chatMsg }) }).then(r => r.json());
      setChat(prev => [...prev, { role: 'ai', text: r.data?.reply || r.reply || 'Sorry, I could not process that.' }]);
    } catch {
      setChat(prev => [...prev, { role: 'ai', text: 'Service temporarily unavailable.' }]);
    }
    setChatLoading(false);
    setTimeout(() => chatEnd.current?.scrollIntoView(), 50);
  };

  const submitBooking = async () => {
    await fetch(`${_BASE}/customer-portal/booking-request`, { method: 'POST', headers: h(), body: JSON.stringify(booking) });
    setBooking({ origin: '', destination: '', pickup_date: '', cargo_type: 'general', weight_kg: '' });
    alert('Booking request submitted! We will contact you shortly.');
  };

  const switchTab = (t) => {
    setTab(t);
    if (t === 'shipments') loadShipments();
    if (t === 'invoices') loadInvoices();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Your self-service logistics dashboard</p>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading…</div>}

      {!loading && tab === 'dashboard' && dash && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[['Total Shipments', dash.total_shipments], ['In Transit', dash.in_transit], ['Open Complaints', dash.open_complaints?.length || 0], ['PODs Available', pods.length]].map(([l, v]) => (
            <div key={l} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase">{l}</p>
              <p className="text-2xl font-bold mt-1">{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 flex-wrap border-b border-gray-200">
        {[['dashboard','Dashboard'],['shipments','Shipments'],['track','Track'],['complaints','Complaints'],['invoices','Invoices'],['pods','PODs'],['booking','Book'],['ai','AI Assistant'],['settings','Settings']].map(([t, l]) => (
          <button key={t} onClick={() => switchTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {tab === 'shipments' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['LR Number','Consignee','Destination','Status','Date'].map(c => <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shipments.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{s.lr_number}</td>
                  <td className="px-4 py-3 text-gray-700">{s.consignee_name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.destination_city}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status?.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {shipments.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">No shipments found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'track' && (
        <div className="max-w-2xl space-y-4">
          <div className="flex gap-3">
            <input value={lrSearch} onChange={e => setLrSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && track()} placeholder="Enter LR number…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <button onClick={track} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm">Track</button>
          </div>
          {trackResult?.shipment && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{trackResult.shipment.lr_number}</p>
                  <p className="text-sm text-gray-500">{trackResult.shipment.consignee_name} · {trackResult.shipment.destination_city}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full h-fit font-medium ${STATUS_COLOR[trackResult.shipment.status] || 'bg-gray-100 text-gray-600'}`}>{trackResult.shipment.status?.replace('_',' ')}</span>
              </div>
              {trackResult.tracking_events?.length > 0 && (
                <div className="space-y-3">
                  {trackResult.tracking_events.map((e, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-indigo-500 mt-1"/>{i < trackResult.tracking_events.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"/>}</div>
                      <div><p className="text-sm font-medium text-gray-800">{e.status || e.event}</p><p className="text-xs text-gray-400">{e.location} · {new Date(e.created_at || e.createdAt).toLocaleString()}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {trackResult?.error && <p className="text-sm text-red-600">{trackResult.error}</p>}
        </div>
      )}

      {tab === 'complaints' && (
        <div className="space-y-2">
          {complaints.map(c => (
            <div key={c._id} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.complaint_type || c.type || 'Complaint'}</p>
                  <p className="text-sm text-gray-500">{c.description?.slice(0, 80)}…</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
              </div>
            </div>
          ))}
          {complaints.length === 0 && <div className="text-center py-10 text-gray-400">No complaints found</div>}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv._id} className="bg-white rounded-lg border border-gray-100 p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-medium text-gray-900">{inv.invoice_number || inv._id}</p>
                <p className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">KES {(inv.amount || 0).toLocaleString()}</p>
                <span className={`text-xs ${inv.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{inv.status}</span>
              </div>
            </div>
          ))}
          {invoices.length === 0 && <div className="text-center py-10 text-gray-400">No invoices found</div>}
        </div>
      )}

      {tab === 'pods' && (
        <div className="space-y-2">
          {pods.map(p => (
            <div key={p._id} className="bg-white rounded-lg border border-gray-100 p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="font-medium text-gray-900">{p.lr_number}</p>
                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              {p.signature_url && <a href={p.signature_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">Download POD</a>}
            </div>
          ))}
          {pods.length === 0 && <div className="text-center py-10 text-gray-400">No PODs available</div>}
        </div>
      )}

      {tab === 'booking' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Booking Request</h3>
          <div className="space-y-3">
            {[['origin','Origin *','text'],['destination','Destination *','text'],['weight_kg','Weight (KG)','number']].map(([k,l,t]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <input type={t} value={booking[k]} onChange={e => setBooking(p => ({...p,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Date</label>
              <input type="date" value={booking.pickup_date} onChange={e => setBooking(p => ({...p,pickup_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cargo Type</label>
              <select value={booking.cargo_type} onChange={e => setBooking(p => ({...p,cargo_type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['general','fragile','hazardous','perishable','valuable'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button onClick={submitBooking} disabled={!booking.origin || !booking.destination} className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm w-full disabled:opacity-50">Submit Request</button>
        </div>
      )}

      {tab === 'ai' && (
        <div className="max-w-2xl bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-[500px]">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900">AI Assistant</p>
            <p className="text-xs text-gray-500">Ask about your shipments, complaints, or get logistics help</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.length === 0 && <p className="text-sm text-gray-400 text-center mt-8">Hello! Ask me anything about your shipments or logistics needs.</p>}
            {chat.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{m.role === 'user' ? 'U' : '🤖'}</div>
                <div className={`max-w-sm rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{m.text}</div>
              </div>
            ))}
            {chatLoading && <div className="flex gap-2"><div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">🤖</div><div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">Thinking…</div></div>}
            <div ref={chatEnd} />
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && !chatLoading && sendChat()} placeholder="Ask a question…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <button onClick={sendChat} disabled={chatLoading || !chatMsg.trim()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">Send</button>
          </div>
        </div>
      )}

      {tab === 'settings' && settings && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-md">
          <h3 className="font-semibold text-gray-800 mb-4">Portal Preferences</h3>
          <div className="space-y-3">
            {[['Live Tracking', 'live_tracking'],['POD Download', 'pod_download'],['Invoice Access', 'invoice_access'],['Complaint Filing', 'complaint_filing'],['Email Notifications', 'notifications.email'],['In-App Notifications', 'notifications.in_app']].map(([l, k]) => {
              const keys = k.split('.');
              const val = keys.length === 2 ? settings[keys[0]]?.[keys[1]] : settings[k];
              return (
                <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{l}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${val ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{val ? 'Enabled' : 'Disabled'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
