const router  = require('express').Router();
const { authenticate: auth } = require('../middleware/auth');
const AutomationWorkflow  = require('../models/AutomationWorkflow');
const AutomationJob       = require('../models/AutomationJob');
const AutomationExecution = require('../models/AutomationExecution');
const AutomationRule      = require('../models/AutomationRule');
const ApprovalRequest     = require('../models/ApprovalRequest');
const DigitalWorker       = require('../models/DigitalWorker');
const EnterpriseScheduler = require('../models/EnterpriseScheduler');
const AutomationAnalytics = require('../models/AutomationAnalytics');
const Anthropic = require('@anthropic-ai/sdk');

const ai  = new Anthropic();
const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

    const [
      wfTotal, wfActive,
      jobTotal30, jobDone30, jobFailed30,
      jobTotal7, jobDone7,
      approvalTotal, approvalPending, approvalApproved,
      workerTotal, workerActive,
      schedTotal, schedActive,
      ruleTotal, ruleActive,
    ] = await Promise.all([
      AutomationWorkflow.countDocuments({ company_id: cid }),
      AutomationWorkflow.countDocuments({ company_id: cid, is_active: true }),
      AutomationJob.countDocuments({ company_id: cid, createdAt: { $gte: since30 } }),
      AutomationJob.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since30 } }),
      AutomationJob.countDocuments({ company_id: cid, status: 'failed',    createdAt: { $gte: since30 } }),
      AutomationJob.countDocuments({ company_id: cid, createdAt: { $gte: since7 } }),
      AutomationJob.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since7 } }),
      ApprovalRequest.countDocuments({ company_id: cid }),
      ApprovalRequest.countDocuments({ company_id: cid, status: 'pending' }),
      ApprovalRequest.countDocuments({ company_id: cid, status: 'approved' }),
      DigitalWorker.countDocuments({ company_id: cid }),
      DigitalWorker.countDocuments({ company_id: cid, is_active: true }),
      EnterpriseScheduler.countDocuments({ company_id: cid }),
      EnterpriseScheduler.countDocuments({ company_id: cid, is_active: true }),
      AutomationRule.countDocuments({ company_id: cid }),
      AutomationRule.countDocuments({ company_id: cid, is_active: true }),
    ]);

    const successRate30 = jobTotal30 > 0 ? Math.round((jobDone30 / jobTotal30) * 100) : 0;
    const successRate7  = jobTotal7  > 0 ? Math.round((jobDone7  / jobTotal7)  * 100) : 0;

    const topWorkflows = await AutomationWorkflow.find({ company_id: cid })
      .sort({ run_count: -1 }).limit(5).select('name run_count success_count failure_count').lean();

    ok(res, {
      workflows:   { total: wfTotal, active: wfActive },
      jobs: {
        last_30_days: { total: jobTotal30, completed: jobDone30, failed: jobFailed30, success_rate_pct: successRate30 },
        last_7_days:  { total: jobTotal7,  completed: jobDone7,  success_rate_pct: successRate7 },
      },
      approvals:   { total: approvalTotal, pending: approvalPending, approved: approvalApproved },
      workers:     { total: workerTotal, active: workerActive },
      schedulers:  { total: schedTotal, active: schedActive },
      rules:       { total: ruleTotal, active: ruleActive },
      top_workflows: topWorkflows,
    });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/history', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const { period = 'daily', limit = 30 } = req.query;
    const snapshots = await AutomationAnalytics.find({ company_id: cid, period })
      .sort({ period_date: -1 }).limit(+limit).lean();
    ok(res, { history: snapshots, period });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/snapshot', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const period = req.body.period || 'daily';
    const now    = new Date(); now.setHours(0,0,0,0);
    const since  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [wfActive, jobTotal, jobDone, jobFailed, appTotal, appApproved, appRejected, workers, schedActive] = await Promise.all([
      AutomationWorkflow.countDocuments({ company_id: cid, is_active: true }),
      AutomationJob.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      AutomationJob.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since } }),
      AutomationJob.countDocuments({ company_id: cid, status: 'failed',    createdAt: { $gte: since } }),
      ApprovalRequest.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      ApprovalRequest.countDocuments({ company_id: cid, status: 'approved', createdAt: { $gte: since } }),
      ApprovalRequest.countDocuments({ company_id: cid, status: 'rejected', createdAt: { $gte: since } }),
      DigitalWorker.find({ company_id: cid, is_active: true }).lean(),
      EnterpriseScheduler.countDocuments({ company_id: cid, is_active: true }),
    ]);

    const snapshot = await AutomationAnalytics.findOneAndUpdate(
      { company_id: cid, period, period_date: now },
      {
        workflows_active: wfActive,
        jobs_total: jobTotal, jobs_completed: jobDone, jobs_failed: jobFailed,
        success_rate_pct: jobTotal > 0 ? Math.round((jobDone / jobTotal) * 100) : 0,
        approvals_total: appTotal, approvals_approved: appApproved, approvals_rejected: appRejected,
        workers_active: workers.length,
        tasks_automated: jobDone,
        time_saved_hours: Math.round(jobDone * 0.5),
      },
      { upsert: true, new: true }
    );
    ok(res, snapshot, 'Snapshot saved');
  } catch (e) { err(res, e.message, 500); }
});

router.post('/ai-insights', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [wfTotal, jobTotal, jobFailed, approvalPending] = await Promise.all([
      AutomationWorkflow.countDocuments({ company_id: cid }),
      AutomationJob.countDocuments({ company_id: cid }),
      AutomationJob.countDocuments({ company_id: cid, status: 'failed' }),
      ApprovalRequest.countDocuments({ company_id: cid, status: 'pending' }),
    ]);

    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Logistics automation platform metrics: ${wfTotal} workflows, ${jobTotal} total jobs, ${jobFailed} failed jobs, ${approvalPending} pending approvals. Provide 3 brief actionable insights to improve automation efficiency. Return as JSON array: [{"insight": "...", "recommendation": "..."}]`,
      }],
    });

    let insights = [];
    try { insights = JSON.parse(msg.content[0].text.trim()); } catch (_) {
      insights = [{ insight: 'Review failed jobs', recommendation: `${jobFailed} jobs failed — investigate root causes` }];
    }
    ok(res, { insights });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
