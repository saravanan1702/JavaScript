import { describe, it, expect } from 'vitest';
import { matchesKeyword, findBestCampaign, normalizeKeyword } from '../src/utils/keywordMatcher.js';

describe('matchesKeyword (contains)', () => {
  it.each([
    ['Price', 'price', true],
    ['What is the PRICE?? 😍', 'price', true],
    ['price pls', 'price', true],
    ['prices?', 'price', true],
    ['priceless 💎', 'price', false],
    ['enterprice', 'price', false],
    ['Send me the link 🙏', 'link', true],
    ['linkedin', 'link', false],
    ['is this available in gold', 'available', true],
    ['How much is it', 'how much', true],
    ['how   much', 'how much', true],
    ['ＰＲＩＣＥ', 'price', true], // full-width characters normalised
    ['விலை என்ன?', 'விலை', true], // Tamil
    ['कीमत क्या है', 'कीमत', true], // Hindi
    ['', 'price', false],
  ])('%j contains %j → %s', (text, kw, expected) => {
    expect(matchesKeyword(text, kw, 'contains')).toBe(expected);
  });
});

describe('matchesKeyword (exact)', () => {
  it('ignores case, punctuation and emoji but not extra words', () => {
    expect(matchesKeyword('Price!!! ❤️', 'price', 'exact')).toBe(true);
    expect(matchesKeyword('price please', 'price', 'exact')).toBe(false);
  });
});

describe('normalizeKeyword', () => {
  it('trims, lowercases and strips edge punctuation', () => {
    expect(normalizeKeyword('  #Price! ')).toBe('price');
  });
});

describe('findBestCampaign', () => {
  const base = { match_mode: 'contains', priority: 0, applies_to_all_media: false };
  it('returns null when nothing matches', () => {
    expect(findBestCampaign('nice video', [{ ...base, id: 1, keywords: ['price'] }])).toBeNull();
  });
  it('prefers higher priority', () => {
    const r = findBestCampaign('price and link', [
      { ...base, id: 1, keywords: ['price'] },
      { ...base, id: 2, priority: 5, keywords: ['link'] },
    ]);
    expect(r.campaign.id).toBe(2);
    expect(r.keyword).toBe('link');
  });
  it('prefers a Reel-specific campaign over an "all Reels" one', () => {
    const r = findBestCampaign('price', [
      { ...base, id: 1, applies_to_all_media: true, keywords: ['price'] },
      { ...base, id: 2, keywords: ['price'] },
    ]);
    expect(r.campaign.id).toBe(2);
  });
  it('reports the most specific keyword', () => {
    const r = findBestCampaign('what is the price list', [{ ...base, id: 1, keywords: ['price', 'price list'] }]);
    expect(r.keyword).toBe('price list');
  });
});

describe('emoji handling', () => {
  it('matches keywords glued to emoji', () => {
    expect(matchesKeyword('price❤️❤️', 'price', 'contains')).toBe(true);
    expect(matchesKeyword('😍😍price😍', 'price', 'contains')).toBe(true);
    expect(matchesKeyword('👍🏽 price', 'price', 'exact')).toBe(true);
  });
});
