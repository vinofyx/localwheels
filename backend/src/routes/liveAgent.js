const express      = require('express');
const router       = express.Router();
const AgentSession = require('../models/AgentSession');
const LiveAgent    = require('../models/LiveAgent');
const { authenticate, requireRole } = require('../middleware/auth');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

// ── Customer-facing (no auth) ─────────────────────────────────────────────────

// POST /api/live-agent/request — customer requests a human agent
router.post('/request', async (req, res) => {
  try {
    const {
      customer_name, customer_phone, customer_email,
      lr_number, issue_summary, channel = 'website',
      chat_session_id, company_id, ai_transcript = [],
    } = req.body;

    const sessionId = `agt_${Date.now().toString(36).toUpperCase()}`;

    const session = await AgentSession.create({
      company_id: company_id || null,
      session_id: sessionId,
      chat_session_id,
      customer_name:  customer_name || 'Anonymous',
      customer_phone, customer_email,
      lr_number, issue_summary, channel,
      ai_transcript,
      messages: [{
        from: 'system',
        content: `Customer connected. ${issue_summary ? `Issue: ${issue_summary}` : ''}`,
      }],
      status: 'waiting',
    });

    ok(res, {
      session_id: sessionId,
      status: 'waiting',
      message: "You're in the queue. An agent will be with you shortly.",
      estimated_wait: '2–5 minutes',
    }, 'Agent requested', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/live-agent/session/:sessionId — customer polls for status + new messages
router.get('/session/:sessionId', async (req, res) => {
  try {
    const s = await AgentSession.findOne({ session_id: req.params.sessionId })
      .select('status messages customer_name agent_id createdAt accepted_at')
      .lean();
    if (!s) return err(res, 'Session not found', 404);

    // Return only unread agent messages for customer
    const newMessages = s.messages.filter(m => m.from === 'agent' || m.from === 'system');
    ok(res, { status: s.status, messages: newMessages, accepted_at: s.accepted_at });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/live-agent/session/:sessionId/message — customer sends message
router.post('/session/:sessionId/message', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return err(res, 'content is required');

    const s = await AgentSession.findOneAndUpdate(
      { session_id: req.params.sessionId, status: { $in: ['waiting', 'active'] } },
      { $push: { messages: { from: 'customer', content: content.trim() } } },
      { new: true }
    );
    if (!s) return err(res, 'Session not found or closed', 404);
    ok(res, { sent: true });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/live-agent/session/:sessionId/rate — CSAT
router.post('/session/:sessionId/rate', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return err(res, 'rating must be 1–5');
    const s = await AgentSession.findOneAndUpdate(
      { session_id: req.params.sessionId },
      { $set: { csat_rating: rating, csat_comment: comment } },
      { new: true }
    );
    if (!s) return err(res, 'Session not found', 404);

    // Update agent average rating
    if (s.agent_id) {
      const agent = await LiveAgent.findOne({ user_id: s.agent_id });
      if (agent) {
        const newCount  = agent.rating_count + 1;
        const newAvg    = ((agent.avg_rating * agent.rating_count) + rating) / newCount;
        await LiveAgent.updateOne({ user_id: s.agent_id }, { avg_rating: +newAvg.toFixed(2), rating_count: newCount });
      }
    }
    ok(res, null, 'Thank you for your feedback!');
  } catch (e) { err(res, e.message, 500); }
});

// ── Agent-facing (require auth) ───────────────────────────────────────────────
router.use(authenticate);

// GET /api/live-agent/queue — agent sees waiting sessions
router.get('/queue', async (req, res) => {
  try {
    const q = { company_id: req.user.company_id, status: { $in: ['waiting', 'active'] } };
    const sessions = await AgentSession.find(q)
      .sort({ priority: -1, createdAt: 1 })
      .select('-ai_transcript')
      .lean();
    const waiting = sessions.filter(s => s.status === 'waiting');
    const active  = sessions.filter(s => s.status === 'active' && String(s.agent_id) === String(req.user.id));
    ok(res, { waiting, active, waiting_count: waiting.length });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/live-agent/accept/:sessionId — agent accepts session
router.post('/accept/:sessionId', async (req, res) => {
  try {
    // Check agent capacity
    const agent = await LiveAgent.findOne({ user_id: req.user.id });
    if (agent && agent.active_sessions >= agent.max_sessions)
      return err(res, 'Maximum concurrent sessions reached');

    const s = await AgentSession.findOneAndUpdate(
      { session_id: req.params.sessionId, status: 'waiting', company_id: req.user.company_id },
      {
        $set:  { agent_id: req.user.id, status: 'active', accepted_at: new Date() },
        $push: { messages: { from: 'system', content: `Agent ${req.user.full_name || req.user.username} has joined.` } },
      },
      { new: true }
    );
    if (!s) return err(res, 'Session not found or already taken', 404);

    // Increment agent active sessions
    await LiveAgent.findOneAndUpdate(
      { user_id: req.user.id, company_id: req.user.company_id },
      { $inc: { active_sessions: 1 }, $set: { status: 'busy', last_active: new Date() } },
      { upsert: true }
    );
    ok(res, s, 'Session accepted');
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/live-agent/reply/:sessionId — agent sends message
router.post('/reply/:sessionId', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return err(res, 'content is required');
    const s = await AgentSession.findOneAndUpdate(
      { session_id: req.params.sessionId, agent_id: req.user.id, status: 'active' },
      {
        $push: { messages: { from: 'agent', content: content.trim() } },
        $set:  { 'messages.$[].read': true },
      },
      { new: true }
    );
    if (!s) return err(res, 'Session not found', 404);

    // Track first response time
    if (!s.first_response_ms && s.accepted_at) {
      const ms = Date.now() - new Date(s.accepted_at).getTime();
      await AgentSession.updateOne({ session_id: req.params.sessionId }, { first_response_ms: ms });
    }
    ok(res, { sent: true });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/live-agent/session/:sessionId/full — agent reads full transcript
router.get('/session/:sessionId/full', async (req, res) => {
  try {
    const s = await AgentSession.findOne({ session_id: req.params.sessionId, company_id: req.user.company_id }).lean();
    if (!s) return err(res, 'Session not found', 404);
    ok(res, s);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/live-agent/close/:sessionId — agent closes session
router.post('/close/:sessionId', async (req, res) => {
  try {
    const { resolution_note } = req.body;
    const s = await AgentSession.findOneAndUpdate(
      { session_id: req.params.sessionId, company_id: req.user.company_id },
      {
        $set:  { status: 'closed', closed_at: new Date(), resolution_note },
        $push: { messages: { from: 'system', content: 'Session closed by agent. Thank you for contacting LocalWheels!' } },
      },
      { new: true }
    );
    if (!s) return err(res, 'Session not found', 404);

    // Decrement active sessions
    await LiveAgent.findOneAndUpdate(
      { user_id: req.user.id },
      { $inc: { active_sessions: -1, total_handled: 1 }, $set: { last_active: new Date() } }
    );

    ok(res, null, 'Session closed');
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/live-agent/me — agent toggle own status
router.get('/me', async (req, res) => {
  try {
    const agent = await LiveAgent.findOne({ user_id: req.user.id }).lean();
    ok(res, agent || { status: 'offline', active_sessions: 0 });
  } catch (e) { err(res, e.message, 500); }
});

router.patch('/me/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['online', 'offline', 'busy'].includes(status)) return err(res, 'Invalid status');
    const agent = await LiveAgent.findOneAndUpdate(
      { user_id: req.user.id, company_id: req.user.company_id },
      { $set: { status, last_active: new Date(), display_name: req.user.full_name || req.user.username } },
      { upsert: true, new: true }
    );
    ok(res, agent, `Status set to ${status}`);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/live-agent/history — closed sessions
router.get('/history', requireRole('admin', 'superadmin', 'manager'), async (req, res) => {
  try {
    const { from_date, to_date, agent_id, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id, status: 'closed' };
    if (agent_id) q.agent_id = agent_id;
    if (from_date || to_date) {
      q.createdAt = {};
      if (from_date) q.createdAt.$gte = new Date(from_date);
      if (to_date)   q.createdAt.$lte = new Date(to_date + 'T23:59:59Z');
    }
    const skip = (Math.max(1, +page) - 1) * Math.min(+limit, 50);
    const lim  = Math.min(+limit, 50);
    const [sessions, total] = await Promise.all([
      AgentSession.find(q).sort({ closed_at: -1 }).skip(skip).limit(lim)
        .populate('agent_id', 'full_name username').lean(),
      AgentSession.countDocuments(q),
    ]);
    ok(res, { sessions, total, page: +page, pages: Math.ceil(total / lim) });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
