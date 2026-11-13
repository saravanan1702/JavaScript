// Keyword matching for comments, safe for emoji and non-Latin scripts (Tamil, Hindi, …).
//
// contains: the keyword must appear as a whole word/phrase:
//   "price?" ✔  "What's the PRICE 😍" ✔  "prices" ✔ (simple plural)  "priceless" ✘  "enterprice" ✘
// exact:    the comment (ignoring punctuation/emoji/case) must equal the keyword:
//   "Price!!" ✔  "price pls" ✘

const WORD_CHAR = '[\\p{L}\\p{M}\\p{N}]'; // letters + combining marks (Indic scripts) + digits

// Emoji, skin-tone modifiers, variation selectors (the invisible U+FE0F in "❤️") and ZWJ.
// Variation selectors are Unicode "marks", so they must go before word matching.
const EMOJI = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}]/gu;

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(EMOJI, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lower-cased, trimmed keyword ready for storage. */
export function normalizeKeyword(keyword) {
  return normalize(keyword).replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '');
}

function stripToWords(text) {
  return normalize(text).replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function matchesKeyword(text, keyword, mode = 'contains') {
  const kw = normalizeKeyword(keyword);
  if (!kw) return false;

  if (mode === 'exact') return stripToWords(text) === stripToWords(kw);

  const pattern = escapeRegex(kw).replace(/ /g, '\\s+');
  const plural = /\p{L}$/u.test(kw) ? 's?' : '';
  const re = new RegExp(`(?<!${WORD_CHAR})${pattern}${plural}(?!${WORD_CHAR})`, 'u');
  return re.test(normalize(text));
}

/**
 * Picks the campaign that should handle a comment.
 * Priority: higher `priority` → Reel-specific over "all Reels" → longer (more specific) keyword → newest.
 *
 * @param {string} text
 * @param {Array<{id:number, priority:number, match_mode:string, applies_to_all_media:boolean|number, keywords:string[]}>} campaigns
 * @returns {{ campaign: object, keyword: string } | null}
 */
export function findBestCampaign(text, campaigns) {
  const hits = [];
  for (const campaign of campaigns) {
    const keyword = [...campaign.keywords]
      .sort((a, b) => b.length - a.length)
      .find((k) => matchesKeyword(text, k, campaign.match_mode));
    if (keyword) hits.push({ campaign, keyword });
  }
  hits.sort(
    (a, b) =>
      (b.campaign.priority ?? 0) - (a.campaign.priority ?? 0) ||
      Number(Boolean(a.campaign.applies_to_all_media)) - Number(Boolean(b.campaign.applies_to_all_media)) ||
      b.keyword.length - a.keyword.length ||
      b.campaign.id - a.campaign.id,
  );
  return hits[0] ?? null;
}
