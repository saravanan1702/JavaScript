// Test env: valid dummy config so src/config/env.js passes validation without a real .env.
process.env.NODE_ENV = 'test';
process.env.DB_USER ??= 'test';
process.env.DB_NAME ??= 'test';
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
process.env.ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString('base64');
process.env.INSTAGRAM_APP_ID ??= '1234567890';
process.env.INSTAGRAM_APP_SECRET ??= 'test-instagram-app-secret';
process.env.APP_BASE_URL ??= 'https://app.example.com';
process.env.FRONTEND_URL ??= 'https://app.example.com';
process.env.META_GRAPH_API_VERSION = 'v26.0';
