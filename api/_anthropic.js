// Shared Anthropic client for every Compass model call.
//
// Every call in Compass is a single request/response — there is no agentic
// loop, no tool use, and no model-initiated retry. Cost per request is bounded
// by maxTokens, which is a server-enforced ceiling. Thinking tokens count
// against that same ceiling, so budgets below leave headroom for both.

import Anthropic from '@anthropic-ai/sdk';

// Reasoning pass. Connects weak signals into named patterns — the one place
// where model capability actually shows up in the product.
export const EXTRACTION_MODEL = process.env.COMPASS_EXTRACTION_MODEL || 'claude-opus-5';
// Voice pass. Style and constraint compliance, not inference.
export const NARRATIVE_MODEL = process.env.COMPASS_NARRATIVE_MODEL || 'claude-sonnet-5';
// Short-form classification and single-paragraph interpretation.
export const SHORT_FORM_MODEL = process.env.COMPASS_SHORT_FORM_MODEL || 'claude-haiku-4-5';

let cachedClient = null;

export class MissingApiKeyError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not set in this environment.');
    this.name = 'MissingApiKeyError';
    this.isMissingApiKey = true;
  }
}

export function hasAnthropicKey() {
  return Boolean(String(process.env.ANTHROPIC_API_KEY || '').trim());
}

function getClient() {
  if (!hasAnthropicKey()) throw new MissingApiKeyError();
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

// Raised when a response came back incomplete or refused. Callers decide
// whether to retry or degrade — this is never swallowed silently, which is
// how the previous implementation shipped empty insight maps as successes.
export class IncompleteResponseError extends Error {
  constructor(stopReason, detail = '') {
    super(`Model stopped with "${stopReason}"${detail ? `: ${detail}` : ''}`);
    this.name = 'IncompleteResponseError';
    this.stopReason = stopReason;
  }
}

function collectText(message) {
  return (message?.content || [])
    .filter((block) => block?.type === 'text')
    .map((block) => block.text || '')
    .join('')
    .trim();
}

function assertComplete(message) {
  const stop = message?.stop_reason;
  if (stop === 'max_tokens') {
    throw new IncompleteResponseError('max_tokens', 'raise maxTokens for this call');
  }
  if (stop === 'refusal') {
    throw new IncompleteResponseError('refusal', message?.stop_details?.category || '');
  }
  return message;
}

export function usageSummary(message) {
  const usage = message?.usage || {};
  return {
    inputTokens: usage.input_tokens ?? null,
    outputTokens: usage.output_tokens ?? null,
    cacheReadTokens: usage.cache_read_input_tokens ?? null,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? null,
    stopReason: message?.stop_reason ?? null,
  };
}

/**
 * Structured JSON request. The schema is enforced by the API, so a truncated
 * or malformed body is impossible — the only failure modes left are transport
 * errors and hitting maxTokens, and both throw rather than returning junk.
 *
 * `system` accepts an array of blocks so callers can place a cache breakpoint
 * on the stable prefix. See buildCachedSystem below.
 */
export async function createJson({
  model,
  system,
  user,
  schema,
  maxTokens,
  effort = 'medium',
  thinking = true,
}) {
  const message = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    ...(thinking ? { thinking: { type: 'adaptive' } } : {}),
    output_config: {
      effort,
      format: { type: 'json_schema', schema },
    },
  });

  assertComplete(message);
  const raw = collectText(message);
  if (!raw) throw new IncompleteResponseError('empty', 'no text content returned');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new IncompleteResponseError('unparseable', err?.message || 'JSON.parse failed');
  }
  return { data: parsed, usage: usageSummary(message) };
}

/** Plain-text request for the short single-paragraph calls. */
export async function createText({
  model,
  system,
  user,
  maxTokens,
  effort = 'low',
  thinking = false,
}) {
  const message = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    ...(thinking ? { thinking: { type: 'adaptive' } } : {}),
    output_config: { effort },
  });

  assertComplete(message);
  return { text: collectText(message), usage: usageSummary(message) };
}

/**
 * Builds a system prompt as [stable, volatile] blocks with a cache breakpoint
 * after the stable half. Caching is a prefix match, so anything that varies
 * per leader — or per guide — has to come after the breakpoint or the cache
 * never hits.
 */
export function buildCachedSystem(stablePrefix, volatileSuffix = '') {
  const blocks = [
    {
      type: 'text',
      text: stablePrefix,
      cache_control: { type: 'ephemeral' },
    },
  ];
  if (volatileSuffix) {
    blocks.push({ type: 'text', text: volatileSuffix });
  }
  return blocks;
}
