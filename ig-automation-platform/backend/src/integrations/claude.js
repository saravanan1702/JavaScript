// Claude API client for customer conversations (official @anthropic-ai/sdk).
//
// - Structured output: Claude returns validated JSON { reply, needs_human, handoff_reason, intent },
//   so "hand over to a human" is a reliable flag, not something we guess from the text.
// - Prompt caching: the long, rarely-changing part of the system prompt (rules + knowledge base)
//   is cached; only the per-conversation context changes between requests.
// - Server-side refusal fallback (on models that support it): if a safety classifier declines
//   a harmless request, the API retries on a fallback model inside the same call.
// - The API key lives only in backend/.env; it is never sent to the browser.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { env } from '../config/env.js';

export const INTENTS = ['greeting', 'price', 'availability', 'order', 'shipping', 'payment', 'cod', 'returns', 'complaint', 'other'];

export const AiReplySchema = z.object({
  reply: z.string().describe('The message to send to the customer, plain text, no markdown.'),
  needs_human: z.boolean().describe('True if a team member must step in (missing info, order to confirm, complaint, unclear request).'),
  handoff_reason: z.string().describe('Short reason when needs_human is true, otherwise an empty string.'),
  intent: z.enum(INTENTS).describe('What the customer mainly wants.'),
});

// Models that accept the server-side refusal fallback parameter.
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-2', 'claude-fable-5-1', 'claude-sonnet-5-5']);

export class AiError extends Error {
  constructor(message, { retryable = false, cause } = {}) {
    super(message);
    this.name = 'AiError';
    this.retryable = retryable;
    this.cause = cause;
  }
}

let client;
export function isConfigured() {
  return Boolean(env.ANTHROPIC_API_KEY);
}

function getClient() {
  if (!env.ANTHROPIC_API_KEY) throw new AiError('ANTHROPIC_API_KEY is not set in backend/.env');
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 60_000 });
  return client;
}

/** Test hook: lets tests inject a fake client. */
export function __setClientForTests(fake) {
  client = fake;
}

/**
 * @param {object} p
 * @param {string} p.cachedSystem   rules + knowledge base (stable → cached)
 * @param {string} p.dynamicSystem  per-conversation context (not cached)
 * @param {Array<{role:'user'|'assistant', content:string}>} p.messages
 * @param {'low'|'medium'|'high'} [p.effort]
 */
export async function generateReply({ cachedSystem, dynamicSystem, messages, effort = 'low' }) {
  const model = env.ANTHROPIC_MODEL;
  const params = {
    model,
    max_tokens: 4000, // includes thinking; replies themselves are short (≤ 1000 chars)
    system: [
      { type: 'text', text: cachedSystem, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: dynamicSystem },
    ],
    messages,
    output_config: { effort, format: betaZodOutputFormat(AiReplySchema) },
  };
  if (FALLBACK_MODELS.has(model)) {
    params.betas = ['server-side-fallback-2026-07-01'];
    params.fallbacks = 'default';
  }

  let res;
  try {
    res = await getClient().beta.messages.parse(params);
  } catch (err) {
    throw toAiError(err);
  }

  const meta = {
    model: res.model,
    stopReason: res.stop_reason,
    inputTokens: res.usage?.input_tokens ?? 0,
    outputTokens: res.usage?.output_tokens ?? 0,
    cacheReadTokens: res.usage?.cache_read_input_tokens ?? 0,
    cacheWriteTokens: res.usage?.cache_creation_input_tokens ?? 0,
  };

  // Always check stop_reason before trusting the content.
  if (res.stop_reason === 'refusal') {
    return { refused: true, output: null, meta: { ...meta, refusalCategory: res.stop_details?.category ?? null } };
  }
  if (res.stop_reason === 'max_tokens' || !res.parsed_output) {
    throw new AiError(`Claude returned no usable reply (stop_reason: ${res.stop_reason})`, { retryable: false });
  }
  return { refused: false, output: res.parsed_output, meta };
}

/** Maps SDK errors (most specific first) to retryable / permanent. */
export function toAiError(err) {
  if (err instanceof AiError) return err;
  if (err instanceof Anthropic.AuthenticationError) return new AiError('Claude API key is invalid', { cause: err });
  if (err instanceof Anthropic.PermissionDeniedError) return new AiError('Claude API key lacks permission for this model', { cause: err });
  if (err instanceof Anthropic.NotFoundError) return new AiError(`Claude model "${env.ANTHROPIC_MODEL}" not found`, { cause: err });
  if (err instanceof Anthropic.BadRequestError) return new AiError(`Claude rejected the request: ${err.message}`, { cause: err });
  if (err instanceof Anthropic.RateLimitError) return new AiError('Claude rate limit reached', { retryable: true, cause: err });
  if (err instanceof Anthropic.APIConnectionError) return new AiError('Could not reach the Claude API', { retryable: true, cause: err });
  if (err instanceof Anthropic.APIError) return new AiError(`Claude API error ${err.status}`, { retryable: !err.status || err.status >= 500, cause: err });
  return new AiError(err?.message ?? 'Unknown Claude error', { retryable: true, cause: err });
}
