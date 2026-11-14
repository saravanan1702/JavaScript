// Business knowledge base: profile, products, FAQs.
// This is the ONLY information the AI may use to answer customers — prices and stock in
// particular come exclusively from the products table.
import { z } from 'zod';
import { db } from '../db/knex.js';
import { notFound } from '../utils/httpError.js';
import { logActivity } from './activityLog.service.js';

const text = (max) => z.string().trim().max(max).default('');

export const profileSchema = z.object({
  businessName: text(191),
  about: text(3000),
  shippingCharges: text(2000),
  deliveryInfo: text(2000),
  paymentMethods: text(1000),
  codPolicy: text(1000),
  returnPolicy: text(3000),
  contactInfo: text(500),
  orderInstructions: text(1000),
  aiTone: text(300),
  aiLanguage: text(100),
  aiExtraInstructions: text(3000),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(191),
  sku: z.string().trim().max(64).nullable().optional().transform((v) => v || null),
  price: z.coerce.number().min(0).max(10_000_000).nullable().optional().transform((v) => (v === undefined ? null : v)),
  currency: z.string().trim().length(3).toUpperCase().default('INR'),
  description: text(3000),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'preorder', 'unknown']).default('unknown'),
  stockQty: z.coerce.number().int().min(0).nullable().optional().transform((v) => (v === undefined ? null : v)),
  imageUrl: z.union([z.url().max(1024), z.literal('')]).default(''),
  productUrl: z.union([z.url().max(1024), z.literal('')]).default(''),
  isActive: z.boolean().default(true),
});

export const faqSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(500),
  answer: z.string().trim().min(1, 'Answer is required').max(3000),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

const PROFILE_COLUMNS = {
  businessName: 'business_name', about: 'about', shippingCharges: 'shipping_charges', deliveryInfo: 'delivery_info',
  paymentMethods: 'payment_methods', codPolicy: 'cod_policy', returnPolicy: 'return_policy', contactInfo: 'contact_info',
  orderInstructions: 'order_instructions', aiTone: 'ai_tone', aiLanguage: 'ai_language', aiExtraInstructions: 'ai_extra_instructions',
};

// ─────────────── profile ───────────────

export async function getProfile() {
  let row = await db('business_profile').where({ id: 1 }).first();
  if (!row) {
    await db('business_profile').insert({ id: 1, business_name: '' });
    row = await db('business_profile').where({ id: 1 }).first();
  }
  return Object.fromEntries(Object.entries(PROFILE_COLUMNS).map(([k, col]) => [k, row[col] ?? '']));
}

export async function updateProfile(input) {
  const row = Object.fromEntries(Object.entries(PROFILE_COLUMNS).map(([k, col]) => [col, input[k] || null]));
  row.business_name = input.businessName || '';
  await db('business_profile').where({ id: 1 }).update({ ...row, updated_at: new Date() });
  await logActivity({ scope: 'knowledge', message: 'Updated business profile' });
  return getProfile();
}

// ─────────────── products ───────────────

const toProduct = (r) => ({
  id: r.id, name: r.name, sku: r.sku, price: r.price == null ? null : Number(r.price), currency: r.currency,
  description: r.description ?? '', stockStatus: r.stock_status, stockQty: r.stock_qty, imageUrl: r.image_url ?? '',
  productUrl: r.product_url ?? '', isActive: Boolean(r.is_active), updatedAt: r.updated_at,
});
const productRow = (p) => ({
  name: p.name, sku: p.sku, price: p.price, currency: p.currency, description: p.description || null,
  stock_status: p.stockStatus, stock_qty: p.stockQty, image_url: p.imageUrl || null, product_url: p.productUrl || null, is_active: p.isActive,
});

export async function listProducts() {
  return (await db('products').orderBy([{ column: 'is_active', order: 'desc' }, { column: 'name' }])).map(toProduct);
}
export async function createProduct(input) {
  const [id] = await db('products').insert(productRow(input));
  await logActivity({ scope: 'knowledge', message: `Added product "${input.name}"` });
  return toProduct(await db('products').where({ id }).first());
}
export async function updateProduct(id, input) {
  if (!(await db('products').where({ id }).update({ ...productRow(input), updated_at: new Date() }))) throw notFound('Product not found');
  await logActivity({ scope: 'knowledge', message: `Updated product "${input.name}"` });
  return toProduct(await db('products').where({ id }).first());
}
export async function deleteProduct(id) {
  if (!(await db('products').where({ id }).del())) throw notFound('Product not found');
}

