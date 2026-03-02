import { createHash } from 'crypto';
import type { MediaItem } from '@/types';

// ---------- Region → Language mapping ----------

const REGION_LANGUAGE_MAP: Record<string, string> = {
  spain: 'es', spanish: 'es', españa: 'es', andalusia: 'es', catalonia: 'es',
  italy: 'it', italian: 'it', italia: 'it', tuscany: 'it', sicily: 'it',
  france: 'fr', french: 'fr', provence: 'fr', brittany: 'fr',
  germany: 'de', german: 'de', deutschland: 'de', bavaria: 'de',
  portugal: 'pt', portuguese: 'pt', algarve: 'pt',
  netherlands: 'nl', dutch: 'nl', holland: 'nl',
  greece: 'el', greek: 'el',
  turkey: 'tr', turkish: 'tr', türkiye: 'tr',
  japan: 'ja', japanese: 'ja',
  china: 'zh', chinese: 'zh',
  croatia: 'hr', croatian: 'hr',
  morocco: 'ar', arabic: 'ar', egypt: 'ar', tunisia: 'ar',
  thailand: 'th', thai: 'th',
  czech: 'cs', czechia: 'cs',
  poland: 'pl', polish: 'pl',
  romania: 'ro', romanian: 'ro',
  hungary: 'hu', hungarian: 'hu',
  austria: 'de', switzerland: 'de',
  belgium: 'nl', brazil: 'pt',
  mexico: 'es', argentina: 'es', colombia: 'es', peru: 'es', chile: 'es',
  korea: 'ko', korean: 'ko',
  vietnam: 'vi', vietnamese: 'vi',
  indonesia: 'id',
  russia: 'ru', russian: 'ru',
  ukraine: 'uk', ukrainian: 'uk',
  sweden: 'sv', swedish: 'sv',
  norway: 'no', norwegian: 'no',
  denmark: 'da', danish: 'da',
  finland: 'fi', finnish: 'fi',
  iceland: 'is', icelandic: 'is',
  ireland: 'ga',
  scotland: 'gd',
  wales: 'cy',
  india: 'hi', hindi: 'hi',
};

/**
 * Detect Wikipedia language chain from a region string.
 * Returns ['en', '<local_lang>'] or ['en'] if no local language found.
 */
export function detectLanguageChain(region?: string): string[] {
  if (!region) return ['en'];

  const lower = region.toLowerCase();
  const words = lower.split(/[\s,]+/).filter(Boolean);

  for (const word of words) {
    const lang = REGION_LANGUAGE_MAP[word];
    if (lang && lang !== 'en') {
      return ['en', lang];
    }
  }

  return ['en'];
}

// ---------- Rate-limited fetch ----------

let lastRequestTime = 0;
let minDelay = 100; // ms between Wikimedia API calls
let backoffUntil = 0;

const WIKIMEDIA_HEADERS = {
  'User-Agent': 'VacationGuide/1.0 (https://github.com/vacation-guide; contact@example.com)',
};

async function throttledFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Adaptive backoff: if we got a 429, increase delay
  const now = Date.now();
  if (now < backoffUntil) {
    minDelay = 1000;
  } else if (minDelay > 100) {
    minDelay = 100;
  }

  const elapsed = now - lastRequestTime;
  if (elapsed < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
  }
  lastRequestTime = Date.now();

  const res = await fetch(url, {
    ...options,
    signal: options?.signal ?? AbortSignal.timeout(5000),
    headers: {
      ...WIKIMEDIA_HEADERS,
      ...options?.headers,
    },
  });

  if (res.status === 429) {
    backoffUntil = Date.now() + 30000;
    minDelay = 1000;
  }

  return res;
}

// ---------- Concurrency limiter ----------

async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++;
      results[idx] = await tasks[idx]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ---------- Wikidata resolution ----------

/**
 * Search Wikidata for an entity matching the attraction name + city.
 * Tries each language in the chain until a result is found.
 */
