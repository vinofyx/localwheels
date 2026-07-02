const Anthropic = require('@anthropic-ai/sdk');
const Shipment   = require('../models/Shipment');
const Quote      = require('../models/Quote');
const Trip       = require('../models/Trip');
const FleetVehicle = require('../models/FleetVehicle');
const Complaint  = require('../models/Complaint');
const { classifyComplaint, genTicketNumber, computeSLADeadlines } = require('./complaintClassifier');

let anthropic = null;
try { anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); } catch { /* no key — fallback only */ }

const SUPPORTED_LANGUAGES = ['en', 'hi', 'te', 'ta', 'kn'];

const INTENT_KEYWORDS = {
  track_shipment:      ['track', 'where is my', 'shipment status', 'lr number', 'delivery status'],
  get_quote:           ['quote', 'price', 'estimate', 'cost', 'how much'],
  raise_complaint:     ['complaint', 'problem', 'issue', 'damaged', 'lost', 'delay', 'unhappy'],
  nearest_branch:      ['branch', 'warehouse near', 'nearest'],
  talk_to_agent:       ['human', 'agent', 'representative', 'talk to someone'],
  dispatch_summary:    ['dispatch summary', 'today dispatch', 'pending approval', 'delayed shipments'],
  fleet_status:        ['available vehicle', 'fleet utilization', 'maintenance due', 'vehicle health'],
  revenue_kpi:         ['revenue', 'top customer', 'performance', "today's revenue"],
};

// ─── Rule-based intent fallback (no Claude key / Claude failure) ──────────────
function ruleBasedIntent(text) {
  const lower = (text || '').toLowerCase();
  for (const [intent, kws] of Object.entries(INTENT_KEYWORDS)) {
    if (kws.some(k => lower.includes(k))) return { intent, confidence: 0.55 };
  }
  return { intent: 'unknown', confidence: 0.2 };
}

// ─── Extract entities heuristically (LR numbers, phone numbers) ───────────────
function extractEntities(text) {
  const entities = {};
  const lrMatch = (text || '').match(/\b([A-Z]{2}\d{6,})\b/i);
  if (lrMatch) entities.lr_number = lrMatch[1].toUpperCase();
  const phoneMatch = (text || '').match(/\b(\d{10})\b/);
  if (phoneMatch) entities.phone = phoneMatch[1];
  return entities;
}

// ─── Claude-based intent classification with rule-based fallback ──────────────
async function classifyIntent({ text, category = 'customer', context = {} }) {
  if (!anthropic || !process.env.ANTHROPIC_API_KEY) {
    return { ...ruleBasedIntent(text), entities: extractEntities(text) };
  }
  try {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are an intent classifier for a logistics voice assistant. Return ONLY valid JSON: {"intent": "track_shipment|get_quote|raise_complaint|nearest_branch|talk_to_agent|dispatch_summary|fleet_status|revenue_kpi|unknown", "confidence": 0.0-1.0, "entities": {"lr_number": "", "phone": "", "pincode": ""}, "sentiment": "very_negative|negative|neutral|positive|very_positive"}`,
      messages: [{ role: 'user', content: `Query category: ${category}. Conversation context: ${JSON.stringify(context)}. User said: "${text}"` }],
    });
    const raw = resp.content[0]?.text?.trim() || '{}';
    const parsed = JSON.parse(raw.replace(/^```json|```$/g, '').trim());
    return parsed;
  } catch {
    return { ...ruleBasedIntent(text), entities: extractEntities(text), sentiment: 'neutral' };
  }
}

// ─── Resolve a recognized intent against real data/modules ────────────────────
async function resolveIntent({ companyId, intent, entities = {}, language = 'en', userPhone, user }) {
  switch (intent) {
    case 'track_shipment': {
      if (!entities.lr_number) return { reply: 'Please provide your LR / tracking number.', requires_followup: 'lr_number' };
      const shipment = await Shipment.findOne({ company_id: companyId, lr_number: entities.lr_number.toUpperCase() }).lean();
      if (!shipment) return { reply: `I couldn't find a shipment with LR number ${entities.lr_number}.`, success: false };
      return {
        reply: `Shipment ${shipment.lr_number} is currently ${shipment.status.replace(/_/g, ' ')}, heading to ${shipment.destination}.`,
        success: true, data: { status: shipment.status, destination: shipment.destination },
      };
    }
    case 'get_quote': {
      const recent = await Quote.find({ company_id: companyId, customer_phone: userPhone }).sort({ createdAt: -1 }).limit(1).lean();
      if (recent.length) {
        return { reply: `Your last quote ${recent[0].quote_number} was for ₹${recent[0].grand_total}. Would you like a new quote?`, success: true };
      }
      return { reply: 'To get a freight quote, please tell me the pickup city, destination city, and approximate weight.', requires_followup: 'quote_details' };
    }
    case 'raise_complaint': {
      const classification = await classifyComplaint({
        subject: 'Voice-raised complaint', description: entities.description || 'Customer reported an issue via voice assistant',
        type: 'General Feedback', lr_number: entities.lr_number, companyId,
      }).catch(() => null);
      const ticket_number = genTicketNumber();
      const priority = classification?.priority || 'Medium';
      const deadlines = computeSLADeadlines(priority);
      const complaint = await Complaint.create({
        company_id: companyId, ticket_number,
        subject: 'Voice-raised complaint', description: entities.description || 'Reported via voice assistant',
        type: classification?.category || 'General Feedback', priority,
        lr_number: entities.lr_number, customer_phone: userPhone,
        sentiment: classification?.sentiment || 'neutral', sentiment_score: classification?.sentiment_score || 0,
        ...deadlines,
      }).catch(() => null);
      if (!complaint) return { reply: 'I was unable to register your complaint right now. Please try again or talk to an agent.', success: false };
      return { reply: `Your complaint has been registered. Your ticket number is ${ticket_number}. You can track it anytime.`, success: true, data: { ticket_number } };
    }
    case 'dispatch_summary': {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const trips = await Trip.find({ company_id: companyId, createdAt: { $gte: todayStart } }).lean();
      const delayed = trips.filter(t => t.status === 'exception' || t.status === 'replanning').length;
      return { reply: `Today there are ${trips.length} trips dispatched, with ${delayed} delayed or exception trips.`, success: true, data: { total: trips.length, delayed } };
    }
    case 'fleet_status': {
      const vehicles = await FleetVehicle.find({ company_id: companyId }).lean().catch(() => []);
      const available = vehicles.filter(v => v.status === 'available' || v.status === 'idle').length;
      return { reply: `There are ${available} vehicles available out of ${vehicles.length} in the fleet.`, success: true, data: { available, total: vehicles.length } };
    }
    case 'nearest_branch':
      return { reply: 'Please share your pincode or city so I can find the nearest branch.', requires_followup: 'location' };
    case 'talk_to_agent':
      return { reply: 'Connecting you to a human support agent now.', success: true, transfer_to_human: true };
    case 'revenue_kpi':
      return { reply: 'Revenue and performance KPIs are available on the management dashboard. Connecting you to an agent for detailed figures.', success: true, transfer_to_human: true };
    default:
      return { reply: "I'm not sure I understood that. Could you rephrase, or say 'talk to an agent' for human support?", success: false };
  }
}

module.exports = { classifyIntent, resolveIntent, extractEntities, SUPPORTED_LANGUAGES };
