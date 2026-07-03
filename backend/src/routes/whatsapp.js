const express     = require('express');
const router      = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const AgentSession = require('../models/AgentSession');
const Shipment    = require('../models/Shipment');
const Complaint   = require('../models/Complaint');

// ─── WhatsApp Business Cloud API Webhook ──────────────────────────────────────
//
// Setup required (one-time):
//   1. Meta Developer Portal → Create App → WhatsApp product
//   2. Set webhook URL to: https://localwheels.vinofyx.com/api/whatsapp/webhook
//   3. Set WHATSAPP_VERIFY_TOKEN in .env (any random string you choose)
//   4. Set WHATSAPP_ACCESS_TOKEN in .env (from Meta portal)
//   5. Set WHATSAPP_PHONE_NUMBER_ID in .env
//
// Without these env vars, the webhook stubs run but don't send actual messages.

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'localwheels_wa_token';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID     = process.env.WHATSAPP_PHONE_NUMBER_ID;

// ── Webhook verification (GET) — Meta calls this once during setup ────────────
router.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ── Incoming message handler (POST) ──────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  // Always ACK immediately (Meta retries if you don't respond within 20s)
  res.sendStatus(200);

  try {
    const entry   = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    if (!value?.messages?.length) return;

    const msg       = value.messages[0];
    const from      = msg.from;          // customer WhatsApp number
    const text      = msg.text?.body?.trim() || '';
    const msgType   = msg.type;

    console.log(`[WhatsApp] From=${from} Type=${msgType} Text="${text}"`);

    // Simple keyword router
    const lower = text.toLowerCase();
    let reply   = null;

    if (/^(hi|hello|hey|start|help)/.test(lower)) {
      reply = `👋 Hello! Welcome to *LocalWheels* AI Support.\n\nReply with:\n1️⃣ *TRACK* <LR Number> — Track shipment\n2️⃣ *QUOTE* — Get freight quote\n3️⃣ *COMPLAINT* — Raise a complaint\n4️⃣ *BRANCH* — Find nearest branch\n5️⃣ *AGENT* — Talk to a human agent`;
    }
    else if (/^track\s+/i.test(text)) {
      const lr  = text.replace(/^track\s+/i, '').trim().toUpperCase();
      const s   = await Shipment.findOne({ lr_number: lr }).populate('branch_id', 'branch_name').lean();
      if (!s) {
        reply = `❌ No shipment found for LR *${lr}*.\nPlease verify the number and try again.`;
      } else {
        const STATUS = { booked: '📦 Booked', in_transit: '🚛 In Transit', out_for_delivery: '🏃 Out for Delivery', delivered: '✅ Delivered', hold: '⏸ On Hold' };
        reply = `📦 *LR: ${s.lr_number}*\nStatus: ${STATUS[s.status] || s.status}\nFrom: ${s.branch_id?.branch_name || 'Origin'}\nTo: ${s.destination}\nSender: ${s.sender_name}\nReceiver: ${s.receiver_name}`;
      }
    }
    else if (/complaint|complain|issue|problem/i.test(lower)) {
      const ticket = `LWC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      await Complaint.create({
        ticket_id: ticket, issue_type: 'other',
        description: `WhatsApp complaint from ${from}: ${text}`,
        contact_phone: from, source: 'chatbot',
      }).catch(() => {});
      reply = `🎫 Complaint registered!\nTicket ID: *${ticket}*\nOur team will contact you within 24–48 hours.\nCall: 📞 1800-123-4567 for urgent issues.`;
    }
    else if (/agent|human|person|support/i.test(lower)) {
      await AgentSession.create({
        session_id: `wa_${Date.now().toString(36).toUpperCase()}`,
        customer_phone: from, channel: 'whatsapp',
        issue_summary: `WhatsApp escalation: ${text}`,
        status: 'waiting',
        messages: [{ from: 'customer', content: text }],
      }).catch(() => {});
      reply = `👤 Connecting you to a live agent...\nEstimated wait: *2–5 minutes*\nTicket created. You'll receive a response shortly.`;
    }
    else if (/quote|rate|price|freight/i.test(lower)) {
      reply = `💰 *Freight Quote*\nPlease share:\n- Origin city\n- Destination city\n- Weight (kg)\n- Goods type\n\nExample: _Quote Mumbai Delhi 500kg Electronics_\n\nOr visit our website for instant quotes.`;
    }
    else if (/branch|office|location/i.test(lower)) {
      reply = `🏢 *LocalWheels Branches*\n\n📍 Head Office: Hyderabad\n📍 Adilabad\n📍 Warangal\n📍 Nizamabad\n📍 Karimnagar\n📍 Nalgonda\n📍 Khammam\n\nCall: 📞 1800-123-4567 for branch details.`;
    }
    else {
      reply = `🤖 I didn't understand that.\n\nTry:\n• *TRACK LW00000001* — Track shipment\n• *COMPLAINT* — Raise issue\n• *QUOTE* — Get price\n• *AGENT* — Talk to human\n• *HELP* — Show menu`;
    }

    if (reply) await sendWhatsAppMessage(from, reply);
  } catch (e) {
    console.error('[WhatsApp webhook]', e.message);
  }
});

// ── Send message helper ───────────────────────────────────────────────────────
async function sendWhatsAppMessage(to, text) {
  if (!ACCESS_TOKEN || !PHONE_ID) {
    console.log(`[WhatsApp] (no credentials) Would send to ${to}:\n${text}`);
    return;
  }
  try {
    const fetch = require('node-fetch');
    await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
  } catch (e) {
    console.error('[WhatsApp send]', e.message);
  }
}

// POST /api/whatsapp/send — send message from admin (requires auth)
router.post('/send', auth, async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to and message required' });
  await sendWhatsAppMessage(to, message);
  res.json({ status: true, message: 'Message queued' });
});

module.exports = router;