export async function resolveWikidataEntity(
  name: string,
  city: string,
  languages: string[]
): Promise<string | null> {
  const searchTerm = `${name} ${city}`;

  for (const lang of languages) {
    try {
      const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(searchTerm)}&language=${lang}&format=json&limit=1&origin=*`;
      const res = await throttledFetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.search && data.search.length > 0) {
        return data.search[0].id as string;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Fetch a Wikidata entity by QID and extract sitelinks, main image, and labels.
 */
export async function fetchWikidataEntity(qid: string): Promise<{
  sitelinks: Record<string, string>;
  mainImage: string | null;
  labels: Record<string, string>;
} | null> {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks|claims|labels&format=json&origin=*`;
    const res = await throttledFetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const entity = data.entities?.[qid];
    if (!entity) return null;

    // Extract sitelinks: { enwiki: "Title", eswiki: "Título" }
    const sitelinks: Record<string, string> = {};
    if (entity.sitelinks) {
      for (const [key, val] of Object.entries(entity.sitelinks)) {
        sitelinks[key] = (val as { title: string }).title;
      }
    }

    // Extract P18 (main image on Commons)
    let mainImage: string | null = null;
    const p18 = entity.claims?.P18;
    if (Array.isArray(p18) && p18.length > 0) {
      mainImage = p18[0]?.mainsnak?.datavalue?.value ?? null;
    }

    // Extract labels
    const labels: Record<string, string> = {};
    if (entity.labels) {
      for (const [lang, val] of Object.entries(entity.labels)) {
        labels[lang] = (val as { value: string }).value;
      }
    }

    return { sitelinks, mainImage, labels };
  } catch {
    return null;
  }
}

/**
 * Convert a Wikimedia Commons filename to a thumbnail URL.
 * Uses the MD5-based directory structure.
 */
export function commonsFilenameToUrl(filename: string, width: number = 800): string {
  const normalized = filename.replace(/ /g, '_');
  const hash = createHash('md5').update(normalized).digest('hex');
  const a = hash[0];
  const ab = hash.substring(0, 2);
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${encodeURIComponent(normalized)}/${width}px-${encodeURIComponent(normalized)}`;
}

// ---------- Multi-language Wikipedia images ----------

/**
 * Fetch an image from Wikipedia, trying each language in the chain.
 * Uses sitelinks for exact article titles, falls back to directTitle.
 */
export async function fetchWikipediaImageMultiLang(
  sitelinks: Record<string, string>,
  directTitle: string,
  languages: string[],
  width: number = 800
): Promise<string | null> {
  for (const lang of languages) {
    const sitelinkKey = `${lang}wiki`;
    const title = sitelinks[sitelinkKey] || directTitle;

    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=${width}&origin=*`;
      const res = await throttledFetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      const pages = data.query?.pages;
      if (!pages) continue;

      const page = Object.values(pages)[0] as Record<string, unknown>;
      const thumb = page?.thumbnail as { source?: string } | undefined;
      if (thumb?.source) return thumb.source;
    } catch {
      continue;
    }
  }

  return null;
}

// ---------- Wikipedia external links ----------

const TOURISM_INCLUDE = [
  'turismo', 'tourism', 'official', 'visit', 'ayuntamiento',
  'municipality', '.museum', '.gob', '.gov', 'patrimonio',
  'cultura', 'heritage', 'monument',
];

const TOURISM_EXCLUDE = [
  'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com',
  'tripadvisor', 'booking.com', 'viator', 'wikipedia.org',
  'wikidata.org', 'wikimedia.org', 'google.com', 'linkedin.com',
  'pinterest.com', 'tiktok.com', 'x.com',
];

/**
 * Fetch external links from a Wikipedia article and filter for tourism/official sites.
 */
