// Automation settings stored in app_settings (key → JSON value).
// Cached briefly so the worker doesn't hit the DB for every comment.
import { db } from '../db/knex.js';

export const DEFAULT_SETTINGS = Object.freeze({
  comment_automation_enabled: true,
  dm_automation_enabled: true,
  ai_chatbot_enabled: false,
  reply_delay_min_seconds: 20,
  reply_delay_max_seconds: 90,
  one_automation_per_user_per_media: true,
  reply_to_comment_replies: false,
});

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
