import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

const MATERIALS = ['General / Mixed', 'Electronics', 'Machinery / Equipment', 'Textiles / Garments', 'Furniture / Home', 'Perishables / Food', 'Pharmaceuticals', 'Chemicals', 'Automobile Parts', 'Construction Materials', 'Documents / Papers', 'Fragile / Glassware'];
const PRIORITIES = [
  { val: 'standard', label: 'Standard',  desc: 'Regular delivery',         icon: '📦' },
  { val: 'express',  label: 'Express',   desc: '+25% surcharge, faster',   icon: '⚡' },
  { val: 'premium',  label: 'Premium',   desc: '+50% surcharge, priority', icon: '🌟' },
];

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

const INIT = {
  pickup_address: '', pickup_pincode: '', pickup_city: '', pickup_state: '',
  destination_address: '', destination_pincode: '', destination_city: '', destination_state: '',
  distance_km: '', pickup_date: '', pickup_time: '', delivery_priority: 'standard',
  material_type: 'General / Mixed', commodity: '',
  weight_kg: '', length_cm: '', width_cm: '', height_cm: '',
  packages: '1', declared_value: '',
  insurance_required: false, loading_required: false, unloading_required: false,
  customer_name: '', customer_phone: '', customer_email: '', customer_gstin: '',
};

function StepBar({ step, total = 3 }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1;
        const done   = s < step;
        const active = s === step;
        const labels = ['Route', 'Shipment', 'Contact'];
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-blue-600 text-white' : active ? 'bg-white text-blue-700 ring-2 ring-blue-600 shadow-sm' : 'bg-gray-200 text-gray-500'
              }`}>
                {done ? '✓' : s}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-blue-700' : done ? 'text-blue-500' : 'text-gray-400'}`}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

