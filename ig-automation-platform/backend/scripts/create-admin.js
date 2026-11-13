// Creates the first dashboard admin account.
//   npm run create-admin
// Or non-interactively (e.g. in a provisioning script):
//   ADMIN_EMAIL=you@example.com ADMIN_NAME="You" ADMIN_PASSWORD='...' npm run create-admin
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { z } from 'zod';
import { db } from '../src/db/knex.js';
import { createAdmin } from '../src/services/auth.service.js';

const schema = z.object({
  email: z.email(),
  name: z.string().min(1).max(100),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

async function ask() {
  const rl = readline.createInterface({ input, output });
  const email = process.env.ADMIN_EMAIL || (await rl.question('Admin email: '));
  const name = process.env.ADMIN_NAME || (await rl.question('Display name: '));
  const password = process.env.ADMIN_PASSWORD || (await rl.question('Password (min 12 chars): '));
  rl.close();
  return { email, name, password };
}

try {
  const parsed = schema.safeParse(await ask());
  if (!parsed.success) {
    console.error('❌', parsed.error.issues.map((i) => i.message).join('; '));
    process.exitCode = 1;
  } else if (await db('admin_users').where({ email: parsed.data.email.toLowerCase() }).first()) {
    console.error('❌ An admin with that email already exists.');
    process.exitCode = 1;
  } else {
    const id = await createAdmin(parsed.data);
    console.log(`✅ Admin #${id} created. You can now sign in to the dashboard.`);
  }
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
