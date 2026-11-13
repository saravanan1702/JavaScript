/**
 * Phase 2: store the app-scoped ID returned by /me alongside the professional account ID.
 * Webhooks identify the account by the professional account ID (ig_user_id); the
 * app-scoped ID helps Phase 3 recognise comments written by our own account.
 *
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable('instagram_accounts', (t) => {
    t.string('app_scoped_id', 64).nullable().after('ig_user_id');
    t.integer('media_count').unsigned().nullable().after('account_type');
    t.dateTime('media_synced_at').nullable().after('webhooks_subscribed');
  });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex.schema.alterTable('instagram_accounts', (t) => {
    t.dropColumn('app_scoped_id');
    t.dropColumn('media_count');
    t.dropColumn('media_synced_at');
  });
}
