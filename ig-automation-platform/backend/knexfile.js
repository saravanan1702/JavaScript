// Knex configuration — used by both the app (src/db/knex.js) and the CLI
// (npm run migrate). Reads the same validated env as the server.
import { env } from './src/config/env.js';

export default {
  client: 'mysql2',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4', // emoji-safe (customers love ❤️🔥)
    timezone: 'Z', // store and read all DATETIMEs as UTC
    dateStrings: false,
  },
  pool: { min: 0, max: env.DB_POOL_MAX },
  migrations: {
    directory: './src/db/migrations',
    tableName: 'knex_migrations',
    loadExtensions: ['.js'],
  },
};
