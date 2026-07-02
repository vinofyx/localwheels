const express  = require('express');
const router   = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const { log: auditLog }      = require('../utils/audit');
const { encryptText, decryptText } = require('../utils/voiceCrypto');
const { classifyIntent, resolveIntent, SUPPORTED_LANGUAGES } = require('../utils/voiceEngine');

const VoiceSession  = require('../models/VoiceSession');
const VoiceTranscript = require('../models/VoiceTranscript');
const VoiceIntent   = require('../models/VoiceIntent');
const VoiceAnalytics = require('../models/VoiceAnalytics');
const CallRecording = require('../models/CallRecording');
const VoiceFeedback = require('../models/VoiceFeedback');

// ─── Optional auth: supports authenticated dashboard users AND anonymous customers ──
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header) return auth(req, res, next);
  next();
}

function genSessionNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `VS-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function resolveCompanyId(req) {
  return req.user?.company_id || req.body.company_id || req.query.company_id;
}

// ─── POST /api/voice/session/start ─────────────────────────────────────────────
router.post('/session/start', optionalAuth, async (req, res) => {
  try {
    const company_id = resolveCompanyId(req);
    if (!company_id) return res.status(400).json({ error: 'company_id is required' });

    const { channel = 'website', language = 'en', customer_phone, customer_name } = req.body;
    if (!SUPPORTED_LANGUAGES.includes(language)) return res.status(400).json({ error: 'Unsupported language' });

    const session = await VoiceSession.create({
      company_id, session_number: genSessionNumber(), channel, language,
      user_id: req.user?._id, user_role: req.user ? (req.user.role || 'agent') : 'customer',
      customer_phone, customer_name,
    });

    if (req.user) await auditLog({ company_id, user: req.user, action: 'voice_session_start', resource: 'VoiceSession', resource_id: session._id });

    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/session/end ───────────────────────────────────────────────
router.post('/session/end', optionalAuth, async (req, res) => {
  try {
    const company_id = resolveCompanyId(req);
    const { session_id, resolution = 'unresolved' } = req.body;
    const session = await VoiceSession.findOne({ _id: session_id, company_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.status = 'ended';
    session.ended_at = new Date();
    session.duration_sec = Math.round((session.ended_at - session.started_at) / 1000);
    session.resolution = resolution;
    await session.save();

    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/transcribe ────────────────────────────────────────────────
// Accepts already-transcribed text from the browser's Web Speech API (client-side STT)
router.post('/transcribe', optionalAuth, async (req, res) => {
  try {
    const company_id = resolveCompanyId(req);
    const { session_id, text, language = 'en' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const session = await VoiceSession.findOne({ _id: session_id, company_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const turn = await VoiceTranscript.create({
      company_id, session_id, turn_index: session.turn_count,
      speaker: 'user', text_encrypted: encryptText(text), language,
    });
    session.turn_count += 1;
    await session.save();

    res.status(201).json({ transcript_id: turn._id, turn_index: turn.turn_index });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/respond ────────────────────────────────────────────────────
// Core voice workflow: classify intent → resolve via existing modules → store transcript+intent → return reply text for client-side TTS
router.post('/respond', optionalAuth, async (req, res) => {
  try {
    const company_id = resolveCompanyId(req);
    const { session_id, text, category = 'customer' } = req.body;
    if (!session_id || !text) return res.status(400).json({ error: 'session_id and text are required' });

    const session = await VoiceSession.findOne({ _id: session_id, company_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const classification = await classifyIntent({ text, category, context: session.context });
    const result = await resolveIntent({
      companyId: company_id, intent: classification.intent, entities: classification.entities || {},
      language: session.language, userPhone: session.customer_phone, user: req.user,
    });

    await VoiceTranscript.create({
      company_id, session_id, turn_index: session.turn_count,
      speaker: 'user', text_encrypted: encryptText(text), language: session.language,
      intent: classification.intent, confidence: classification.confidence, sentiment: classification.sentiment || 'neutral',
    });
    await VoiceTranscript.create({
      company_id, session_id, turn_index: session.turn_count + 1,
      speaker: 'assistant', text_encrypted: encryptText(result.reply), language: session.language,
    });

    await VoiceIntent.create({
      company_id, session_id, intent: classification.intent, category,
      entities: classification.entities || {}, confidence: classification.confidence,
      resolved_action: classification.intent, success: !!result.success, error_reason: result.success === false ? result.reply : undefined,
    });

    session.turn_count += 2;
    session.context = { ...session.context, last_intent: classification.intent, ...(classification.entities || {}) };
    if (result.transfer_to_human) { session.transferred_to_human = true; session.resolution = 'transferred_to_human'; }
    await session.save();

    res.json({
      reply: result.reply, intent: classification.intent, confidence: classification.confidence,
      requires_followup: result.requires_followup || null, transfer_to_human: !!result.transfer_to_human,
      data: result.data || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/transfer ───────────────────────────────────────────────────
router.post('/transfer', optionalAuth, async (req, res) => {
  try {
    const company_id = resolveCompanyId(req);
    const { session_id, reason } = req.body;
    const session = await VoiceSession.findOne({ _id: session_id, company_id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.transferred_to_human = true;
    session.status = 'transferred';
    session.resolution = 'transferred_to_human';
    await session.save();

    const recording = await CallRecording.create({
      company_id, session_id, call_summary: reason || 'Transferred to human agent', transferred_to_human: true,
    });

    res.json({ session, recording });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/voice/history ──────────────────────────────────────────────────────
router.get('/history', optionalAuth, async (req, res) => {
  try {
    const company_id = resolveCompanyId(req);
    const { session_id, customer_phone, limit = 50 } = req.query;

    if (session_id) {
      const transcripts = await VoiceTranscript.find({ company_id, session_id }).sort({ turn_index: 1 }).lean();
      return res.json({
        transcripts: transcripts.map(t => ({ ...t, text: decryptText(t.text_encrypted), text_encrypted: undefined })),
      });
    }

    const filter = { company_id };
    if (customer_phone) filter.customer_phone = customer_phone;
    const sessions = await VoiceSession.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/voice/feedback ────────────────────────────────────────────────────
router.post('/feedback', optionalAuth, async (req, res) => {
  try {
    const company_id = resolveCompanyId(req);
    const { session_id, rating, comment, customer_phone } = req.body;
    if (!session_id || !rating) return res.status(400).json({ error: 'session_id and rating are required' });

    const feedback = await VoiceFeedback.create({ company_id, session_id, rating, comment, customer_phone });
    res.status(201).json({ feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/voice/analytics ─────────────────────────────────────────────────────
router.get('/analytics', auth, async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 86400000);

    const sessions = await VoiceSession.find({ company_id, createdAt: { $gte: since } }).lean();
    const intents = await VoiceIntent.find({ company_id, createdAt: { $gte: since } }).lean();
    const feedbacks = await VoiceFeedback.find({ company_id, createdAt: { $gte: since } }).lean();

    const total_sessions = sessions.length;
    const ended = sessions.filter(s => s.status === 'ended' || s.status === 'transferred');
    const transferred = sessions.filter(s => s.transferred_to_human).length;
    const resolved = sessions.filter(s => s.resolution === 'resolved').length;
    const avg_duration = ended.length ? Math.round(ended.reduce((a, s) => a + (s.duration_sec || 0), 0) / ended.length) : 0;

    const intentCounts = {};
    for (const i of intents) intentCounts[i.intent] = (intentCounts[i.intent] || 0) + 1;
    const top_intents = Object.entries(intentCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([intent, count]) => ({ intent, count }));

    const language_distribution = {};
    for (const s of sessions) language_distribution[s.language] = (language_distribution[s.language] || 0) + 1;

    const avg_satisfaction = feedbacks.length ? (feedbacks.reduce((a, f) => a + f.rating, 0) / feedbacks.length).toFixed(2) : 0;

    res.json({
      total_sessions, avg_call_duration_sec: avg_duration,
      ai_resolution_rate_pct: total_sessions ? Math.round((resolved / total_sessions) * 100) : 0,
      human_transfer_rate_pct: total_sessions ? Math.round((transferred / total_sessions) * 100) : 0,
      top_intents, language_distribution, avg_satisfaction_score: Number(avg_satisfaction),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
