// Test env: valid dummy config so src/config/env.js passes validation without a real .env.
process.env.NODE_ENV = 'test';
process.env.DB_USER ??= 'test';
process.env.DB_NAME ??= 'test';
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
process.env.ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString('base64');
