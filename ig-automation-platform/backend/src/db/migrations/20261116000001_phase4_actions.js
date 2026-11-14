/**
 * Phase 4: public replies + private replies.
 * Timestamps per action power the hourly safety limit and campaign stats.
 *
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable('comments', (t) => {
    t.dateTime('public_replied_at').nullable().after('public_reply_status');
    t.string('public_reply_text', 1000).nullable().after('public_replied_at');
    t.dateTime('private_replied_at').nullable().after('private_reply_status');
    t.index(['public_replied_at']);
    t.index(['private_replied_at']);
  });
  await knex('app_settings')
    .insert({ key: 'max_actions_per_hour', value: JSON.stringify(120) })
    .onConflict('key')
    .ignore();
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex.schema.alterTable('comments', (t) => {
    t.dropIndex(['public_replied_at']);
    t.dropIndex(['private_replied_at']);
    t.dropColumn('public_replied_at');
    t.dropColumn('public_reply_text');
    t.dropColumn('private_replied_at');
  });
  await knex('app_settings').where({ key: 'max_actions_per_hour' }).del();
}
