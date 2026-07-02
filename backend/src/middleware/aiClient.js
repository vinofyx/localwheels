/**
 * Shared Anthropic client with mandatory timeout.
 *
 * Anthropic's SDK has no built-in call timeout — a stalled network path will
 * hang the request indefinitely. This module wraps every create() call so that
 * any AI call that takes longer than AI_TIMEOUT_MS is aborted and the caller
 * receives null, allowing graceful degradation to a static fallback.
 *
 * Usage:
 *   const { callAI } = require('../middleware/aiClient');
 *   const result = await callAI({ model: 'claude-haiku-4-5-20251001', max_tokens: 200, messages: [...] });
 *   if (!result) { // AI unavailable — use fallback }
 */

const Anthropic = require('@anthropic-ai/sdk');

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS, 10) || 15_000;

let _anthropic = null;
function getClient() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

async function callAI(params) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const result = await getClient().messages.create(params, { signal: controller.signal });
    return result;
  } catch (e) {
    if (e.name === 'AbortError' || e.message?.includes('aborted')) {
      console.warn('[AI] request timed out after', AI_TIMEOUT_MS, 'ms');
    } else {
      console.warn('[AI] request failed:', e.message);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { callAI, AI_TIMEOUT_MS };
