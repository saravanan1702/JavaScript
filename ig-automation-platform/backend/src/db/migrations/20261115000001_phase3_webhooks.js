/**
 * Phase 3: comment detection + webhook intake.
 * - comments.status gains 'matched' (keyword matched, waiting for Phase 4 actions)
 * - webhook_events gains account_id + a short human-readable summary for the Logs page
 *
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.raw(`ALTER TABLE comments MODIFY status
    ENUM('received','no_match','skipped','matched','queued','completed','partial','failed')
    NOT NULL DEFAULT 'received'`);

  await knex.schema.alterTable('webhook_events', (t) => {
    t.integer('account_id').unsigned().nullable().after('field');
    t.string('summary', 255).nullable().after('account_id');
  });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex('comments').where({ status: 'matched' }).update({ status: 'received' });
  await knex.raw(`ALTER TABLE comments MODIFY status
    ENUM('received','no_match','skipped','queued','completed','partial','failed')
    NOT NULL DEFAULT 'received'`);
  await knex.schema.alterTable('webhook_events', (t) => {
    t.dropColumn('account_id');
    t.dropColumn('summary');
  });
}
