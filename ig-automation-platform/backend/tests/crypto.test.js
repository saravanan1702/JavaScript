import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { encrypt, decrypt, safeEqual } from '../src/utils/crypto.js';

describe('crypto (AES-256-GCM)', () => {
  it('round-trips a token', () => {
    const token = 'IGAAT-example-long-lived-token-🔥';
    const enc = encrypt(token);
    expect(enc).toMatch(/^v1:/);
    expect(enc).not.toContain(token);
    expect(decrypt(enc)).toBe(token);
  });

  it('uses a fresh IV each time', () => {
    expect(encrypt('same')).not.toBe(encrypt('same'));
  });

  it('rejects tampered ciphertext', () => {
    const [v, iv, tag, data] = encrypt('secret').split(':');
    const flipped = Buffer.from(data, 'base64');
    flipped[0] ^= 0xff;
    expect(() => decrypt([v, iv, tag, flipped.toString('base64')].join(':'))).toThrow();
  });

  it('rejects the wrong key', () => {
    const otherKey = crypto.randomBytes(32).toString('base64');
    expect(() => decrypt(encrypt('secret'), otherKey)).toThrow();
  });

  it('safeEqual compares correctly', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