export async function fetchWikipediaExtLinks(
  lang: string,
  title: string
): Promise<string[]> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extlinks&ellimit=50&format=json&origin=*`;
    const res = await throttledFetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];

    const page = Object.values(pages)[0] as Record<string, unknown>;
    const extlinks = page?.extlinks as Array<{ '*': string }> | undefined;
    if (!extlinks) return [];

    return extlinks
      .map(link => link['*'])
      .filter(url => {
        const lower = url.toLowerCase();
        // Exclude social media, aggregators, and archive sites
        if (TOURISM_EXCLUDE.some(ex => lower.includes(ex))) return false;
        if (lower.includes('web.archive.org')) return false;
        // Include tourism/official sites
        return TOURISM_INCLUDE.some(inc => lower.includes(inc));
      });
  } catch {
    return [];
  }
}

// ---------- Tourism website image scraping ----------

/**
 * Best-effort scrape images from a website URL.
 * Extracts og:image and <img> tags, filters out logos/icons.
 */
export async function scrapeWebsiteImages(
  url: string,
  limit: number = 3
): Promise<string[]> {
  // Only scrape HTTPS URLs
  if (!url.startsWith('https://')) return [];

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'VacationGuide/1.0',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const images: Array<{ url: string; priority: number }> = [];

    // Extract og:image (highest priority)
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogMatch?.[1]) {
      const ogUrl = resolveUrl(ogMatch[1], url);
      if (ogUrl && !isFilteredImage(ogUrl)) {
        images.push({ url: ogUrl, priority: 10 });
      }
    }

    // Extract <img src="..."> tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      // Skip data URIs and very short srcs
      if (src.startsWith('data:') || src.length < 10) continue;
      const resolved = resolveUrl(src, url);
      if (!resolved || isFilteredImage(resolved)) continue;

      // Score by preferred keywords
      const priority = getImagePriority(resolved);
      images.push({ url: resolved, priority });
    }

    // Sort by priority (highest first), deduplicate, return up to limit
    images.sort((a, b) => b.priority - a.priority);
    const seen = new Set<string>();
    const result: string[] = [];
    for (const img of images) {
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      result.push(img.url);
      if (result.length >= limit) break;
    }
    return result;
  } catch {
    return [];
  }
}

const FILTER_PATTERNS = [
  'logo', 'icon', 'favicon', 'sprite', 'tracking', '.svg',
  'pixel', 'spacer', 'blank', 'loading', 'spinner',
  'arrow', 'button', 'nav', 'menu', 'widget', 'badge',
  'avatar', 'emoji', 'smiley', 'thumb_up', 'thumb_down',
  'newsite', 'static/images/', '.gif', 'data:image',
  '1x1', '1px', 'transparent', 'placeholder',
  'selo', 'seal', 'stamp', 'branding', 'sponsor',
  'web.archive.org', '_s.jpg', '_s.png', '_small.',
  'partner', 'footer', 'sidebar',
];

// Domains that should never appear in scraped image results
const BLOCKED_DOMAINS = [
  'web.archive.org',
  'id.loc.gov',
];

const PREFER_PATTERNS = [
  'hero', 'header', 'gallery', 'photo', 'attraction',
  'wp-content/uploads', 'image', 'banner', 'slider',
];

function isFilteredImage(url: string): boolean {
  const lower = url.toLowerCase();
  if (FILTER_PATTERNS.some(p => lower.includes(p))) return true;
  if (BLOCKED_DOMAINS.some(d => lower.includes(d))) return true;
  return false;
}

function getImagePriority(url: string): number {
  const lower = url.toLowerCase();
  let priority = 0;
  for (const p of PREFER_PATTERNS) {
    if (lower.includes(p)) priority += 2;
  }
  return priority;
}

/**
 * Check if a Wikidata P18 filename is a non-photo (SVG, coat of arms, logo, flag, etc.)
 */
function isNonPhotoP18(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.svg') ||
    lower.includes('coat_of_arms') ||
    lower.includes('escudo') ||
    lower.includes('blason') ||
    lower.includes('wappen') ||
    lower.includes('flag_of') ||
    lower.includes('logo');
}

function resolveUrl(src: string, baseUrl: string): string | null {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
}

// ---------- Smart Commons search ----------

const STRIP_WORDS = new Set([
  'strand', 'en', 'de', 'la', 'del', 'promenade', 'jardín', 'botánico',
  'el', 'los', 'las', 'le', 'les', 'di', 'da', 'und', 'y',
  'the', 'of', 'and', 'van', 'het', 'een',
]);

/**
 * Search Wikimedia Commons with progressive query simplification.
 * Tries full name+city, then simplified name, stopping on first results.
 */
export async function searchCommonsImagesSmart(
  name: string,
  city: string,
  limit: number = 4
): Promise<MediaItem[]> {
  // Try 1: full name + city
  const fullResults = await searchCommonsImages(`${name} ${city}`, limit);
  if (fullResults.length > 0) return fullResults;

  // Try 2: simplified name (strip articles/prepositions) + city
  const simplified = name
    .split(/\s+/)
    .filter(w => !STRIP_WORDS.has(w.toLowerCase()))
    .join(' ')
    .trim();

  if (simplified && simplified !== name) {
    const simplifiedResults = await searchCommonsImages(`${simplified} ${city}`, limit);
    if (simplifiedResults.length > 0) return simplifiedResults;
  }

  return [];
}

/**
 * Core Commons search — used by searchCommonsImagesSmart.
 */
async function searchCommonsImages(
  query: string,
  limit: number = 4
): Promise<MediaItem[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&origin=*`;
    const res = await throttledFetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .map((page: unknown) => {
        const p = page as Record<string, unknown>;
        const info = (p.imageinfo as Array<Record<string, unknown>>)?.[0];
        const thumbUrl = info?.thumburl as string | undefined;
        const title = (p.title as string)?.replace(/^File:/, '') ?? '';
        const meta = info?.extmetadata as Record<string, { value?: string }> | undefined;
        const desc = meta?.ImageDescription?.value?.replace(/<[^>]*>/g, '') ?? title;
        if (!thumbUrl) return null;
        return {
          type: 'image' as const,
          src: thumbUrl,
          alt: { nl: desc, en: desc },
        };
      })
      .filter((item): item is MediaItem => item !== null);
  } catch {
    return [];
  }
}