function QuoteResult({ quote, onReset }) {
  const printRef = useRef();
  const navigate = useNavigate();
  const [converting, setConverting] = useState(false);

  const validity = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '7 days';

  function handlePrint() { window.print(); }

  function handleWhatsApp() {
    const lines = [
      `🚛 *LocalWheels Freight Quote*`,
      `Quote #: *${quote.quote_number}*`,
      `Valid till: ${validity}`,
      ``,
      `📍 ${quote.pickup_city || quote.pickup_pincode} → ${quote.destination_city || quote.destination_pincode}`,
      `Vehicle: ${quote.vehicle_type}`,
      `Weight: ${quote.chargeable_weight_kg} kg | ${quote.packages} pkg`,
      `Distance: ~${quote.estimated_distance_km} km`,
      `Transit: ${quote.transit_days}`,
      ``,
      `💰 *Grand Total: ${fmt(quote.grand_total)}*`,
      `(incl. GST ${fmt(quote.gst_amount)})`,
      ``,
      `Book now: https://localwheels.in`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  function handleEmail() {
    const subject = `LocalWheels Quote #${quote.quote_number}`;
    const body = [
      `Dear ${quote.customer_name},`,
      ``,
      `Your freight quotation is ready.`,
      ``,
      `Quote Number: ${quote.quote_number}`,
      `Route: ${quote.pickup_city || quote.pickup_pincode} to ${quote.destination_city || quote.destination_pincode}`,
      `Vehicle: ${quote.vehicle_type} (${quote.vehicle_capacity_label})`,
      `Distance: ~${quote.estimated_distance_km} km`,
      `Transit Time: ${quote.transit_days}`,
      ``,
      `Freight:    ${fmt(quote.base_freight)}`,
      `Distance:   ${fmt(quote.distance_charges)}`,
      `Fuel:       ${fmt(quote.fuel_surcharge)}`,
      `Toll:       ${fmt(quote.toll_charges)}`,
      `Express:    ${fmt(quote.express_charges)}`,
      `Subtotal:   ${fmt(quote.subtotal)}`,
      `GST (${quote.gst_rate}%): ${fmt(quote.gst_amount)}`,
      `Insurance:  ${fmt(quote.insurance_amount)}`,
      `Loading:    ${fmt(quote.loading_charges)}`,
      `Unloading:  ${fmt(quote.unloading_charges)}`,
      ``,
      `GRAND TOTAL: ${fmt(quote.grand_total)}`,
      ``,
      `Valid until: ${validity}`,
      ``,
      `To book, contact LocalWheels or visit our website.`,
      `Thank you for choosing LocalWheels!`,
    ].join('\n');
    window.open(`mailto:${quote.customer_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }

  async function handleConvert() {
    setConverting(true);
    try {
      const token = localStorage.getItem('lw_token');
      if (!token) { navigate('/login'); return; }
      const { data: { data } } = await api.patch(`/quotes/${quote.quote_number}/convert`);
      alert(`✅ Booking created! LR Number: ${data.lr_number}`);
      navigate('/shipments');
    } catch (e) {
      alert(e.response?.data?.message || 'Conversion failed. Please log in as staff to convert.');
      navigate('/login');
    } finally { setConverting(false); }
  }

  const breakdown = [
    ['Base Freight',     quote.base_freight],
    ['Distance Charges', quote.distance_charges],
    ['Fuel Surcharge',   quote.fuel_surcharge],
    ['Toll Charges',     quote.toll_charges],
    quote.state_tax   > 0 ? ['State Tax',      quote.state_tax]   : null,
    quote.express_charges > 0 ? ['Express / Priority', quote.express_charges] : null,
  ].filter(Boolean);

  return (
    <div ref={printRef} className="space-y-4">
      {/* Quote header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-5 text-white print:bg-white print:text-gray-900 print:border print:border-gray-900">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider print:text-gray-500">LocalWheels Freight Quotation</p>
            <p className="text-2xl font-bold mt-0.5">{quote.quote_number}</p>
            <p className="text-blue-200 text-sm mt-1 print:text-gray-600">
              {quote.pickup_city || quote.pickup_pincode} → {quote.destination_city || quote.destination_pincode}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs print:text-gray-500">Grand Total</p>
            <p className="text-3xl font-bold">{fmt(quote.grand_total)}</p>
            <p className="text-blue-200 text-xs mt-0.5 print:text-gray-500">Valid till {validity}</p>
          </div>
        </div>
      </div>

      {/* Vehicle + route summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Vehicle',   `${quote.vehicle_type} (${quote.vehicle_capacity_label})`],
          ['Distance',  `~${quote.estimated_distance_km} km${quote.distance_source === 'google_maps' ? ' (Google)' : quote.distance_source === 'estimated' ? ' (est.)' : ''}`],
          ['Transit',   quote.transit_days],
          ['Priority',  quote.delivery_priority?.charAt(0).toUpperCase() + quote.delivery_priority?.slice(1)],
        ].map(([label, val]) => (
          <div key={label} className="bg-blue-50 rounded-xl p-3 print:border print:border-gray-200">
            <p className="text-[10px] font-semibold text-blue-600 uppercase">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{val}</p>
          </div>
        ))}
      </div>

      {/* Pricing breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing Breakdown</p>
        </div>
        <div className="divide-y divide-gray-100">
          {breakdown.map(([label, val]) => (
            <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium text-gray-800">{fmt(val)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-4 py-2.5 text-sm bg-gray-50">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-semibold">{fmt(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5 text-sm">
            <span className="text-gray-600">GST ({quote.gst_rate}%)</span>
            <span className="font-medium text-gray-800">{fmt(quote.gst_amount)}</span>
          </div>
          {quote.insurance_amount > 0 && (
            <div className="flex justify-between items-center px-4 py-2.5 text-sm">
              <span className="text-gray-600">Insurance (0.5% of declared value)</span>
              <span className="font-medium text-gray-800">{fmt(quote.insurance_amount)}</span>
            </div>
          )}
          {quote.loading_charges > 0 && (
            <div className="flex justify-between items-center px-4 py-2.5 text-sm">
              <span className="text-gray-600">Loading Charges</span>
              <span className="font-medium text-gray-800">{fmt(quote.loading_charges)}</span>
            </div>
          )}
          {quote.unloading_charges > 0 && (
            <div className="flex justify-between items-center px-4 py-2.5 text-sm">
              <span className="text-gray-600">Unloading Charges</span>
              <span className="font-medium text-gray-800">{fmt(quote.unloading_charges)}</span>
            </div>
          )}
          {quote.customer_discount_amount > 0 && (
            <div className="flex justify-between items-center px-4 py-2.5 text-sm bg-green-50">
              <span className="text-green-700 font-medium">
                {quote.customer_discount_label || 'Customer Discount'} <span className="text-green-500 text-xs">(applied)</span>
              </span>
              <span className="font-semibold text-green-700">− {fmt(quote.customer_discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center px-4 py-3 bg-blue-700 text-white">
            <span className="font-bold text-base">Grand Total</span>
            <span className="font-bold text-xl">{fmt(quote.grand_total)}</span>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      {(quote.ai_vehicle_recommendation || quote.ai_risk_assessment) && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100 print:bg-white">
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">AI Analysis</p>
          <div className="space-y-2.5">
            {quote.ai_vehicle_recommendation && (
              <div className="flex gap-2.5">
                <span className="text-lg flex-shrink-0">🚛</span>
                <p className="text-sm text-gray-700">{quote.ai_vehicle_recommendation}</p>
              </div>
            )}
            {quote.ai_risk_assessment && (
              <div className="flex gap-2.5">
                <span className="text-lg flex-shrink-0">⚠️</span>
                <p className="text-sm text-gray-700">{quote.ai_risk_assessment}</p>
              </div>
            )}
            {quote.ai_insurance_note && (
              <div className="flex gap-2.5">
                <span className="text-lg flex-shrink-0">🛡️</span>
                <p className="text-sm text-gray-700">{quote.ai_insurance_note}</p>
              </div>
            )}
            {quote.ai_handling_note && (
              <div className="flex gap-2.5">
                <span className="text-lg flex-shrink-0">📋</span>
                <p className="text-sm text-gray-700">{quote.ai_handling_note}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Upsell Suggestions */}
      {quote.ai_upsell_suggestions && quote.ai_upsell_suggestions.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100 print:hidden">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">Recommended Add-ons</p>
          <div className="space-y-2.5">
            {quote.ai_upsell_suggestions.map((item, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-lg flex-shrink-0">✨</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.service}
                    {item.price_hint && <span className="ml-2 text-xs text-gray-400 font-normal">{item.price_hint}</span>}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Cost Tip */}
      {quote.ai_cost_tip && (
        <div className="flex items-start gap-2.5 bg-amber-50 rounded-xl p-3.5 border border-amber-100 print:hidden">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-sm text-amber-800">{quote.ai_cost_tip}</p>
        </div>
      )}

      {/* Alternatives */}
      {quote.alternatives && quote.alternatives.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alternative Vehicle Options</p>
          </div>
          <div className="divide-y divide-gray-100">
            {quote.alternatives.map((alt, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{alt.vehicle_type}</p>
                  <p className="text-xs text-gray-400">{alt.vehicle_capacity} · {alt.transit_days}</p>
                </div>
                <p className="font-bold text-gray-700">{fmt(alt.grand_total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipment + Customer details for print */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:block">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Shipment</p>
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="text-gray-400">Material:</span> {quote.material_type}</p>
            <p><span className="text-gray-400">Weight:</span> {quote.weight_kg} kg (chargeable: {quote.chargeable_weight_kg} kg)</p>
            <p><span className="text-gray-400">Packages:</span> {quote.packages}</p>
            {quote.declared_value > 0 && <p><span className="text-gray-400">Declared Value:</span> {fmt(quote.declared_value)}</p>}
            {quote.pickup_date && <p><span className="text-gray-400">Pickup Date:</span> {new Date(quote.pickup_date).toLocaleDateString('en-IN')}</p>}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Customer</p>
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="text-gray-400">Name:</span> {quote.customer_name}</p>
            <p><span className="text-gray-400">Phone:</span> {quote.customer_phone}</p>
            {quote.customer_email && <p><span className="text-gray-400">Email:</span> {quote.customer_email}</p>}
            {quote.customer_gstin && <p><span className="text-gray-400">GSTIN:</span> {quote.customer_gstin}</p>}
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-400 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
        <strong className="text-gray-500">Terms &amp; Conditions:</strong> This quotation is valid for 7 days from the date of issue. Prices are indicative and subject to revision based on actual weight, distance, and applicable taxes. GST at 18% applicable. Insurance is optional and based on declared value at 0.5%. Toll charges may vary by route. LocalWheels reserves the right to amend pricing.
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 no-print">
        <button onClick={handlePrint}     className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">🖨️ Print / PDF</button>
        <button onClick={handleWhatsApp}  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">📱 WhatsApp</button>
        <button onClick={handleEmail}     className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">✉️ Email</button>
        <button onClick={handleConvert}   disabled={converting} className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors disabled:opacity-50">
          {converting ? '⏳ Converting…' : '📋 Book Now'}
        </button>
        <button onClick={onReset}         className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">🔄 New Quote</button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; }
          .print\\:bg-white { background: white !important; color: #000 !important; }
          .print\\:text-gray-900 { color: #111 !important; }
          .print\\:border { border: 1px solid #000 !important; }
          .print\\:border-gray-200 { border-color: #ddd !important; }
          .print\\:text-gray-500 { color: #666 !important; }
          .print\\:text-gray-600 { color: #555 !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export default function QuoteGenerator() {
  const { number } = useParams();
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState(INIT);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [quote, setQuote]     = useState(null);
  const [apiError, setApiError] = useState('');

  // View existing quote by number
  useEffect(() => {
    if (!number) return;
    setLoading(true);
    api.get(`/quotes/${number.toUpperCase()}`)
      .then(r => setQuote(r.data.data))
      .catch(() => setApiError('Quote not found or expired.'))
      .finally(() => setLoading(false));
  }, [number]);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.pickup_pincode) e.pickup_pincode = 'Required';
      if (!form.destination_pincode) e.destination_pincode = 'Required';
      if (form.pickup_pincode && !/^\d{6}$/.test(form.pickup_pincode)) e.pickup_pincode = 'Must be 6 digits';
      if (form.destination_pincode && !/^\d{6}$/.test(form.destination_pincode)) e.destination_pincode = 'Must be 6 digits';
      if (!form.pickup_date) e.pickup_date = 'Required';
    }
    if (s === 2) {
      if (!form.weight_kg || Number(form.weight_kg) <= 0) e.weight_kg = 'Required, must be > 0';
      if (!form.packages || Number(form.packages) < 1) e.packages = 'At least 1';
    }
    if (s === 3) {
      if (!form.customer_name)  e.customer_name  = 'Required';
      if (!form.customer_phone) e.customer_phone = 'Required';
      if (form.customer_phone && !/^\d{10}$/.test(form.customer_phone)) e.customer_phone = 'Must be 10 digits';
      if (form.customer_email && !/\S+@\S+\.\S+/.test(form.customer_email)) e.customer_email = 'Invalid email';
    }
    return e;
  }

  function next() {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(s => s + 1);
  }

  async function submit() {
    const e = validateStep(3);
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiError('');
    try {
      const { data: { data } } = await api.post('/quotes', {
        ...form,
        weight_kg: Number(form.weight_kg),
        packages:  Number(form.packages),
        declared_value: form.declared_value ? Number(form.declared_value) : 0,
        distance_km: form.distance_km ? Number(form.distance_km) : 0,
      });
      setQuote(data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to generate quote. Please try again.');
    } finally { setLoading(false); }
  }

  if (loading && number) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b2557] to-[#0b8fd3] flex items-center justify-center">
        <div className="text-white text-center"><div className="text-4xl mb-3 animate-spin">⏳</div><p>Loading quote…</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b2557] via-[#0b5fa8] to-[#0b8fd3] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 flex-shrink-0">
            <rect width="48" height="48" rx="6" fill="#fff2e8"/>
            <text x="3" y="20" fontSize="9" fontWeight="bold" fill="#e65c00" fontFamily="Arial">LOCAL</text>
            <text x="3" y="30" fontSize="9" fontWeight="bold" fill="#e65c00" fontFamily="Arial">WHEELS</text>
            <path d="M32 16 L42 28 L22 28 Z" fill="#f97316" opacity="0.9"/>
            <circle cx="29" cy="33" r="3" fill="#374151"/>
            <circle cx="38" cy="33" r="3" fill="#374151"/>
          </svg>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight">LocalWheels</p>
            <p className="text-blue-200 text-[11px]">Freight Quote Generator</p>
          </div>
        </div>
        <Link to="/login" className="text-blue-200 hover:text-white text-sm underline">Staff Login</Link>
      </header>

      <div className="flex-1 px-4 sm:px-8 pb-8">
        <div className="max-w-2xl mx-auto">
          {!quote && !number && (
            <div className="text-center mb-6">
              <h1 className="text-white text-2xl sm:text-3xl font-bold">Get Instant Freight Quote</h1>
              <p className="text-blue-200 text-sm mt-1">AI-powered pricing in under 10 seconds</p>
            </div>
          )}

          {apiError && (
            <div className="mb-4 bg-red-100 text-red-700 rounded-xl p-4 text-sm font-medium text-center">{apiError}</div>
          )}

          {/* Show existing or generated quote */}
          {quote ? (
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
              <QuoteResult quote={quote} onReset={() => { setQuote(null); setForm(INIT); setStep(1); }} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6">
              {!number && <StepBar step={step} />}

              {/* Step 1: Route */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-base font-bold text-gray-800 mb-3">📍 Route Details</p>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Pickup Pincode" required error={errors.pickup_pincode}>
                      <input className={inp} placeholder="e.g. 400001" maxLength={6}
                        value={form.pickup_pincode} onChange={e => set('pickup_pincode', e.target.value.replace(/\D/g, ''))} />
                    </Field>
                    <Field label="Pickup City">
                      <input className={inp} placeholder="City" value={form.pickup_city} onChange={e => set('pickup_city', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Pickup Address">
                    <input className={inp} placeholder="Street, Area" value={form.pickup_address} onChange={e => set('pickup_address', e.target.value)} />
                  </Field>

                  <div className="relative flex items-center my-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="px-3 text-gray-400 text-xs">↓</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Destination Pincode" required error={errors.destination_pincode}>
                      <input className={inp} placeholder="e.g. 110001" maxLength={6}
                        value={form.destination_pincode} onChange={e => set('destination_pincode', e.target.value.replace(/\D/g, ''))} />
                    </Field>
                    <Field label="Destination City">
                      <input className={inp} placeholder="City" value={form.destination_city} onChange={e => set('destination_city', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Destination Address">
                    <input className={inp} placeholder="Street, Area" value={form.destination_address} onChange={e => set('destination_address', e.target.value)} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Distance (km)" error={errors.distance_km}>
                      <input className={inp} type="number" placeholder="Leave blank to auto-estimate"
                        value={form.distance_km} onChange={e => set('distance_km', e.target.value)} />
                    </Field>
                    <Field label="Pickup Date" required error={errors.pickup_date}>
                      <input className={inp} type="date" min={new Date().toISOString().split('T')[0]}
                        value={form.pickup_date} onChange={e => set('pickup_date', e.target.value)} />
                    </Field>
                  </div>

                  <Field label="Delivery Priority">
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {PRIORITIES.map(p => (
                        <button key={p.val} type="button"
                          onClick={() => set('delivery_priority', p.val)}
                          className={`border-2 rounded-xl p-2.5 text-left transition-all ${form.delivery_priority === p.val ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                          <div className="text-xl mb-1">{p.icon}</div>
                          <div className="text-xs font-bold text-gray-800">{p.label}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* Step 2: Shipment */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-base font-bold text-gray-800 mb-3">📦 Shipment Details</p>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Material Type">
                      <select className={inp} value={form.material_type} onChange={e => set('material_type', e.target.value)}>
                        {MATERIALS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Commodity Description">
                      <input className={inp} placeholder="e.g. Laptops, Steel rods…" value={form.commodity} onChange={e => set('commodity', e.target.value)} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Total Weight (kg)" required error={errors.weight_kg}>
                      <input className={inp} type="number" min="0.1" step="0.1" placeholder="e.g. 500"
                        value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
                    </Field>
                    <Field label="No. of Packages" required error={errors.packages}>
                      <input className={inp} type="number" min="1"
                        value={form.packages} onChange={e => set('packages', e.target.value)} />
                    </Field>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Dimensions (cm) <span className="text-gray-400 font-normal normal-case">(optional — for volumetric weight)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[['length_cm', 'Length'], ['width_cm', 'Width'], ['height_cm', 'Height']].map(([key, ph]) => (
                        <input key={key} className={inp} type="number" min="0" placeholder={ph}
                          value={form[key]} onChange={e => set(key, e.target.value)} />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Volumetric weight = (L × W × H) ÷ 5000. Chargeable = max(actual, volumetric).</p>
                  </div>

                  <Field label="Declared Value (₹)">
                    <input className={inp} type="number" min="0" placeholder="e.g. 100000 (required for insurance)"
                      value={form.declared_value} onChange={e => set('declared_value', e.target.value)} />
                  </Field>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Additional Services</p>
                    <div className="space-y-2">
                      {[
                        ['insurance_required', '🛡️', 'Insurance (0.5% of declared value)', 'Covers loss/damage in transit'],
                        ['loading_required',   '📤', 'Loading Assistance', 'Labour to load goods at pickup'],
                        ['unloading_required', '📥', 'Unloading Assistance', 'Labour to unload goods at destination'],
                      ].map(([key, icon, label, sub]) => (
                        <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form[key] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                          <input type="checkbox" className="sr-only" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                          <span className="text-xl">{icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{label}</p>
                            <p className="text-xs text-gray-400">{sub}</p>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${form[key] ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                            {form[key] && <span className="text-white text-xs">✓</span>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contact */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-base font-bold text-gray-800 mb-3">👤 Your Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full Name" required error={errors.customer_name}>
                      <input className={inp} placeholder="Your name"
                        value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
                    </Field>
                    <Field label="Mobile Number" required error={errors.customer_phone}>
                      <input className={inp} type="tel" placeholder="10-digit mobile" maxLength={10}
                        value={form.customer_phone} onChange={e => set('customer_phone', e.target.value.replace(/\D/g, ''))} />
                    </Field>
                  </div>
                  <Field label="Email Address" error={errors.customer_email}>
                    <input className={inp} type="email" placeholder="For quote delivery via email"
                      value={form.customer_email} onChange={e => set('customer_email', e.target.value)} />
                  </Field>
                  <Field label="GSTIN (Optional)">
                    <input className={inp} placeholder="27AAAAA0000A1Z5" maxLength={15}
                      value={form.customer_gstin} onChange={e => set('customer_gstin', e.target.value.toUpperCase())} />
                  </Field>

                  {/* Summary */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-1.5 text-sm">
                    <p className="font-bold text-blue-800 text-xs uppercase tracking-wide mb-2">Quote Summary</p>
                    <p className="text-gray-700">📍 {form.pickup_pincode} → {form.destination_pincode} {form.distance_km ? `(${form.distance_km} km)` : '(distance auto-estimated)'}</p>
                    <p className="text-gray-700">📦 {form.weight_kg} kg · {form.packages} pkg · {form.material_type}</p>
                    <p className="text-gray-700">🚀 {form.delivery_priority?.charAt(0).toUpperCase() + form.delivery_priority?.slice(1)} delivery on {form.pickup_date}</p>
                    {(form.insurance_required || form.loading_required || form.unloading_required) && (
                      <p className="text-gray-700">🛡️ {[form.insurance_required && 'Insurance', form.loading_required && 'Loading', form.unloading_required && 'Unloading'].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50">
                    ← Back
                  </button>
                )}
                {step < 3 && (
                  <button onClick={next} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                    Next →
                  </button>
                )}
                {step === 3 && (
                  <button onClick={submit} disabled={loading} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? (
                      <><span className="animate-spin">⏳</span> Generating Quote…</>
                    ) : (
                      '✨ Get My Quote'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-4 text-blue-200 text-xs">
        © {new Date().getFullYear()} LocalWheels Pvt Ltd · <Link to="/track" className="hover:text-white underline">Track Shipment</Link>
      </footer>
    </div>
  );
}
