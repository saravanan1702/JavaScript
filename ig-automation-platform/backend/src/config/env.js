// Loads and validates environment variables once, at startup.
// Fails fast with a clear message if anything required is missing or malformed,
// so a misconfigured server never starts half-working.
import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Public HTTPS URL of the app (OAuth redirect + webhook callback URLs are built from it).
  APP_BASE_URL: z.url().default('http://localhost:5173'),
  // Where the React dashboard is served from (CORS + post-OAuth redirect).
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  // Set to true when running behind Nginx so req.ip / secure cookies work.
  TRUST_PROXY: bool.default('false'),

  // MySQL
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  // Admin auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('12h'),

  // 32-byte key, base64 encoded. Used for AES-256-GCM encryption of tokens at rest.
  ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, {
      message: 'ENCRYPTION_KEY must be 32 bytes, base64-encoded (run: npm run gen-secrets)',
    }),

  // Instagram API with Instagram Login (required from Phase 2 onwards).
  // NOTE: these are the *Instagram* app ID/secret shown under
  // App Dashboard → Instagram → "API setup with Instagram login" — NOT the Meta App ID at the top of the dashboard.
  INSTAGRAM_APP_ID: z.string().optional(),
  INSTAGRAM_APP_SECRET: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(), // Phase 3
  META_GRAPH_API_VERSION: z.string().regex(/^v\d+\.\d+$/).default('v26.0'),

  // Claude (required from Phase 5 onwards)
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-opus-5-5'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n\nSee backend/.env.example\n`);
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
});

/** Which optional integrations are configured — surfaced on the status endpoint. */
export const integrations = Object.freeze({
  instagramLogin: Boolean(env.INSTAGRAM_APP_ID && env.INSTAGRAM_APP_SECRET),
  webhooks: Boolean(env.INSTAGRAM_APP_SECRET && env.META_WEBHOOK_VERIFY_TOKEN),
  claude: Boolean(env.ANTHROPIC_API_KEY),
});

/** The exact OAuth redirect URI — must match the one registered in the Meta App Dashboard character for character. */
export const INSTAGRAM_REDIRECT_URI = `${env.APP_BASE_URL.replace(/\/$/, '')}/api/instagram/oauth/callback`;
