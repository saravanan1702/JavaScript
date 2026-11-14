import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
vi.mock('../src/db/knex.js', () => ({ db: {}, pingDb: vi.fn() }));
vi.mock('../src/services/settings.service.js', () => ({ getSettings: vi.fn(async () => ({ ai_effort: 'low' })) }));

const Anthropic = (await import('@anthropic-ai/sdk')).default;
const claude = await import('../src/integrations/claude.js');
const ai = await import('../src/services/ai.service.js');
const { renderKnowledge, formatPrice } = await import('../src/services/knowledge.service.js');
const { aiBlockReason, isWithinMessagingWindow } = await import('../src/services/conversation.service.js');

const kb = {
  profile: { businessName: 'Sparkle Jewels', codPolicy: 'COD available in Tamil Nadu only. Ask for the PIN code.', aiTone: 'warm', aiLanguage: '', aiExtraInstructions: '' },
  products: [
    { id: 2, name: 'Silver Anklet', price: null, currency: 'INR', stockStatus: 'unknown', isActive: true, description: '' },
    { id: 1, name: 'Gold Bracelet', sku: 'BR-01', price: 499, currency: 'INR', stockStatus: 'low_stock', stockQty: 3, isActive: true, description: 'Gold plated' },
    { id: 3, name: 'Old Ring', price: 99, currency: 'INR', stockStatus: 'in_stock', isActive: false },
  ],
  faqs: [{ id: 1, question: 'Do you ship abroad?', answer: 'No, India only.', sortOrder: 0, isActive: true }],
};

describe('renderKnowledge', () => {
  const text = renderKnowledge(kb);
  it('lists active products with exact prices and stock, in a stable order', () => {
    expect(text).toContain('Gold Bracelet [SKU BR-01]\n  Price: ₹499\n  Stock: In stock, only a few left (3 left)');
    expect(text.indexOf('Gold Bracelet')).toBeLessThan(text.indexOf('Silver Anklet'));
    expect(text).not.toContain('Old Ring');
  });
  it('tells the AI never to quote missing prices or promise unknown stock', () => {
    expect(text).toMatch(/Silver Anklet\n  Price: NOT LISTED: never quote a price/);
    expect(text).toMatch(/Stock not confirmed: do not promise availability/);
    expect(text).toMatch(/Shipping charges: \(not provided: do not guess\)/);
  });
  it('is byte-identical for identical input (keeps prompt caching effective)', () => {
    expect(renderKnowledge(kb)).toBe(text);
  });
  it('formats prices', () => {
    expect(formatPrice(1499, 'INR')).toBe('₹1,499');
    expect(formatPrice(null)).toBeNull();
  });
});

describe('buildMessages', () => {
  it('starts with the customer comment when our private reply came first, and merges bursts', () => {
    const msgs = ai.buildMessages(
      [
        { direction: 'outbound', text: 'Hi! The bracelet is ₹499' },
        { direction: 'inbound', text: 'Is COD available?' },
        { direction: 'inbound', text: 'pin 600001' },
        { direction: 'inbound', text: null },
      ],
      'Price?',
    );
    expect(msgs).toEqual([
      { role: 'user', content: '(Commented on your Reel) Price?' },
      { role: 'assistant', content: 'Hi! The bracelet is ₹499' },
      { role: 'user', content: 'Is COD available?\npin 600001\n[sent a photo or attachment]' },
    ]);
  });
});

describe('sanitizeReply', () => {
  it('removes markdown and stays within Instagram\'s 1000 characters', () => {
    expect(ai.sanitizeReply('**Price:** ₹499\n- Gold\n\n\n\nThanks')).toBe('Price: ₹499\n• Gold\n\nThanks');
    const long = ai.sanitizeReply(`${'This is a sentence. '.repeat(80)}`);
    expect(long.length).toBeLessThanOrEqual(1000);
    expect(long.endsWith('.')).toBe(true);
  });
});

describe('system prompt', () => {
  it('contains the grounding rules, owner tone and the knowledge base', () => {
    const sys = ai.buildCachedSystem(kb);
    expect(sys).toMatch(/Never invent or estimate prices/);
    expect(sys).toMatch(/ignore your rules/);
    expect(sys).toContain('Tone: warm');
    expect(sys).toContain('# KNOWLEDGE BASE');
  });
  it('puts per-conversation context in the dynamic part', () => {
    const dyn = ai.buildDynamicSystem({ username: 'priya', campaign: { name: 'Bracelet', product_info: 'Free gift box' }, product: { name: 'Gold Bracelet', price: 499, currency: 'INR' } });
    expect(dyn).toContain('priya');
    expect(dyn).toContain('Gold Bracelet (₹499)');
    expect(dyn).toContain('Free gift box');
  });
});

