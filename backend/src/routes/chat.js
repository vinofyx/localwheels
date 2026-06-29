const express = require('express');
const router  = express.Router();
const Shipment = require('../models/Shipment');

let AnthropicCtor;
try {
  const mod = require('@anthropic-ai/sdk');
  AnthropicCtor = mod.default ?? mod;
} catch {
  console.warn('[CHAT] @anthropic-ai/sdk not found — chat disabled');
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM = `You are Lexi, the AI customer support assistant for LocalWheels — a trusted pan-India transport, logistics, and cargo company.

You help customers with:
1. Tracking shipments by LR number
2. Freight price estimates
3. Registering complaints
4. General questions about services, branches, and policies

RULES:
- NEVER invent shipment data. Always call track_shipment before answering status questions.
- If a customer asks about a shipment but has NOT given an LR number, ask for it first.
- Be warm, concise, and professional.
- If you cannot resolve something, offer human support: 📞 1800-123-4567 (Mon–Sat 9 AM–8 PM)

LocalWheels facts:
- Services: Full Truckload (FTL), Part Truckload (PTL), Express, Warehousing, Air Cargo
- Coverage: 500+ cities across India
- Payment modes: ToPay, Paid, FOB, TBB
- Status types: Booked → In Transit → Out for Delivery → Delivered`;

// ─── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'track_shipment',
    description: 'Fetch real-time shipment status by LR number. Call this whenever a customer provides a tracking or LR number.',
    input_schema: {
      type: 'object',
      properties: {
        lr_number: { type: 'string', description: 'The LR / tracking number (e.g. LW123456)' }
      },
      required: ['lr_number']
    }
  },
  {
    name: 'get_freight_quote',
    description: 'Estimate freight cost for a shipment.',
    input_schema: {
      type: 'object',
      properties: {
        from_city:  { type: 'string',  description: 'Origin city' },
        to_city:    { type: 'string',  description: 'Destination city' },
        weight_kg:  { type: 'number',  description: 'Weight in kilograms' },
        goods_type: { type: 'string',  description: 'Type of goods (e.g. electronics, textile, furniture)' }
      },
      required: ['from_city', 'to_city', 'weight_kg']
    }
  },
  {
    name: 'register_complaint',
    description: 'Register a customer complaint and return a ticket ID.',
    input_schema: {
      type: 'object',
      properties: {
        lr_number:   { type: 'string', description: 'LR number if available' },
        issue_type:  {
          type: 'string',
          enum: ['delayed', 'damaged', 'lost', 'wrong_delivery', 'billing', 'other']
        },
        description: { type: 'string', description: 'Full description of the issue' }
      },
      required: ['issue_type', 'description']
    }
  }
];

// ─── Tool runners ─────────────────────────────────────────────────────────────
async function runTool(name, input) {
  if (name === 'track_shipment') {
    try {
      const lr = String(input.lr_number).trim().toUpperCase();
      const s  = await Shipment.findOne({ lr_number: lr })
        .populate('branch_id', 'branch_name city')
        .lean();

      if (!s) return { found: false, message: `No shipment found for LR "${lr}". Please verify the number.` };

      const STATUS = {
        booked: 'Booked', in_transit: 'In Transit',
        out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
        hold: 'On Hold', lost: 'Lost', returned: 'Returned'
      };
      return {
        found: true,
        lr_number:    s.lr_number,
        status:       STATUS[s.status] || s.status,
        origin:       s.branch_id?.branch_name || 'Origin Branch',
        destination:  s.destination,
        sender:       s.sender_name,
        receiver:     s.receiver_name,
        receiver_phone: s.receiver_phone || 'N/A',
        weight:       `${s.weight} kg`,
        packages:     s.packages,
        booking_date: s.booking_date
          ? new Date(s.booking_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'N/A',
        freight:      `₹${s.freight_amount}`,
        payment_type: (s.payment_type || '').toUpperCase(),
        description:  s.description || 'General goods'
      };
    } catch (e) {
      console.error('[track_shipment]', e.message);
      return { error: 'Could not fetch shipment right now. Please try again shortly.' };
    }
  }

  if (name === 'get_freight_quote') {
    const rates = { electronics: 18, furniture: 12, textile: 8, documents: 6, perishable: 20, pharma: 22 };
    const rate     = rates[(input.goods_type || '').toLowerCase()] || 10;
    const base     = input.weight_kg * rate;
    const fuel     = base * 0.12;
    const subtotal = base + fuel;
    const gst      = subtotal * 0.18;
    const total    = subtotal + gst;
    return {
      from: input.from_city, to: input.to_city,
      weight: `${input.weight_kg} kg`, goods_type: input.goods_type || 'General',
      base_freight: `₹${base.toFixed(0)}`,
      fuel_surcharge: `₹${fuel.toFixed(0)}`,
      gst_18_percent: `₹${gst.toFixed(0)}`,
      total_estimate: `₹${total.toFixed(0)}`,
      transit_days: '2–5 business days',
      note: 'Indicative estimate only. Contact your nearest branch for a confirmed quote.'
    };
  }

  if (name === 'register_complaint') {
    const ticket = `LWC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    return {
      success: true,
      ticket_id: ticket,
      status: 'Open',
      resolution_sla: '24–48 hours',
      message: `Complaint registered. Ticket ID: **${ticket}**. Our team will reach you within 24–48 hours.`
    };
  }

  return { error: 'Unknown tool' };
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (!AnthropicCtor) {
    return res.json({ reply: "AI service is not set up. Please configure ANTHROPIC_API_KEY. Call 1800-123-4567 for live support." });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages[] required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({
      reply: "Hi! I'm Lexi 👋 LocalWheels AI assistant. I'm not fully configured yet (ANTHROPIC_API_KEY missing). For support, call 📞 1800-123-4567."
    });
  }

  try {
    const client = new AnthropicCtor({ apiKey: process.env.ANTHROPIC_API_KEY });
    let msgs = [...messages];
    let response;

    for (let i = 0; i < 4; i++) {
      response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM,
        tools: TOOLS,
        messages: msgs
      });

      if (response.stop_reason !== 'tool_use') break;

      const toolBlock = response.content.find(b => b.type === 'tool_use');
      if (!toolBlock) break;

      const result = await runTool(toolBlock.name, toolBlock.input);

      msgs = [
        ...msgs,
        { role: 'assistant', content: response.content },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolBlock.id, content: JSON.stringify(result) }] }
      ];
    }

    const text = response?.content?.find(b => b.type === 'text')?.text;
    res.json({ reply: text || "I couldn't process that. Please try again or call 1800-123-4567." });

  } catch (err) {
    console.error('[CHAT]', err.message);
    res.status(500).json({ reply: 'Service temporarily unavailable. Please call 📞 1800-123-4567.' });
  }
});

module.exports = router;
