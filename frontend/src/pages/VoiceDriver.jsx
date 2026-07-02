import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

const QUICK_COMMANDS = [
  { label: 'Start Trip',           icon: '🚀', cmd: 'Start trip' },
  { label: 'Reached Pickup',       icon: '📦', cmd: 'Reached pickup' },
  { label: 'Reached Destination',  icon: '🏁', cmd: 'Reached destination' },
  { label: 'Upload POD',           icon: '📋', cmd: 'Upload POD' },
  { label: 'Report Delay',         icon: '⏰', cmd: 'Report delay' },
  { label: 'Report Breakdown',     icon: '🔧', cmd: 'Report breakdown' },
  { label: 'Find Fuel Station',    icon: '⛽', cmd: 'Find fuel station' },
  { label: 'Find Workshop',        icon: '🏭', cmd: 'Find nearest workshop' },
  { label: 'Call Dispatcher',      icon: '📞', cmd: 'Call dispatcher' },
  { label: 'Complete Trip',        icon: '✅', cmd: 'Complete trip' },
  { label: 'SOS Emergency',        icon: '🚨', cmd: 'SOS emergency help' },
  { label: 'Reached Warehouse',    icon: '🏢', cmd: 'Reached warehouse' },
];

const ACTION_HANDLERS = {
  start_trip:          { nav: '/driver/trips', color: 'green',  label: '→ Go to Trips to start' },
  reached_pickup:      { nav: null,            color: 'blue',   label: '' },
  reached_warehouse:   { nav: null,            color: 'blue',   label: '' },
  reached_destination: { nav: '/driver/pod',   color: 'blue',   label: '→ Open POD screen' },
  upload_pod:          { nav: '/driver/pod',   color: 'green',  label: '→ Open POD screen' },
  report_delay:        { nav: '/driver/incidents', color: 'orange', label: '→ Open Incident screen' },
  report_breakdown:    { nav: '/driver/incidents', color: 'red',    label: '→ Open Incident screen' },
  complete_trip:       { nav: '/driver/trips', color: 'green',  label: '→ Go to Trips to complete' },
  find_fuel:           { nav: null,            color: 'orange', label: '' },
  find_workshop:       { nav: null,            color: 'purple', label: '' },
  call_dispatcher:     { nav: null,            color: 'blue',   label: '' },
  sos:                 { nav: '/driver/incidents', color: 'red', label: '→ Open Emergency screen' },
};

const COLOR_CLASS = {
  green:  'bg-green-50 border-green-200 text-green-700',
  blue:   'bg-blue-50 border-blue-200 text-blue-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  red:    'bg-red-50 border-red-200 text-red-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

export default function VoiceDriver() {
  const [drivers, setDrivers]     = useState([]);
  const [driverId, setDriverId]   = useState('');
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState([]);
  const [listening, setListening] = useState(false);
  const recognitionRef            = useRef(null);
  const historyEndRef             = useRef(null);

  useEffect(() => {
    api.get('/drivers').then(r => setDrivers(r.data?.data?.drivers || r.data?.drivers || [])).catch(() => {});
  }, []);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHistory(h => [...h, { type: 'system', text: 'Voice recognition not supported in this browser. Please type your command.' }]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart  = () => setListening(true);
    recognition.onend    = () => setListening(false);
    recognition.onerror  = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      submitCommand(transcript);
    };
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const submitCommand = async (cmd) => {
    const command = (cmd || input).trim();
    if (!command) return;

    setHistory(h => [...h, { type: 'user', text: command }]);
    setInput('');
    setLoading(true);

    try {
      const r = await api.post('/driver/voice', {
        command,
        driver_id: driverId || undefined,
      });
      const { action, message, recognized } = r.data;
      const handler = action ? ACTION_HANDLERS[action] : null;

      setHistory(h => [...h, {
        type: 'assistant',
        text: message,
        action,
        recognized,
        nav: handler?.nav,
        navLabel: handler?.label,
        color: handler?.color || 'blue',
      }]);

      // Browser speech synthesis
      if (window.speechSynthesis && message) {
        const utt = new SpeechSynthesisUtterance(message);
        utt.lang = 'en-IN';
        window.speechSynthesis.speak(utt);
      }
    } catch (e) {
      setHistory(h => [...h, {
        type: 'error',
        text: e.response?.data?.error || 'Command failed. Please try again.',
      }]);
    } finally { setLoading(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitCommand(input);
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Driver Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">Speak or type commands to control your trip</p>
        </div>
        <select value={driverId} onChange={e => setDriverId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">Select Driver (optional)</option>
          {drivers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>)}
        </select>
      </div>

      {/* Mic Button */}
      <div className="flex flex-col items-center py-6 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
        <button
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onTouchStart={startListening}
          onTouchEnd={stopListening}
          onClick={() => !listening && startListening()}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all select-none
            ${listening
              ? 'bg-red-500 text-white scale-110 ring-4 ring-red-300 animate-pulse'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'}`}
        >
          {listening ? '🔴' : '🎤'}
        </button>
        <div className="mt-3 text-sm font-medium text-gray-600">
          {listening ? 'Listening… speak now' : 'Hold to speak'}
        </div>
        <div className="mt-1 text-xs text-gray-400">Or type a command below</div>
      </div>

      {/* Quick Commands */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Commands</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {QUICK_COMMANDS.map(c => (
            <button
              key={c.cmd}
              onClick={() => submitCommand(c.cmd)}
              disabled={loading}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs text-gray-600 font-medium text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Session History</span>
            <button onClick={() => setHistory([])} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {history.map((msg, i) => (
              <div key={i}>
                {msg.type === 'user' && (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm">
                      <span className="text-blue-200 text-xs mr-1">You:</span> {msg.text}
                    </div>
                  </div>
                )}
                {msg.type === 'assistant' && (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border ${COLOR_CLASS[msg.color] || COLOR_CLASS.blue}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">🤖</span>
                        <span className="text-xs font-semibold opacity-70">AI Assistant</span>
                        {!msg.recognized && (
                          <span className="text-xs opacity-50 ml-auto">unrecognized</span>
                        )}
                      </div>
                      <div className="text-sm">{msg.text}</div>
                      {msg.nav && msg.navLabel && (
                        <a href={msg.nav} className="mt-2 inline-block text-xs font-semibold underline opacity-80">
                          {msg.navLabel}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {(msg.type === 'error' || msg.type === 'system') && (
                  <div className="flex justify-center">
                    <div className="bg-gray-100 text-gray-500 rounded-xl px-4 py-2 text-xs max-w-[90%]">
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={historyEndRef} />
          </div>
        </div>
      )}

      {/* Text Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='Type a command, e.g. "Start trip" or "Report breakdown"'
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button type="submit" disabled={!input.trim() || loading}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          Send
        </button>
      </form>

      {/* How to use */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Supported Voice Commands</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {[
            '"Start trip"', '"Reached pickup"', '"Reached warehouse"', '"Reached destination"',
            '"Upload POD"', '"Report delay"', '"Report breakdown"', '"Call dispatcher"',
            '"Find fuel station"', '"Find nearest workshop"', '"Complete trip"', '"SOS emergency"',
          ].map(cmd => (
            <div key={cmd} className="text-xs text-gray-500 font-mono">▸ {cmd}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