// ─────────────── FAQs ───────────────

const toFaq = (r) => ({ id: r.id, question: r.question, answer: r.answer, sortOrder: r.sort_order, isActive: Boolean(r.is_active) });

export async function listFaqs() {
  return (await db('faqs').orderBy([{ column: 'sort_order' }, { column: 'id' }])).map(toFaq);
}
export async function createFaq(input) {
  const [id] = await db('faqs').insert({ question: input.question, answer: input.answer, sort_order: input.sortOrder, is_active: input.isActive });
  return toFaq(await db('faqs').where({ id }).first());
}
export async function updateFaq(id, input) {
  const n = await db('faqs').where({ id }).update({ question: input.question, answer: input.answer, sort_order: input.sortOrder, is_active: input.isActive, updated_at: new Date() });
  if (!n) throw notFound('FAQ not found');
  return toFaq(await db('faqs').where({ id }).first());
}
export async function deleteFaq(id) {
  if (!(await db('faqs').where({ id }).del())) throw notFound('FAQ not found');
}

// ─────────────── knowledge text for the AI ───────────────

const STOCK_TEXT = {
  in_stock: 'In stock',
  low_stock: 'In stock, only a few left',
  out_of_stock: 'OUT OF STOCK',
  preorder: 'Available on pre-order',
  unknown: 'Stock not confirmed: do not promise availability; offer to check with the team',
};

export function formatPrice(price, currency = 'INR') {
  if (price == null) return null;
  const symbol = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[currency];
  const amount = Number(price).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return symbol ? `${symbol}${amount}` : `${amount} ${currency}`;
}

/**
 * Pure function: renders the knowledge base as plain text for the system prompt.
 * Deterministic ordering, so the prompt stays byte-identical between requests and the
 * prompt cache keeps working until something is actually edited.
 */
export function renderKnowledge({ profile, products, faqs }) {
  const line = (label, value) => (value && String(value).trim() ? `${label}: ${String(value).trim()}` : `${label}: (not provided: do not guess)`);
  const parts = [
    '## Business',
    line('Business name', profile.businessName),
    line('About', profile.about),
    line('Contact', profile.contactInfo),
    '',
    '## Ordering, payment & delivery',
    line('How to order', profile.orderInstructions),
    line('Payment methods', profile.paymentMethods),
    line('Cash on delivery (COD)', profile.codPolicy),
    line('Shipping charges', profile.shippingCharges),
    line('Delivery information', profile.deliveryInfo),
    line('Return / exchange policy', profile.returnPolicy),
    '',
    '## Products (the ONLY valid prices and stock information)',
  ];
  const active = products.filter((p) => p.isActive).sort((a, b) => a.id - b.id);
  if (!active.length) parts.push('(No products listed. Do not quote any price.)');
  for (const p of active) {
    const price = formatPrice(p.price, p.currency);
    parts.push(
      [
        `- ${p.name}${p.sku ? ` [SKU ${p.sku}]` : ''}`,
        `  Price: ${price ?? 'NOT LISTED: never quote a price for this item; offer to check with the team'}`,
        `  Stock: ${STOCK_TEXT[p.stockStatus] ?? STOCK_TEXT.unknown}${p.stockStatus === 'low_stock' && p.stockQty ? ` (${p.stockQty} left)` : ''}`,
        p.description ? `  Details: ${p.description}` : null,
        p.productUrl ? `  Link: ${p.productUrl}` : null,
      ].filter(Boolean).join('\n'),
    );
  }
  const activeFaqs = faqs.filter((f) => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  if (activeFaqs.length) {
    parts.push('', '## FAQs');
    for (const f of activeFaqs) parts.push(`Q: ${f.question}\nA: ${f.answer}`);
  }
  return parts.join('\n');
}

export async function loadKnowledge() {
  const [profile, products, faqs] = await Promise.all([getProfile(), listProducts(), listFaqs()]);
  return { profile, products, faqs };
}

export async function getProduct(id) {
  const r = id ? await db('products').where({ id }).first() : null;
  return r ? toProduct(r) : null;
}
