/**
 * Initial schema for the whole platform.
 *
 * All tables for Phases 1–8 are created up-front so later phases add code,
 * not disruptive schema changes. Tables are grouped by the phase that first
 * uses them. Everything is utf8mb4 (emoji-safe) and timestamps are UTC.
 *
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // ───────────────────────── Phase 1: admin auth ─────────────────────────
  await knex.schema.createTable('admin_users', (t) => {
    t.increments('id').primary();
    t.string('email', 191).notNullable().unique();
    t.string('name', 100).notNullable();
    t.string('password_hash', 100).notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.dateTime('last_login_at').nullable();
    t.timestamps(true, true);
  });

  // Key/value settings (automation toggles, reply delay, etc). Value is JSON.
  await knex.schema.createTable('app_settings', (t) => {
    t.string('key', 100).primary();
    t.json('value').notNullable();
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Application log: errors, Graph API failures, automation decisions.
  await knex.schema.createTable('activity_logs', (t) => {
    t.bigIncrements('id').primary();
    t.enu('level', ['debug', 'info', 'warn', 'error']).notNullable().defaultTo('info');
    t.string('scope', 50).notNullable(); // e.g. webhook, graph_api, automation, ai, auth
    t.string('message', 500).notNullable();
    t.json('context').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['level', 'created_at']);
    t.index(['scope', 'created_at']);
  });

  // ─────────────── Phase 2: Instagram professional account ───────────────
  await knex.schema.createTable('instagram_accounts', (t) => {
    t.increments('id').primary();
    t.string('ig_user_id', 64).notNullable().unique(); // Instagram professional account ID
    t.string('username', 100).notNullable();
    t.string('name', 191).nullable();
    t.string('profile_picture_url', 1024).nullable();
    t.string('account_type', 30).nullable(); // BUSINESS | MEDIA_CREATOR
    // Long-lived token, AES-256-GCM encrypted. Never returned by the API.
    t.text('access_token_enc').notNullable();
    t.dateTime('token_expires_at').nullable();
    t.dateTime('token_refreshed_at').nullable();
    t.string('granted_scopes', 500).nullable();
    t.boolean('webhooks_subscribed').notNullable().defaultTo(false);
    t.enu('status', ['active', 'token_expired', 'disconnected', 'error']).notNullable().defaultTo('active');
    t.string('status_detail', 500).nullable();
    t.timestamps(true, true);
  });

  // Cache of the account's Reels/posts so campaigns can pick a Reel.
  await knex.schema.createTable('media', (t) => {
    t.increments('id').primary();
    t.integer('account_id').unsigned().notNullable()
      .references('id').inTable('instagram_accounts').onDelete('CASCADE');
    t.string('ig_media_id', 64).notNullable().unique();
    t.string('media_type', 30).nullable(); // VIDEO | IMAGE | CAROUSEL_ALBUM
    t.string('media_product_type', 30).nullable(); // REELS | FEED | STORY
    t.text('caption').nullable();
    t.string('permalink', 1024).nullable();
    t.string('thumbnail_url', 2048).nullable();
    t.dateTime('posted_at').nullable();
    t.integer('comments_count').unsigned().nullable();
    t.dateTime('synced_at').notNullable().defaultTo(knex.fn.now());
    t.index(['account_id', 'posted_at']);
  });

  // ───────────────── Phase 3: webhook intake + comments ─────────────────
  await knex.schema.createTable('webhook_events', (t) => {
    t.bigIncrements('id').primary();
    // SHA-256 of a stable identity (e.g. "comments:<comment_id>") — duplicate protection.
    t.string('dedupe_key', 64).notNullable().unique();
    t.string('object', 30).notNullable(); // instagram
    t.string('field', 50).notNullable(); // comments | messages | ...
    t.json('payload').notNullable();
    t.enu('status', ['received', 'processing', 'processed', 'ignored', 'failed'])
      .notNullable().defaultTo('received');
    t.integer('attempts').unsigned().notNullable().defaultTo(0);
    t.text('error').nullable();
    t.timestamp('received_at').notNullable().defaultTo(knex.fn.now());
    t.dateTime('processed_at').nullable();
    t.index(['status', 'received_at']);
    t.index(['field', 'received_at']);
  });

  // ─────────────── Phase 4/5: knowledge base (used by campaigns + AI) ───────────────
  await knex.schema.createTable('business_profile', (t) => {
    t.increments('id').primary(); // single row (id = 1)
    t.string('business_name', 191).notNullable().defaultTo('');
    t.text('about').nullable();
    t.text('shipping_charges').nullable();
    t.text('delivery_info').nullable();
    t.text('payment_methods').nullable();
    t.text('cod_policy').nullable();
    t.text('return_policy').nullable();
    t.string('contact_info', 500).nullable();
    t.string('order_instructions', 1000).nullable();
    t.string('ai_tone', 300).nullable(); // e.g. "warm, friendly, short, uses 1 emoji"
    t.text('ai_extra_instructions').nullable();
    t.string('ai_language', 100).nullable(); // e.g. "Reply in the customer's language (English/Tamil/Hindi)"
    t.timestamps(true, true);
  });

  await knex.schema.createTable('products', (t) => {
    t.increments('id').primary();
    t.string('name', 191).notNullable();
    t.string('sku', 64).nullable().unique();
    t.decimal('price', 10, 2).nullable(); // null = "price on request" — AI must not invent one
    t.string('currency', 3).notNullable().defaultTo('INR');
    t.text('description').nullable();
    t.enu('stock_status', ['in_stock', 'low_stock', 'out_of_stock', 'preorder', 'unknown'])
      .notNullable().defaultTo('unknown');
    t.integer('stock_qty').unsigned().nullable();
    t.string('image_url', 1024).nullable();
    t.string('product_url', 1024).nullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('faqs', (t) => {
    t.increments('id').primary();
    t.string('question', 500).notNullable();
    t.text('answer').notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  // ─────────────────────── Phase 4: campaigns ───────────────────────
  await knex.schema.createTable('campaigns', (t) => {
    t.increments('id').primary();
    t.integer('account_id').unsigned().notNullable()
      .references('id').inTable('instagram_accounts').onDelete('CASCADE');
    t.string('name', 150).notNullable();
    // contains: "what's the price?" matches "price"; exact: whole comment must equal keyword
    t.enu('match_mode', ['contains', 'exact']).notNullable().defaultTo('contains');
    // If true, campaign applies to ALL reels of the account (no campaign_media rows needed).
    t.boolean('applies_to_all_media').notNullable().defaultTo(false);
    // JSON array of reply variants; one is picked at random so replies are not identical (spam signal).
    t.json('public_replies').notNullable();
    t.boolean('send_dm').notNullable().defaultTo(true);
    t.text('dm_message').nullable(); // private reply text (template, supports {{username}})
    t.boolean('use_ai_for_dm').notNullable().defaultTo(false);
    t.integer('product_id').unsigned().nullable()
      .references('id').inTable('products').onDelete('SET NULL');
    t.text('product_info').nullable(); // extra free-text context for this campaign
    t.integer('priority').notNullable().defaultTo(0); // higher wins when several campaigns match
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
    t.index(['account_id', 'is_active']);
  });

  await knex.schema.createTable('campaign_keywords', (t) => {
    t.increments('id').primary();
    t.integer('campaign_id').unsigned().notNullable()
      .references('id').inTable('campaigns').onDelete('CASCADE');
    t.string('keyword', 100).notNullable(); // stored lower-cased, trimmed
    t.unique(['campaign_id', 'keyword']);
  });

  await knex.schema.createTable('campaign_media', (t) => {
    t.integer('campaign_id').unsigned().notNullable()
      .references('id').inTable('campaigns').onDelete('CASCADE');
    t.string('ig_media_id', 64).notNullable();
    t.primary(['campaign_id', 'ig_media_id']);
    t.index(['ig_media_id']);
  });

  // ───────────────── Phase 3/4: comments + automation outcome ─────────────────
  await knex.schema.createTable('comments', (t) => {
    t.bigIncrements('id').primary();
    t.integer('account_id').unsigned().notNullable()
      .references('id').inTable('instagram_accounts').onDelete('CASCADE');
    t.string('ig_comment_id', 64).notNullable().unique(); // also our duplicate guard
    t.string('ig_media_id', 64).notNullable();
    t.string('parent_comment_id', 64).nullable(); // set when it's a reply to a comment
    t.string('commenter_ig_id', 64).nullable();
    t.string('commenter_username', 100).nullable();
    t.text('text').nullable();
    t.dateTime('commented_at').nullable();
    t.integer('campaign_id').unsigned().nullable()
      .references('id').inTable('campaigns').onDelete('SET NULL');
    t.string('matched_keyword', 100).nullable();
    t.enu('status', ['received', 'no_match', 'skipped', 'queued', 'completed', 'partial', 'failed'])
      .notNullable().defaultTo('received');
    t.string('skip_reason', 255).nullable(); // own comment, automation off, duplicate commenter, ...
    t.string('public_reply_id', 64).nullable();
    t.enu('public_reply_status', ['none', 'pending', 'sent', 'failed']).notNullable().defaultTo('none');
    t.enu('private_reply_status', ['none', 'pending', 'sent', 'failed', 'ineligible'])
      .notNullable().defaultTo('none');
    t.text('last_error').nullable();
    t.timestamps(true, true);
    t.index(['account_id', 'created_at']);
    t.index(['ig_media_id']);
    t.index(['campaign_id', 'created_at']);
    t.index(['commenter_ig_id']);
  });

  // ───────────────── Phase 5/7: contacts + DM conversations ─────────────────
  await knex.schema.createTable('contacts', (t) => {
    t.increments('id').primary();
    t.integer('account_id').unsigned().notNullable()
      .references('id').inTable('instagram_accounts').onDelete('CASCADE');
    t.string('igsid', 64).notNullable(); // Instagram-scoped ID used by the Messaging API
    t.string('username', 100).nullable();
    t.string('name', 191).nullable();
    t.string('profile_pic_url', 2048).nullable();
    t.boolean('ai_paused').notNullable().defaultTo(false); // human takeover
    // Meta's standard messaging window is 24h after the customer's last message.
    t.dateTime('last_inbound_at').nullable();
    t.dateTime('last_outbound_at').nullable();
    t.integer('unread_count').unsigned().notNullable().defaultTo(0);
    t.text('notes').nullable();
    t.timestamps(true, true);
    t.unique(['account_id', 'igsid']);
    t.index(['account_id', 'last_inbound_at']);
  });

  await knex.schema.createTable('messages', (t) => {
    t.bigIncrements('id').primary();
    t.integer('contact_id').unsigned().notNullable()
      .references('id').inTable('contacts').onDelete('CASCADE');
    t.enu('direction', ['inbound', 'outbound']).notNullable();
    // customer | private_reply (comment→DM) | ai | manual (you) | automation
    t.enu('source', ['customer', 'private_reply', 'ai', 'manual', 'automation']).notNullable();
    t.string('ig_message_id', 191).nullable().unique(); // mid from Meta — dedupe for echoes/retries
    t.text('text').nullable();
    t.json('attachments').nullable();
    t.enu('status', ['received', 'pending', 'sent', 'failed']).notNullable();
    t.text('error').nullable();
    t.bigInteger('comment_id').unsigned().nullable()
      .references('id').inTable('comments').onDelete('SET NULL');
    t.json('ai_meta').nullable(); // model, tokens, stop_reason — for cost tracking
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['contact_id', 'created_at']);
    t.index(['source', 'created_at']);
  });

  // ─────────── Phase 3/4: durable job queue (MySQL-backed, no Redis) ───────────
  // Webhook handlers enqueue work and return 200 instantly; a worker claims jobs with
  // SELECT ... FOR UPDATE SKIP LOCKED and retries with exponential backoff.
  await knex.schema.createTable('jobs', (t) => {
    t.bigIncrements('id').primary();
    t.string('type', 50).notNullable(); // process_comment | reply_comment | private_reply | ai_reply | send_dm
    t.json('payload').notNullable();
    t.enu('status', ['pending', 'running', 'done', 'failed']).notNullable().defaultTo('pending');
    t.integer('attempts').unsigned().notNullable().defaultTo(0);
    t.integer('max_attempts').unsigned().notNullable().defaultTo(5);
    t.dateTime('run_at').notNullable().defaultTo(knex.fn.now()); // supports reply delays + backoff
    t.dateTime('locked_at').nullable();
    t.string('locked_by', 100).nullable();
    t.text('last_error').nullable();
    t.string('dedupe_key', 191).nullable().unique(); // e.g. "reply_comment:<comment_id>"
    t.timestamps(true, true);
    t.index(['status', 'run_at']);
  });

  // Default settings (editable from the dashboard in Phase 6).
  await knex('app_settings').insert(
    Object.entries({
      comment_automation_enabled: true,
      dm_automation_enabled: true,
      ai_chatbot_enabled: false,
      reply_delay_min_seconds: 20, // randomised human-like delay range for public replies
      reply_delay_max_seconds: 90,
      one_automation_per_user_per_media: true, // duplicate-commenter protection
      reply_to_comment_replies: false, // ignore nested replies by default
    }).map(([key, value]) => ({ key, value: JSON.stringify(value) })),
  );

  await knex('business_profile').insert({ id: 1, business_name: '' });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  const tables = [
    'jobs', 'messages', 'contacts', 'comments', 'campaign_media', 'campaign_keywords',
    'campaigns', 'faqs', 'products', 'business_profile', 'webhook_events', 'media',
    'instagram_accounts', 'activity_logs', 'app_settings', 'admin_users',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
}
