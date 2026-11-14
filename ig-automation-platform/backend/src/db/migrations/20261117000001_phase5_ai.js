/**
 * Phase 5: AI conversations.
 * - contacts: human-handoff flags so the inbox can show "needs you"
 * - settings: AI behaviour defaults
 *
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable('contacts', (t) => {
    t.boolean('needs_attention').notNullable().defaultTo(false).after('ai_paused');
    t.string('attention_reason', 255).nullable().after('needs_attention');
    t.string('ai_paused_reason', 100).nullable().after('attention_reason');
  });
  const defaults = {
    ai_effort: 'low', // low | medium | high — depth vs speed/cost of AI replies
    ai_reply_delay_seconds: 8, // wait for customers who send several short messages in a row
    pause_ai_on_handoff: true, // AI stops after saying "I'll check with the team"
    pause_ai_on_manual_reply: true, // you replied from the Instagram app → AI steps back
  };
  for (const [key, value] of Object.entries(defaults)) {
    await knex('app_settings').insert({ key, value: JSON.stringify(value) }).onConflict('key').ignore();
  }
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex.schema.alterTable('contacts', (t) => {
    t.dropColumn('needs_attention');
    t.dropColumn('attention_reason');
    t.dropColumn('ai_paused_reason');
  });
  await knex('app_settings').whereIn('key', ['ai_effort', 'ai_reply_delay_seconds', 'pause_ai_on_handoff', 'pause_ai_on_manual_reply']).del();
}
