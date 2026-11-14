// Automation settings stored in app_settings (key → JSON value).
// Cached briefly so the worker doesn't hit the DB for every comment.
import { z } from 'zod';
import { db } from '../db/knex.js';
import { badRequest } from '../utils/httpError.js';

export const DEFAULT_SETTINGS = Object.freeze({
  comment_automation_enabled: true,
  dm_automation_enabled: true,
  ai_chatbot_enabled: false,
  reply_delay_min_seconds: 20,
  reply_delay_max_seconds: 90,
  one_automation_per_user_per_media: true,
  reply_to_comment_replies: false,
  max_actions_per_hour: 120, // safety cap on public replies + DMs per account per hour
  ai_effort: 'low',
  ai_reply_delay_seconds: 8,
  pause_ai_on_handoff: true,
  pause_ai_on_manual_reply: true,
});

/** Which settings the dashboard may change, with validation. */
export const settingsPatchSchema = z
  .object({
    comment_automation_enabled: z.boolean(),
    dm_automation_enabled: z.boolean(),
    ai_chatbot_enabled: z.boolean(),
    reply_delay_min_seconds: z.number().int().min(0).max(3600),
    reply_delay_max_seconds: z.number().int().min(0).max(3600),
    one_automation_per_user_per_media: z.boolean(),
    reply_to_comment_replies: z.boolean(),
    max_actions_per_hour: z.number().int().min(1).max(1000),
    ai_effort: z.enum(['low', 'medium', 'high']),
    ai_reply_delay_seconds: z.number().int().min(0).max(120),
    pause_ai_on_handoff: z.boolean(),
    pause_ai_on_manual_reply: z.boolean(),
  })
  .partial()
  .strict()
  .refine((v) => v.reply_delay_min_seconds == null || v.reply_delay_max_seconds == null || v.reply_delay_min_seconds <= v.reply_delay_max_seconds, {
    message: 'Minimum delay must not be larger than the maximum delay',
    path: ['reply_delay_min_seconds'],
  });

export async function updateSettings(patch) {
  const current = await getSettings();
  const merged = { ...current, ...patch };
  if (merged.reply_delay_min_seconds > merged.reply_delay_max_seconds) {
    throw badRequest('Minimum delay must not be larger than the maximum delay');
  }
  for (const [key, value] of Object.entries(patch)) {
    await db('app_settings').insert({ key, value: JSON.stringify(value), updated_at: new Date() }).onConflict('key').merge();
  }
  clearSettingsCache();
  return getSettings();
}

const CACHE_MS = 10_000;
let cache = null;
let cachedAt = 0;

export async function getSettings() {
  if (cache && Date.now() - cachedAt < CACHE_MS) return cache;
  const rows = await db('app_settings').select('key', 'value');
  const stored = Object.fromEntries(
    rows.map((r) => [r.key, typeof r.value === 'string' ? safeParse(r.value) : r.value]),
  );
  cache = { ...DEFAULT_SETTINGS, ...stored };
  cachedAt = Date.now();
  return cache;
}

export function clearSettingsCache() {
  cache = null;
}

function safeParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}