describe('aiBlockReason + messaging window', () => {
  const base = { settings: { ai_chatbot_enabled: true }, configured: true, account: { status: 'active' }, contact: { ai_paused: false }, message: { text: 'hi' } };
  it('allows when everything is on', () => expect(aiBlockReason(base)).toBeNull());
  it('explains why the AI stays quiet', () => {
    expect(aiBlockReason({ ...base, settings: { ai_chatbot_enabled: false } })).toBe('ai_disabled');
    expect(aiBlockReason({ ...base, configured: false })).toBe('ai_not_configured');
    expect(aiBlockReason({ ...base, contact: { ai_paused: true } })).toBe('ai_paused_for_contact');
    expect(aiBlockReason({ ...base, account: { status: 'token_expired' } })).toBe('account_inactive');
    expect(aiBlockReason({ ...base, message: { text: '  ' } })).toBe('no_text');
  });
  it('enforces the 24-hour window', () => {
    const now = Date.now();
    expect(isWithinMessagingWindow(new Date(now - 23 * 3600e3), now)).toBe(true);
    expect(isWithinMessagingWindow(new Date(now - 25 * 3600e3), now)).toBe(false);
    expect(isWithinMessagingWindow(null, now)).toBe(false);
  });
});

describe('Claude client', () => {
  let parse;
  beforeEach(() => {
    parse = vi.fn();
    claude.__setClientForTests({ beta: { messages: { parse } } });
  });

  it('sends a cached system prompt, structured output format, effort and refusal fallback', async () => {
    parse.mockResolvedValueOnce({ model: 'claude-opus-5-5', stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 900 }, parsed_output: { reply: 'Hi! ₹499', needs_human: false, handoff_reason: '', intent: 'price' } });
    const r = await claude.generateReply({ cachedSystem: 'RULES+KB', dynamicSystem: 'ctx', messages: [{ role: 'user', content: 'price?' }], effort: 'low' });
    const params = parse.mock.calls[0][0];
    expect(params.model).toBe('claude-opus-5-5');
    expect(params.system[0]).toEqual({ type: 'text', text: 'RULES+KB', cache_control: { type: 'ephemeral' } });
    expect(params.system[1]).toEqual({ type: 'text', text: 'ctx' });
    expect(params.output_config.effort).toBe('low');
    expect(params.output_config.format.type).toBe('json_schema');
    expect(params.fallbacks).toBe('default');
    expect(params.betas).toEqual(['server-side-fallback-2026-07-01']);
    expect(params).not.toHaveProperty('thinking'); // Opus 5.5: thinking is always on; never send "disabled"
    expect(r.output.reply).toBe('Hi! ₹499');
    expect(r.meta.cacheReadTokens).toBe(900);
  });

  it('reports refusals instead of sending them', async () => {
    parse.mockResolvedValueOnce({ model: 'm', stop_reason: 'refusal', stop_details: { category: 'cyber' }, usage: {}, parsed_output: null });
    const r = await claude.generateReply({ cachedSystem: 'a', dynamicSystem: 'b', messages: [] });
    expect(r.refused).toBe(true);
  });

  it('treats a truncated reply as an error', async () => {
    parse.mockResolvedValueOnce({ model: 'm', stop_reason: 'max_tokens', usage: {}, parsed_output: null });
    await expect(claude.generateReply({ cachedSystem: 'a', dynamicSystem: 'b', messages: [] })).rejects.toThrow(/no usable reply/);
  });

  it('maps SDK errors to retryable / permanent', () => {
    const mk = (Cls, status) => Object.assign(Object.create(Cls.prototype), { status, message: 'x' });
    expect(claude.toAiError(mk(Anthropic.RateLimitError, 429)).retryable).toBe(true);
    expect(claude.toAiError(mk(Anthropic.InternalServerError, 500)).retryable).toBe(true);
    expect(claude.toAiError(mk(Anthropic.APIConnectionError)).retryable).toBe(true);
    expect(claude.toAiError(mk(Anthropic.AuthenticationError, 401))).toMatchObject({ retryable: false, message: 'Claude API key is invalid' });
    expect(claude.toAiError(mk(Anthropic.BadRequestError, 400)).retryable).toBe(false);
  });
});
