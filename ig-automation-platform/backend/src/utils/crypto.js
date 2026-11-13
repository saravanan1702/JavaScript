// AES-256-GCM encryption for secrets stored in MySQL (Instagram access tokens).
// GCM is authenticated: tampered ciphertext fails to decrypt instead of returning garbage.
//
// Stored format:  v1:<iv b64>:<auth tag b64>:<ciphertext b64>
// The "v1" prefix lets us rotate algorithms/keys later without ambiguity.
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12; // recommended IV length for GCM
const VERSION = 'v1';

function getKey(keyB64 = env.ENCRYPTION_KEY) {
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes');
  return key;
}

export function encrypt(plaintext, keyB64) {
  if (typeof plaintext !== 'string') throw new TypeError('encrypt() expects a string');
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, getKey(keyB64), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
}

export function decrypt(payload, keyB64) {
  const parts = String(payload).split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('Unrecognised encrypted payload format');
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv(ALGO, getKey(keyB64), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

/** Constant-time string comparison (for signatures / verify tokens). */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
