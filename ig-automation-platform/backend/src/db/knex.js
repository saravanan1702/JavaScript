import knexLib from 'knex';
import config from '../../knexfile.js';

export const db = knexLib(config);

/** Returns true if MySQL answers a trivial query. Used by the health endpoint. */
export async function pingDb() {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