// ---------- Main enrichment pipeline ----------

interface EnrichOptions {
  region?: string;
  category?: string;
  website?: string;
  wikipediaSlug?: string;
}

/**
 * Enrich an attraction with images from multiple sources:
 * Wikidata, multi-language Wikipedia, Wikimedia Commons, and tourism websites.
 *
 * Backwards-compatible: options parameter is optional.
 */
export async function enrichAttractionMedia(
  attractionName: string,
  city: string,
  options?: EnrichOptions
): Promise<{ thumbnail: string; media: MediaItem[] }> {
  const { region, website, wikipediaSlug } = options ?? {};
  const languages = detectLanguageChain(region);

  let sitelinks: Record<string, string> = {};
  let mainImage: string | null = null;
  let labels: Record<string, string> = {};
  let wikiImage: string | null = null;
  let tourismUrls: string[] = [];

  // Step 1: Resolve via Wikidata OR use provided Wikipedia slug
  if (wikipediaSlug) {
    // Use slug directly — skip Wikidata search for speed
    sitelinks = { enwiki: wikipediaSlug };
  } else {
    const qid = await resolveWikidataEntity(attractionName, city, languages);
    if (qid) {
      const entity = await fetchWikidataEntity(qid);
      if (entity) {
        sitelinks = entity.sitelinks;
        mainImage = entity.mainImage;
        labels = entity.labels;
      }
    }
  }

  // Step 2: Get P18 Commons image URL (skip SVGs, logos, coat of arms)
  let p18Url: string | null = null;
  if (mainImage && !isNonPhotoP18(mainImage)) {
    p18Url = commonsFilenameToUrl(mainImage);
  }

  // Step 3: Multi-language Wikipedia image
  const directTitle = wikipediaSlug || attractionName;
  wikiImage = await fetchWikipediaImageMultiLang(sitelinks, directTitle, languages);

  // Step 4: Wikipedia external links → tourism URLs
  for (const lang of languages) {
    const sitelinkKey = `${lang}wiki`;
    const title = sitelinks[sitelinkKey];
    if (title) {
      tourismUrls = await fetchWikipediaExtLinks(lang, title);
      if (tourismUrls.length > 0) break;
    }
  }

  // Step 5: Commons search (smart)
  const commonsImages = await searchCommonsImagesSmart(attractionName, city);

  // Step 6: Scrape tourism website images (max 2 sites)
  const scrapedImages: string[] = [];
  const sitesToScrape: string[] = [];
  if (website) sitesToScrape.push(website);
  sitesToScrape.push(...tourismUrls.slice(0, 2));
  // Max 2 total sites
  for (const siteUrl of sitesToScrape.slice(0, 2)) {
    const imgs = await scrapeWebsiteImages(siteUrl, 3);
    scrapedImages.push(...imgs);
  }

  // Step 7: Build result — thumbnail priority: P18 → wiki image → commons → scraped
  const thumbnail = p18Url || wikiImage || commonsImages[0]?.src || scrapedImages[0] || '';

  // Build media array: deduplicate all images by URL
  const seen = new Set<string>();
  const media: MediaItem[] = [];
  const altText = labels.en || labels.nl || attractionName;

  // Add Commons search results first (they have proper alt text)
  for (const item of commonsImages) {
    if (!seen.has(item.src)) {
      seen.add(item.src);
      media.push(item);
    }
  }

  // Add P18 if not already included via commons
  if (p18Url && !seen.has(p18Url)) {
    seen.add(p18Url);
    media.push({ type: 'image', src: p18Url, alt: { nl: altText, en: altText } });
  }

  // Add wiki image if not already included
  if (wikiImage && !seen.has(wikiImage)) {
    seen.add(wikiImage);
    media.push({ type: 'image', src: wikiImage, alt: { nl: altText, en: altText } });
  }

  // Add scraped images
  for (const src of scrapedImages) {
    if (!seen.has(src)) {
      seen.add(src);
      media.push({ type: 'image', src, alt: { nl: altText, en: altText } });
    }
  }

  return { thumbnail, media };
}

