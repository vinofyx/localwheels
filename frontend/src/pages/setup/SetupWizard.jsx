import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';

const STEPS = [
  { id: 1, label: 'Company Info',    icon: '🏢' },
  { id: 2, label: 'Business Details', icon: '📋' },
  { id: 3, label: 'Branch Setup',    icon: '📍' },
  { id: 4, label: 'Communication',   icon: '📧' },
  { id: 5, label: 'Branding',        icon: '🎨' },
  { id: 6, label: 'Go Live',         icon: '🚀' },
];

const inp = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0b8fd3]';
const lbl = 'block text-sm font-medium text-gray-700 mb-1';

function Field({ label, required, children }) {
  return (
    <div>
      <label className={lbl}>{required && <span className="text-red-500 mr-1">*</span>}{label}</label>
      {children}
    </div>
  );
}

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // Step 1 — Company Info
    name: '', phone: '', email: '', website: '',
    address: '', city: '', state: '', pincode: '', country: 'India',
    // Step 2 — Business Details
    gstin: '', pan: '', cin: '',
    business_type: 'transport',
    financial_year_start: 'April',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    // Step 3 — Branch (read-only display)
    branch_name: '',
    // Step 4 — Communication
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_from: '',
    sms_provider: 'none', sms_api_key: '', sms_sender_id: '',
    whatsapp_provider: 'none', whatsapp_api_key: '', whatsapp_number: '',
    // Step 5 — Branding
    brand_name: '', primary_color: '#0b8fd3', logo_url: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setE = e => set(e.target.name, e.target.value);

  // Load current company data
  useEffect(() => {
    api.get('/companies/mine').then(r => {
      const c = r.data;
      setForm(f => ({
        ...f,
        name:          c.name || '',
        phone:         c.phone || '',
        email:         c.email || '',
        website:       c.website || '',
        address:       c.address || '',
        city:          c.city || '',
        state:         c.state || '',
        pincode:       c.pincode || '',
        gstin:         c.gstin || '',
        pan:           c.pan || '',
        business_type: c.business_type || 'transport',
        currency:      c.currency || 'INR',
        timezone:      c.timezone || 'Asia/Kolkata',
        financial_year_start: c.financial_year_start || 'April',
        brand_name:    c.brand_name || '',
        primary_color: c.primary_color || '#0b8fd3',
        logo_url:      c.logo_url || '',
      }));
      if (c.setup_step) setStep(Math.min(c.setup_step + 1, 6));
    }).catch(() => {});
  }, []);

  async function saveStep(nextStep) {
    setSaving(true);
    try {
      // Build payload for current step
      const payload = { setup_step: step };

      if (step === 1) {
        if (!form.name.trim()) { toast.error('Company name is required'); setSaving(false); return; }
        Object.assign(payload, { name: form.name, phone: form.phone, email: form.email, website: form.website, address: form.address, city: form.city, state: form.state, pincode: form.pincode, country: form.country });
      }
      if (step === 2) {
        Object.assign(payload, { gstin: form.gstin, pan: form.pan, cin: form.cin, business_type: form.business_type, financial_year_start: form.financial_year_start, currency: form.currency, timezone: form.timezone });
      }
      if (step === 4) {
        // Save communication settings separately
        try {
          await api.put('/companies/settings', {
            smtp: { host: form.smtp_host, port: parseInt(form.smtp_port) || 587, user: form.smtp_user, from: form.smtp_from, enabled: !!form.smtp_host },
            sms:  { provider: form.sms_provider, api_key: form.sms_api_key, sender_id: form.sms_sender_id, enabled: form.sms_provider !== 'none' },
            whatsapp: { provider: form.whatsapp_provider, api_key: form.whatsapp_api_key, phone_number: form.whatsapp_number, enabled: form.whatsapp_provider !== 'none' },
          });
        } catch { /* non-fatal */ }
      }
      if (step === 5) {
        Object.assign(payload, { brand_name: form.brand_name, primary_color: form.primary_color, logo_url: form.logo_url });
      }

      await api.put('/companies/mine', payload);

      if (nextStep > 6) {
        // Final step — mark setup complete
        await api.put('/companies/mine', { setup_completed: true });
        toast.success('Setup complete! Welcome to LocalWheels.');
        navigate('/dashboard');
      } else {
        setStep(nextStep);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-start py-8 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-3xl font-bold text-[#0b8fd3] mb-1">LocalWheels</div>
        <p className="text-gray-500 text-sm">Let's set up your company in a few quick steps</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0 mb-8 w-full max-w-3xl overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center min-w-[80px]">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                s.id < step  ? 'bg-[#0b8fd3] border-[#0b8fd3] text-white' :
                s.id === step ? 'bg-white border-[#0b8fd3] text-[#0b8fd3]' :
                                'bg-white border-gray-300 text-gray-400'
              }`}>
                {s.id < step ? '✓' : s.id}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight ${s.id === step ? 'text-[#0b8fd3] font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 ${s.id < step ? 'bg-[#0b8fd3]' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl p-8">
        <h2 className="text-lg font-bold text-gray-800 mb-1">{STEPS[step - 1].icon} {STEPS[step - 1].label}</h2>
        <p className="text-gray-500 text-sm mb-6">Step {step} of {STEPS.length}</p>

        {/* ── Step 1: Company Info ─────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Company Name" required>
                <input name="name" value={form.name} onChange={setE} className={inp} placeholder="e.g. Shree Logistics Pvt Ltd" />
              </Field>
            </div>
            <Field label="Phone">
              <input name="phone" value={form.phone} onChange={setE} className={inp} placeholder="9999000000" />
            </Field>
            <Field label="Email">
              <input name="email" type="email" value={form.email} onChange={setE} className={inp} placeholder="info@company.com" />
            </Field>
            <div className="col-span-2">
              <Field label="Website">
                <input name="website" value={form.website} onChange={setE} className={inp} placeholder="https://www.company.com" />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Address">
                <input name="address" value={form.address} onChange={setE} className={inp} placeholder="Street address" />
              </Field>
            </div>
            <Field label="City">
              <input name="city" value={form.city} onChange={setE} className={inp} placeholder="Mumbai" />
            </Field>
            <Field label="State">
              <input name="state" value={form.state} onChange={setE} className={inp} placeholder="Maharashtra" />
            </Field>
            <Field label="PIN Code">
              <input name="pincode" value={form.pincode} onChange={setE} className={inp} placeholder="400001" />
            </Field>
            <Field label="Country">
              <input name="country" value={form.country} onChange={setE} className={inp} />
            </Field>
          </div>
        )}

        {/* ── Step 2: Business Details ─────────────────────────────── */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="GSTIN">
              <input name="gstin" value={form.gstin} onChange={setE} className={inp} placeholder="27ABCDE1234F1Z5" />
            </Field>
            <Field label="PAN">
              <input name="pan" value={form.pan} onChange={setE} className={inp} placeholder="ABCDE1234F" />
            </Field>
            <Field label="CIN (optional)">
              <input name="cin" value={form.cin} onChange={setE} className={inp} placeholder="U12345MH2020PTC123456" />
            </Field>
            <Field label="Business Type" required>
              <select name="business_type" value={form.business_type} onChange={setE} className={inp}>
                <option value="transport">Transport</option>
                <option value="logistics">Logistics</option>
                <option value="courier">Courier</option>
                <option value="freight">Freight Forwarding</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Financial Year Starts" required>
              <select name="financial_year_start" value={form.financial_year_start} onChange={setE} className={inp}>
                <option value="April">April (India Standard)</option>
                <option value="January">January</option>
                <option value="July">July</option>
                <option value="October">October</option>
              </select>
            </Field>
            <Field label="Currency">
              <select name="currency" value={form.currency} onChange={setE} className={inp}>
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Timezone">
                <select name="timezone" value={form.timezone} onChange={setE} className={inp}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 3: Branch Setup ─────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-[#e8f4fb] rounded-lg p-4 border border-[#0b8fd3]/20">
              <p className="text-sm text-[#0b8fd3] font-medium mb-1">✅ Default Branch Created</p>
              <p className="text-sm text-gray-600">
                A <strong>Head Office</strong> branch was automatically created when your company was set up.
                You can rename it or add more branches from <strong>Settings → Branches</strong> after setup.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Pre-configured master data:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>10 vehicle types (Mini Truck, Container, etc.)</li>
                <li>8 shipment types (FTL, LTL, Express, etc.)</li>
                <li>9 package types (Box, Pallet, Drum, etc.)</li>
                <li>10 complaint categories</li>
                <li>8 departments</li>
                <li>5 GST tax slabs</li>
                <li>42 standard chart of accounts</li>
                <li>9 notification templates</li>
              </ul>
              <p className="text-xs text-gray-400 mt-2">All of these can be customized from your settings.</p>
            </div>
          </div>
        )}

        {/* ── Step 4: Communication ────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            {/* SMTP */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Email (SMTP)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SMTP Host">
                  <input name="smtp_host" value={form.smtp_host} onChange={setE} className={inp} placeholder="smtp.gmail.com" />
                </Field>
                <Field label="Port">
                  <input name="smtp_port" value={form.smtp_port} onChange={setE} className={inp} placeholder="587" />
                </Field>
                <Field label="Username">
                  <input name="smtp_user" value={form.smtp_user} onChange={setE} className={inp} placeholder="you@company.com" />
                </Field>
                <Field label="From Address">
                  <input name="smtp_from" value={form.smtp_from} onChange={setE} className={inp} placeholder="noreply@company.com" />
                </Field>
              </div>
            </div>
            {/* SMS */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">SMS Provider</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Provider">
                  <select name="sms_provider" value={form.sms_provider} onChange={setE} className={inp}>
                    <option value="none">Not Configured</option>
                    <option value="msg91">MSG91</option>
                    <option value="twilio">Twilio</option>
                    <option value="textlocal">TextLocal</option>
                  </select>
                </Field>
                <Field label="Sender ID">
                  <input name="sms_sender_id" value={form.sms_sender_id} onChange={setE} className={inp} placeholder="LCLWHL" />
                </Field>
              </div>
            </div>
            {/* WhatsApp */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">WhatsApp Business</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Provider">
                  <select name="whatsapp_provider" value={form.whatsapp_provider} onChange={setE} className={inp}>
                    <option value="none">Not Configured</option>
                    <option value="wati">WATI</option>
                    <option value="interakt">Interakt</option>
                    <option value="twilio">Twilio</option>
                  </select>
                </Field>
                <Field label="WhatsApp Number">
                  <input name="whatsapp_number" value={form.whatsapp_number} onChange={setE} className={inp} placeholder="+919999000000" />
                </Field>
              </div>
            </div>
            <p className="text-xs text-gray-400">You can skip this step and configure communication settings later from Settings → Communication.</p>
          </div>
        )}

        {/* ── Step 5: Branding ─────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Name">
                <input name="brand_name" value={form.brand_name} onChange={setE} className={inp} placeholder="Your brand name for documents" />
              </Field>
              <Field label="Primary Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => set('primary_color', e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    name="primary_color"
                    value={form.primary_color}
                    onChange={setE}
                    className={`${inp} flex-1`}
                    placeholder="#0b8fd3"
                  />
                </div>
              </Field>
              <div className="col-span-2">
                <Field label="Logo URL">
                  <input name="logo_url" value={form.logo_url} onChange={setE} className={inp} placeholder="https://yourcompany.com/logo.png" />
                </Field>
                <p className="text-xs text-gray-400 mt-1">Enter a public URL to your logo. You can also upload a logo file from Settings → Branding later.</p>
              </div>
            </div>
            {/* Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-10 w-10 object-contain rounded" />
                ) : (
                  <div className="h-10 w-10 rounded flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: form.primary_color }}>
                    {(form.brand_name || form.name || 'LW')[0]}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm" style={{ color: form.primary_color }}>{form.brand_name || form.name || 'Company Name'}</p>
                  <p className="text-xs text-gray-400">LocalWheels Platform</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 6: Go Live ──────────────────────────────────────── */}
        {step === 6 && (
          <div className="space-y-4 text-center">
            <div className="text-5xl mb-2">🎉</div>
            <h3 className="text-xl font-bold text-gray-800">You're ready to go!</h3>
            <p className="text-gray-500 text-sm">Your company is fully configured. Here's what's been set up:</p>
            <div className="grid grid-cols-2 gap-3 text-left mt-4">
              {[
                ['✅', 'Company profile created'],
                ['✅', 'Default branch ready'],
                ['✅', 'Admin account active'],
                ['✅', 'Chart of Accounts (42 accounts)'],
                ['✅', 'Vehicle & shipment types'],
                ['✅', 'Notification templates'],
                ['✅', 'Complaint categories'],
                ['✅', 'Tax configuration'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2 text-sm text-gray-700">
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#e8f4fb] rounded-lg p-4 text-left mt-4">
              <p className="text-sm font-medium text-[#0b8fd3] mb-2">Next steps after going live:</p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Import your customers (Config → Import Utility)</li>
                <li>Add your vehicles and drivers</li>
                <li>Create your first shipment</li>
                <li>Invite your team members</li>
              </ol>
            </div>
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────── */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1 || saving}
            className="px-5 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            onClick={() => saveStep(step + 1)}
            disabled={saving}
            className="px-6 py-2 bg-[#0b8fd3] hover:bg-[#0a7ab8] text-white rounded text-sm font-medium disabled:opacity-60"
          >
            {saving ? 'Saving…' : step === 6 ? '🚀 Go Live' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
