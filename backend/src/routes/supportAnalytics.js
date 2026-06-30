const express      = require('express');
const router       = express.Router();
const AgentSession = require('../models/AgentSession');
const ChatSession  = require('../models/ChatSession');
const Complaint    = require('../models/Complaint');
const LiveAgent    = require('../models/LiveAgent');
const FAQ          = require('../models/FAQ');
const { authenticate, requireRole } = require('../middleware/auth');

const ok  = (res, data, message = 'Success') => res.json({ status: true, message, data });
const err = (res, message, status = 500)     => res.status(status).json({ status: false, message });

router.use(authenticate, requireRole('admin', 'superadmin', 'manager'));

// GET /api/support-analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const cid      = req.user.company_id;
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalChats, chatsToday, openChats,
      totalSessions, activeSessions,
      openComplaints, resolvedComplaints, resolvedToday,
      agents, avgCsatResult, faqCount,
    ] = await Promise.all([
      ChatSession.countDocuments({ company_id: cid }),
      ChatSession.countDocuments({ company_id: cid, createdAt: { $gte: today } }),
      AgentSession.countDocuments({ company_id: cid, status: { $in: ['waiting', 'active'] } }),
      AgentSession.countDocuments({ company_id: cid }),
      AgentSession.countDocuments({ company_id: cid, status: 'active' }),
      Complaint.countDocuments({ company_id: cid, status: 'open' }),
      Complaint.countDocuments({ company_id: cid, status: { $in: ['resolved', 'closed'] } }),
      Complaint.countDocuments({ company_id: cid, status: { $in: ['resolved', 'closed'] }, updatedAt: { $gte: today } }),
      LiveAgent.find({ company_id: cid }).populate('user_id', 'full_name username').lean(),
      AgentSession.aggregate([
        { $match: { company_id: cid, csat_rating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$csat_rating' }, count: { $sum: 1 } } },
      ]),
      FAQ.countDocuments({ company_id: cid, is_published: true }),
    ]);

    const avgCsat = avgCsatResult[0] ? +avgCsatResult[0].avg.toFixed(2) : null;
    const csatCount = avgCsatResult[0]?.count || 0;

    // 7-day chat volume
    const chatTrend = await ChatSession.aggregate([
      { $match: { company_id: cid, createdAt: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Channel breakdown (agent sessions)
    const channelBreakdown = await AgentSession.aggregate([
      { $match: { company_id: cid, createdAt: { $gte: monthAgo } } },
      { $group: { _id: '$channel', count: { $sum: 1 } } },
    ]);

    // Issue type breakdown
    const issueBreakdown = await Complaint.aggregate([
      { $match: { company_id: cid, createdAt: { $gte: monthAgo } } },
      { $group: { _id: '$issue_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Avg first response time (ms → minutes)
    const responseTimeResult = await AgentSession.aggregate([
      { $match: { company_id: cid, first_response_ms: { $exists: true }, createdAt: { $gte: monthAgo } } },
      { $group: { _id: null, avg_ms: { $avg: '$first_response_ms' } } },
    ]);
    const avgResponseMin = responseTimeResult[0]
      ? +(responseTimeResult[0].avg_ms / 60000).toFixed(1)
      : null;

    // Agent performance
    const agentPerformance = await AgentSession.aggregate([
      { $match: { company_id: cid, status: 'closed', agent_id: { $exists: true }, createdAt: { $gte: monthAgo } } },
      {
        $group: {
          _id: '$agent_id',
          total_handled:    { $sum: 1 },
          avg_csat:         { $avg: '$csat_rating' },
          avg_response_ms:  { $avg: '$first_response_ms' },
        },
      },
    ]);

    ok(res, {
      overview: {
        total_chats: totalChats, chats_today: chatsToday,
        open_chats: openChats, active_agent_sessions: activeSessions,
        total_agent_sessions: totalSessions,
        open_complaints: openComplaints, resolved_complaints: resolvedComplaints, resolved_today: resolvedToday,
        avg_csat: avgCsat, csat_responses: csatCount,
        avg_response_minutes: avgResponseMin,
        faq_count: faqCount,
      },
      agents: agents.map(a => ({
        id: a.user_id?._id, name: a.display_name || a.user_id?.full_name || a.user_id?.username,
        status: a.status, active_sessions: a.active_sessions, total_handled: a.total_handled,
        avg_rating: a.avg_rating, rating_count: a.rating_count, last_active: a.last_active,
      })),
      chat_trend: chatTrend,
      channel_breakdown: channelBreakdown,
      issue_breakdown: issueBreakdown,
      agent_performance: agentPerformance,
    });
  } catch (e) { err(res, e.message); }
});

// GET /api/support-analytics/agents — live agent roster
router.get('/agents', async (req, res) => {
  try {
    const agents = await LiveAgent.find({ company_id: req.user.company_id })
      .populate('user_id', 'full_name username email').lean();
    ok(res, agents);
  } catch (e) { err(res, e.message); }
});

module.exports = router;