// ---------- Batch enrichment ----------

/**
 * Enrich multiple attractions concurrently with rate limiting.
 * Max 3 attractions in parallel to respect Wikimedia rate limits.
 */
export async function enrichAttractionsBatch(
  attractions: Array<{ name: string; city: string; category?: string; website?: string; wikipediaSlug?: string }>,
  options?: { region?: string }
): Promise<Array<{ thumbnail: string; media: MediaItem[] }>> {
  if (attractions.length === 0) return [];

  const tasks = attractions.map(attr => async () => {
    try {
      return await enrichAttractionMedia(attr.name, attr.city, {
        region: options?.region,
        category: attr.category,
        website: attr.website,
        wikipediaSlug: attr.wikipediaSlug,
      });
    } catch {
      return { thumbnail: '', media: [] as MediaItem[] };
    }
  });

  return withConcurrencyLimit(tasks, 3);
}

// ---------- Hero image ----------

/**
 * Fetch a hero image for a destination city.
 * Uses Wikidata + multi-language Wikipedia for better coverage.
 */
export async function fetchHeroImage(
  cityName: string,
  region?: string
): Promise<string | null> {
  const languages = detectLanguageChain(region);

  // Try multi-language Wikipedia
  const image = await fetchWikipediaImageMultiLang({}, cityName, languages, 1920);
  return image;
}
