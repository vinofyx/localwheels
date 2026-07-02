const Anthropic   = require('@anthropic-ai/sdk');
const Complaint   = require('../models/Complaint');
const KnowledgeArticle = require('../models/KnowledgeArticle');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── SLA hours lookup ─────────────────────────────────────────────────────────
const DEFAULT_SLA = {
  Critical: { response: 1,  resolution: 4   },
  High:     { response: 4,  resolution: 24  },
  Medium:   { response: 12, resolution: 72  },
  Low:      { response: 24, resolution: 168 },
};

// ─── Generate ticket number ───────────────────────────────────────────────────
function genTicketNumber() {
  const d   = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `TK-${ymd}-${rnd}`;
}

// ─── Compute SLA deadlines ────────────────────────────────────────────────────
function computeSLADeadlines(priority, slaConfig = null) {
  const cfg = slaConfig || DEFAULT_SLA[priority] || DEFAULT_SLA.Medium;
  const now  = Date.now();
  return {
    sla_response_deadline:   new Date(now + cfg.response   * 3600000),
    sla_resolution_deadline: new Date(now + cfg.resolution * 3600000),
  };
}

// ─── AI classification ────────────────────────────────────────────────────────
async function classifyComplaint({ subject, description, type, lr_number, companyId }) {
  const system = `You are a complaint classification AI for an Indian logistics company.
Analyse the complaint and return ONLY valid JSON — no markdown, no prose.
{
  "category": "exact complaint type from: Shipment Delay|Shipment Lost|Shipment Damaged|Wrong Delivery|Pickup Delay|Invoice Issue|Payment Issue|Driver Behaviour|Vehicle Issue|Tracking Problem|Website Issue|General Feedback",
  "priority": "Critical|High|Medium|Low",
  "sentiment": "positive|neutral|negative|very_negative",
  "sentiment_score": -1.0 to 1.0,
  "department": "Customer Support|Operations|Dispatch|Fleet|Finance|Warehouse|Sales|Technical Support",
  "root_cause": "brief root cause hypothesis",
  "suggested_resolution": "concise action to resolve this",
  "auto_reply_draft": "professional first-response email draft (2-3 sentences)",
  "flags": ["possible_fraud"|"repeat_issue"|"high_value_customer"|"media_risk"],
  "escalation_recommended": true|false,
  "confidence": 0-100
}`;

  const userMsg = `
Subject: ${subject}
Type reported: ${type}
LR Number: ${lr_number || 'N/A'}
Description: ${description}
`;

  try {
    const resp = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system,
      messages:   [{ role: 'user', content: userMsg }],
    });
    const text = resp.content[0]?.text?.trim() || '{}';
    // Strip markdown fences if present
    const clean = text.replace(/^```json?\s*/,'').replace(/\s*```$/,'');
    return JSON.parse(clean);
  } catch {
    // Rule-based fallback
    const isUrgent   = /lost|missing|damaged|urgent|critical/i.test(description);
    const isFraud    = /refund.*fraud|fake|scam/i.test(description);
    return {
      category:              type,
      priority:              isUrgent ? 'High' : 'Medium',
      sentiment:             'negative',
      sentiment_score:       -0.5,
      department:            getDeptByType(type),
      root_cause:            'Under investigation',
      suggested_resolution:  'Investigate and update customer within SLA window',
      auto_reply_draft:      `Dear Customer, thank you for reaching out. We have registered your complaint (${type}) and our team will get back to you shortly.`,
      flags:                 isFraud ? ['possible_fraud'] : [],
      escalation_recommended: isUrgent,
      confidence:            60,
    };
  }
}

// ─── Department by complaint type (rule-based fallback) ───────────────────────
function getDeptByType(type) {
  const map = {
    'Shipment Delay':    'Operations',
    'Shipment Lost':     'Operations',
    'Shipment Damaged':  'Operations',
    'Wrong Delivery':    'Operations',
    'Pickup Delay':      'Dispatch',
    'Invoice Issue':     'Finance',
    'Payment Issue':     'Finance',
    'Driver Behaviour':  'Fleet',
    'Vehicle Issue':     'Fleet',
    'Tracking Problem':  'Technical Support',
    'Website Issue':     'Technical Support',
    'General Feedback':  'Customer Support',
  };
  return map[type] || 'Customer Support';
}

// ─── Duplicate detection: find similar open complaints from same customer ──────
async function detectDuplicate({ companyId, customerPhone, description, lr_number }) {
  const filter = {
    company_id:     companyId,
    status:         { $in: ['New','Open','Assigned','In Progress'] },
    createdAt:      { $gte: new Date(Date.now() - 7 * 86400000) },
  };
  if (lr_number) filter.lr_number = lr_number;
  else if (customerPhone) filter.customer_phone = customerPhone;

  const candidates = await Complaint.find(filter).lean();
  if (!candidates.length) return null;

  // Simple keyword overlap check
  const words = new Set(description.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  for (const c of candidates) {
    const cWords = c.description.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const overlap = cWords.filter(w => words.has(w)).length;
    if (overlap >= 4) return c._id;
  }
  return null;
}

// ─── AI suggested reply for an agent ─────────────────────────────────────────
async function getSuggestedReply({ complaint, context = '' }) {
  const system = `You are a customer service AI assistant for an Indian logistics company.
Write a professional, empathetic reply to this customer complaint in 3-5 sentences.
Do NOT use placeholders like [name]. Use the actual customer name if provided.
Return ONLY the reply text.`;

  const userMsg = `
Ticket: ${complaint.ticket_number}
Customer: ${complaint.customer_name}
Type: ${complaint.type}
Status: ${complaint.status}
LR: ${complaint.lr_number || 'N/A'}
Complaint: ${complaint.description}
${context ? `\nContext from agent: ${context}` : ''}
`;

  try {
    const resp = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system,
      messages:   [{ role: 'user', content: userMsg }],
    });
    return resp.content[0]?.text?.trim() || '';
  } catch {
    return `Dear ${complaint.customer_name}, we sincerely apologise for the inconvenience. Our team is actively working on your complaint (${complaint.ticket_number}) and will update you within 24 hours.`;
  }
}

// ─── Knowledge base search ────────────────────────────────────────────────────
async function searchKnowledge({ query, companyId, limit = 5 }) {
  try {
    const articles = await KnowledgeArticle.find(
      { company_id: companyId, is_published: true, $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    return articles;
  } catch {
    // Fallback: simple regex search
    const regex = new RegExp(query.split(' ').join('|'), 'i');
    return KnowledgeArticle.find({
      company_id:   companyId,
      is_published: true,
      $or: [{ title: regex }, { content: regex }, { tags: { $in: [regex] } }],
    }).limit(limit).lean();
  }
}

module.exports = {
  genTicketNumber,
  computeSLADeadlines,
  classifyComplaint,
  detectDuplicate,
  getSuggestedReply,
  searchKnowledge,
  getDeptByType,
  DEFAULT_SLA,
};
