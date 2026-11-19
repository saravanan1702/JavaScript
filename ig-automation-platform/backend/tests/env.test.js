import { describe, it, expect } from 'vitest';
import { productionProblems } from '../src/config/env.js';

const good = {
  NODE_ENV: 'production',
  APP_BASE_URL: 'https://automation.myshop.in',
  FRONTEND_URL: 'https://automation.myshop.in',
  JWT_SECRET: 'x8Kp2vQ9mN4rT7wY1zB5cF3hJ6lP0sD8gA2eR9uI4oW',
  TRUST_PROXY: true,
  DB_PASSWORD: 'a-long-random-db-password',
};

describe('productionProblems', () => {
  it('accepts a correct production config', () => {
    expect(productionProblems(good)).toEqual([]);
  });
  it('ignores development', () => {
    expect(productionProblems({ ...good, NODE_ENV: 'development', APP_BASE_URL: 'http://localhost:5173' })).toEqual([]);
  });
  it('rejects http URLs, example secrets, missing trust proxy and weak DB passwords', () => {
    const fields = productionProblems({
      ...good,
      APP_BASE_URL: 'http://automation.myshop.in',
      JWT_SECRET: 'replace-with-output-of-npm-run-gen-secrets-min-32-chars',
      TRUST_PROXY: false,
      DB_PASSWORD: 'short',
    }).map((p) => p.path[0]);
    expect(fields).toEqual(['APP_BASE_URL', 'JWT_SECRET', 'TRUST_PROXY', 'DB_PASSWORD']);
  });
});
