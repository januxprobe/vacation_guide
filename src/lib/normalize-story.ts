/**
 * Normalize AI-generated story data before Zod validation.
 *
 * Mirrors the pattern from normalize-itinerary.ts: fixes capitalized enums,
 * plain strings → LocalizedString, string → number coercion, etc.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Helpers ──────────────────────────────────────────────────────────

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function toLocalizedString(v: unknown): { nl: string; en: string } | undefined {
  if (typeof v === 'string') return { nl: v, en: v };
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    const nl = typeof obj.nl === 'string' ? obj.nl : undefined;
    const en = typeof obj.en === 'string' ? obj.en : undefined;
    if (nl || en) return { nl: nl ?? en!, en: en ?? nl! };
  }
  return undefined;
}

// ── Block type normalization ─────────────────────────────────────────

const VALID_BLOCK_TYPES = new Set([
  'narrative',
  'attraction_highlight',
  'meal_highlight',
  'transition',
]);

function normalizeBlockType(type: unknown): string | undefined {
  if (typeof type !== 'string') return undefined;
  const lower = type.toLowerCase();
  if (VALID_BLOCK_TYPES.has(lower)) return lower;
  return undefined;
}

// ── Block normalizer ─────────────────────────────────────────────────

function normalizeBlock(block: any): void {
  if (!block || typeof block !== 'object') return;

  // type enum
  if (block.type) {
    const normalized = normalizeBlockType(block.type);
    if (normalized) block.type = normalized;
  }

  // content (narrative block)
  if (block.content !== undefined) {
    const ls = toLocalizedString(block.content);
    if (ls) block.content = ls;
  }

  // narrative (attraction_highlight, meal_highlight, transition blocks)
  if (block.narrative !== undefined) {
    const ls = toLocalizedString(block.narrative);
    if (ls) block.narrative = ls;
  }
}

// ── Chapter normalizer ───────────────────────────────────────────────

function normalizeChapter(chapter: any): void {
  if (!chapter || typeof chapter !== 'object') return;

  // dayNumber: string → number
  const dn = toNumber(chapter.dayNumber);
  if (dn !== undefined) chapter.dayNumber = dn;

  // title: LocalizedString
  if (chapter.title !== undefined) {
    const ls = toLocalizedString(chapter.title);
    if (ls) chapter.title = ls;
  }

  // blocks
  if (Array.isArray(chapter.blocks)) {
    chapter.blocks.forEach(normalizeBlock);
  }
}

// ── Main normalizer ──────────────────────────────────────────────────

/**
 * Mutates the story object in-place, normalizing AI-generated values
 * so they pass Zod validation. Call this **before** `tripStorySchema.safeParse()`.
 */
export function normalizeStory(story: unknown): void {
  if (!story || typeof story !== 'object' || Array.isArray(story)) return;
  const s = story as any;

  // style: lowercase
  if (typeof s.style === 'string') {
    s.style = s.style.toLowerCase();
  }

  // generatedAt: string → number
  const gen = toNumber(s.generatedAt);
  if (gen !== undefined) s.generatedAt = gen;

  // title, introduction, conclusion: LocalizedString
  if (s.title !== undefined) {
    const ls = toLocalizedString(s.title);
    if (ls) s.title = ls;
  }
  if (s.introduction !== undefined) {
    const ls = toLocalizedString(s.introduction);
    if (ls) s.introduction = ls;
  }
  if (s.conclusion !== undefined) {
    const ls = toLocalizedString(s.conclusion);
    if (ls) s.conclusion = ls;
  }

  // chapters
  if (Array.isArray(s.chapters)) {
    s.chapters.forEach(normalizeChapter);
  }
}
