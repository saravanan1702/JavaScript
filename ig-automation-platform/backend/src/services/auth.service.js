import bcrypt from 'bcryptjs';
import { db } from '../db/knex.js';

const BCRYPT_ROUNDS = 12;
// Comparing against a real hash when the email doesn't exist keeps response time
// the same, so attackers can't discover valid admin emails by timing.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', BCRYPT_ROUNDS);

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Returns the admin (without password hash) if credentials are valid, otherwise null. */
export async function verifyCredentials(email, password) {
  const admin = await db('admin_users').where({ email: email.toLowerCase().trim() }).first();
  const ok = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok || !admin.is_active) return null;

  await db('admin_users').where({ id: admin.id }).update({ last_login_at: db.fn.now() });
  return toPublicAdmin(admin);
}

export async function findAdminById(id) {
  const admin = await db('admin_users').where({ id, is_active: true }).first();
  return admin ? toPublicAdmin(admin) : null;
}

export async function createAdmin({ email, name, password }) {
  const [id] = await db('admin_users').insert({
    email: email.toLowerCase().trim(),
    name,
    password_hash: await hashPassword(password),
  });
  return id;
}

function toPublicAdmin({ id, email, name, last_login_at }) {
  return { id, email, name, lastLoginAt: last_login_at };
}
