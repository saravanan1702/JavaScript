import crypto from 'node:crypto';

/**
 * Verifies Meta's X-Hub-Signature-256 header: "sha256=<hex HMAC-SHA256 of the raw body>".
 *
 * - Uses the exact raw bytes received (re-serialised JSON would produce a different HMAC).
 * - Constant-time comparison, so timing doesn't reveal how much of a forged signature was right.
 * - Accepts any of the provided secrets (Instagram app secret, and optionally the Meta app secret).
 */
export function verifyMetaSignature(rawBody, header, secrets) {
  if (!rawBody || !Buffer.isBuffer(rawBody) || typeof header !== 'string') return false;
  const match = /^sha256=([a-f0-9]{64})$/i.exec(header.trim());
  if (!match) return false;
  const received = Buffer.from(match[1].toLowerCase(), 'hex');

  return secrets.filter(Boolean).some((secret) => {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
    return crypto.timingSafeEqual(expected, received);
  });
}

/** Builds a valid signature header — used by tests and the local webhook simulator. */
export function signMetaPayload(rawBody, secret) {
  return `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
}
