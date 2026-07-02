import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const _BASE = import.meta.env.VITE_API_URL || '/api';
const API = `${_BASE}/voice`;

const LANGUAGES = [
  { code: 'en', label: 'English', bcp47: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'te', label: 'తెలుగు', bcp47: 'te-IN' },
  { code: 'ta', label: 'தமிழ்', bcp47: 'ta-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
];

function WaveAnimation({ active }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 28 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: 4, borderRadius: 2, background: active ? '#16a34a' : '#cbd5e1',
          height: active ? `${10 + ((i * 7) % 18)}px` : '6px',
          transition: 'height 0.2s ease, background 0.2s ease',
          animation: active ? `lw-wave 0.9s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
        }} />
      ))}
      <style>{`@keyframes lw-wave { from { height: 6px; } to { height: 26px; } }`}</style>
    </div>
  );
}

function VoiceButton({ listening, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: listening ? '#dc2626' : '#16a34a', color: '#fff', fontSize: 28,
      boxShadow: listening ? '0 0 0 8px rgba(220,38,38,0.15)' : '0 2px 8px rgba(0,0,0,0.15)',
      transition: 'all 0.2s ease',
    }}>
      {listening ? '⏹' : '🎙'}
    </button>
  );
}

function LanguageSelector({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  );
}

function TranscriptPanel({ messages }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', borderRadius: 8, minHeight: 320, maxHeight: 420 }}>
      {messages.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>Tap the mic and ask something — e.g. "Track shipment LW123456"</div>}
      {messages.map((m, i) => (
        <div key={i} style={{ alignSelf: m.speaker === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
          <div style={{
            padding: '8px 12px', borderRadius: 12, fontSize: 14,
            background: m.speaker === 'user' ? '#16a34a' : '#fff', color: m.speaker === 'user' ? '#fff' : '#0f172a',
            border: m.speaker === 'user' ? 'none' : '1px solid #e2e8f0',
          }}>
            {m.text}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function CallControls({ onTransfer, onEnd, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={onTransfer} disabled={disabled} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Talk to agent</button>
      <button onClick={onEnd} disabled={disabled} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>End session</button>
    </div>
  );
}

export default function VoiceAssistant() {
  const [language, setLanguage] = useState('en');
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const token   = localStorage.getItem('lw_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;
  }, []);

  const ensureSession = useCallback(async () => {
    if (session) return session;
    const { data } = await axios.post(`${API}/session/start`, { channel: 'website', language }, { headers });
    setSession(data.session);
    return data.session;
  }, [session, language]);

  const speak = (text, bcp47) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = bcp47;
    window.speechSynthesis.speak(utter);
  };

  const handleTranscript = useCallback(async (text) => {
    setMessages(prev => [...prev, { speaker: 'user', text }]);
    setBusy(true);
    try {
      const sess = await ensureSession();
      const { data } = await axios.post(`${API}/respond`, { session_id: sess._id, text, category: 'customer' }, { headers });
      setMessages(prev => [...prev, { speaker: 'assistant', text: data.reply }]);
      const langMeta = LANGUAGES.find(l => l.code === sess.language) || LANGUAGES[0];
      speak(data.reply, langMeta.bcp47);
    } catch {
      setMessages(prev => [...prev, { speaker: 'assistant', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  }, [ensureSession]);

  const toggleListening = async () => {
    if (!supported) return;
    const rec = recognitionRef.current;
    if (listening) { rec.stop(); setListening(false); return; }

    await ensureSession();
    const langMeta = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
    rec.lang = langMeta.bcp47;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      handleTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const handleTransfer = async () => {
    if (!session) return;
    await axios.post(`${API}/transfer`, { session_id: session._id, reason: 'Customer requested human agent' }, { headers });
    setMessages(prev => [...prev, { speaker: 'assistant', text: 'Connecting you to a human agent now.' }]);
  };

  const handleEnd = async () => {
    if (!session) return;
    await axios.post(`${API}/session/end`, { session_id: session._id, resolution: 'resolved' }, { headers });
    setSession(null);
    setMessages([]);
  };

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Voice Assistant</h2>
        <LanguageSelector value={language} onChange={setLanguage} />
      </div>

      {!supported && (
        <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 12 }}>
          Your browser does not support voice recognition. Please use Chrome or Edge.
        </div>
      )}

      <TranscriptPanel messages={messages} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
        <CallControls onTransfer={handleTransfer} onEnd={handleEnd} disabled={!session || busy} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <WaveAnimation active={listening} />
          <VoiceButton listening={listening} onClick={toggleListening} disabled={!supported || busy} />
        </div>
        <div style={{ width: 140 }} />
      </div>
    </div>
  );
}
