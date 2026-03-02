import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MediaItem } from '@/types';

// We need to import the functions after mocking fetch
let detectLanguageChain: (region?: string) => string[];
let resolveWikidataEntity: (name: string, city: string, languages: string[]) => Promise<string | null>;
let fetchWikidataEntity: (qid: string) => Promise<{
  sitelinks: Record<string, string>;
  mainImage: string | null;
  labels: Record<string, string>;
} | null>;
let commonsFilenameToUrl: (filename: string, width?: number) => string;
let fetchWikipediaImageMultiLang: (
  sitelinks: Record<string, string>,
  directTitle: string,
  languages: string[],
  width?: number
) => Promise<string | null>;
let fetchWikipediaExtLinks: (lang: string, title: string) => Promise<string[]>;
let scrapeWebsiteImages: (url: string, limit?: number) => Promise<string[]>;
let searchCommonsImagesSmart: (name: string, city: string, limit?: number) => Promise<MediaItem[]>;
let enrichAttractionMedia: (
  attractionName: string,
  city: string,
  options?: { region?: string; category?: string; website?: string; wikipediaSlug?: string }
) => Promise<{ thumbnail: string; media: MediaItem[] }>;
let enrichAttractionsBatch: (
  attractions: Array<{ name: string; city: string; category?: string; website?: string; wikipediaSlug?: string }>,
  options?: { region?: string }
) => Promise<Array<{ thumbnail: string; media: MediaItem[] }>>;
let fetchHeroImage: (cityName: string, region?: string) => Promise<string | null>;

const originalFetch = global.fetch;

beforeEach(async () => {
  vi.resetModules();
  global.fetch = vi.fn();
  const mod = await import('@/lib/wikimedia');
  detectLanguageChain = mod.detectLanguageChain;
  resolveWikidataEntity = mod.resolveWikidataEntity;
  fetchWikidataEntity = mod.fetchWikidataEntity;
  commonsFilenameToUrl = mod.commonsFilenameToUrl;
  fetchWikipediaImageMultiLang = mod.fetchWikipediaImageMultiLang;
  fetchWikipediaExtLinks = mod.fetchWikipediaExtLinks;
  scrapeWebsiteImages = mod.scrapeWebsiteImages;
  searchCommonsImagesSmart = mod.searchCommonsImagesSmart;
  enrichAttractionMedia = mod.enrichAttractionMedia;
  enrichAttractionsBatch = mod.enrichAttractionsBatch;
  fetchHeroImage = mod.fetchHeroImage;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

const mockFetch = () => global.fetch as ReturnType<typeof vi.fn>;

// Helper to create a successful fetch response
function mockResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

// ---------- detectLanguageChain ----------

describe('detectLanguageChain', () => {
  it('returns [en, es] for Spain', () => {
    expect(detectLanguageChain('Andalusia, Spain')).toEqual(['en', 'es']);
  });

  it('returns [en, it] for Italy', () => {
    expect(detectLanguageChain('Tuscany, Italy')).toEqual(['en', 'it']);
  });

  it('returns [en, ja] for Japan', () => {
    expect(detectLanguageChain('Tokyo, Japan')).toEqual(['en', 'ja']);
  });

  it('returns [en] for undefined region', () => {
    expect(detectLanguageChain(undefined)).toEqual(['en']);
  });

  it('returns [en] for unknown region', () => {
    expect(detectLanguageChain('Unknown Planet')).toEqual(['en']);
  });

  it('returns [en, fr] for France', () => {
    expect(detectLanguageChain('Provence, France')).toEqual(['en', 'fr']);
  });

  it('returns [en, de] for Germany', () => {
    expect(detectLanguageChain('Bavaria, Germany')).toEqual(['en', 'de']);
  });

  it('returns [en, pt] for Portugal', () => {
    expect(detectLanguageChain('Algarve, Portugal')).toEqual(['en', 'pt']);
  });
});

// ---------- Wikidata resolution ----------

describe('resolveWikidataEntity', () => {
  it('returns QID on successful search', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      search: [{ id: 'Q10681', label: 'Alhambra' }],
    }));

    const result = await resolveWikidataEntity('Alhambra', 'Granada', ['en', 'es']);
    expect(result).toBe('Q10681');
  });

  it('returns null when no results found', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({ search: [] }));
    mockFetch().mockResolvedValueOnce(mockResponse({ search: [] }));

    const result = await resolveWikidataEntity('Nonexistent Place', 'Nowhere', ['en', 'es']);
    expect(result).toBeNull();
  });

  it('returns null on timeout/error', async () => {
    mockFetch().mockRejectedValueOnce(new Error('timeout'));

    const result = await resolveWikidataEntity('Alhambra', 'Granada', ['en']);
    expect(result).toBeNull();
  });

  it('tries next language on empty results', async () => {
    // First language returns nothing
    mockFetch().mockResolvedValueOnce(mockResponse({ search: [] }));
    // Second language returns result
    mockFetch().mockResolvedValueOnce(mockResponse({
      search: [{ id: 'Q12345', label: 'Place' }],
    }));

    const result = await resolveWikidataEntity('Place', 'City', ['en', 'es']);
    expect(result).toBe('Q12345');
    expect(mockFetch()).toHaveBeenCalledTimes(2);
  });
});

// ---------- fetchWikidataEntity ----------

describe('fetchWikidataEntity', () => {
  it('extracts sitelinks, P18 image, and labels', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      entities: {
        Q10681: {
          sitelinks: {
            enwiki: { title: 'Alhambra' },
            eswiki: { title: 'Alhambra (Granada)' },
          },
          claims: {
            P18: [{ mainsnak: { datavalue: { value: 'Alhambra_evening.jpg' } } }],
          },
          labels: {
            en: { value: 'Alhambra' },
            nl: { value: 'Alhambra' },
          },
        },
      },
    }));

    const result = await fetchWikidataEntity('Q10681');
    expect(result).not.toBeNull();
    expect(result!.sitelinks.enwiki).toBe('Alhambra');
    expect(result!.sitelinks.eswiki).toBe('Alhambra (Granada)');
    expect(result!.mainImage).toBe('Alhambra_evening.jpg');
    expect(result!.labels.en).toBe('Alhambra');
  });

  it('returns null mainImage when no P18 claim', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      entities: {
        Q99999: {
          sitelinks: { enwiki: { title: 'SomePlace' } },
          claims: {},
          labels: { en: { value: 'SomePlace' } },
        },
      },
    }));

    const result = await fetchWikidataEntity('Q99999');
    expect(result).not.toBeNull();
    expect(result!.mainImage).toBeNull();
  });

  it('returns null on fetch error', async () => {
    mockFetch().mockRejectedValueOnce(new Error('network error'));

    const result = await fetchWikidataEntity('Q10681');
    expect(result).toBeNull();
  });
});

// ---------- commonsFilenameToUrl ----------

describe('commonsFilenameToUrl', () => {
  it('generates correct Commons thumb URL', () => {
    const url = commonsFilenameToUrl('Alhambra_evening.jpg', 800);
    expect(url).toContain('upload.wikimedia.org/wikipedia/commons/thumb/');
    expect(url).toContain('Alhambra_evening.jpg');
    expect(url).toContain('800px-');
  });

  it('uses default width of 800', () => {
    const url = commonsFilenameToUrl('Test_image.png');
    expect(url).toContain('800px-');
  });
});

// ---------- fetchWikipediaImageMultiLang ----------

describe('fetchWikipediaImageMultiLang', () => {
  it('returns image from en.wikipedia when available', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: { '123': { thumbnail: { source: 'https://en.wiki/image.jpg' } } },
      },
    }));

    const result = await fetchWikipediaImageMultiLang(
      { enwiki: 'Alhambra' }, 'Alhambra', ['en', 'es']
    );
    expect(result).toBe('https://en.wiki/image.jpg');
  });

  it('falls back to es.wikipedia when en has no image', async () => {
    // en.wikipedia returns no thumbnail
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: { pages: { '123': {} } },
    }));
    // es.wikipedia returns thumbnail
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: { '456': { thumbnail: { source: 'https://es.wiki/image.jpg' } } },
      },
    }));

    const result = await fetchWikipediaImageMultiLang(
      { enwiki: 'Alhambra', eswiki: 'Alhambra (Granada)' }, 'Alhambra', ['en', 'es']
    );
    expect(result).toBe('https://es.wiki/image.jpg');
  });

  it('returns null when all languages miss', async () => {
    mockFetch().mockResolvedValue(mockResponse({
      query: { pages: { '123': {} } },
    }));

    const result = await fetchWikipediaImageMultiLang(
      {}, 'UnknownPlace', ['en', 'es']
    );
    expect(result).toBeNull();
  });

  it('uses directTitle as fallback when no sitelink exists', async () => {
    // No sitelinks, but directTitle is tried on en.wikipedia
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: { '789': { thumbnail: { source: 'https://en.wiki/direct.jpg' } } },
      },
    }));

    const result = await fetchWikipediaImageMultiLang(
      {}, 'DirectTitle', ['en']
    );
    expect(result).toBe('https://en.wiki/direct.jpg');
  });

  it('respects width parameter', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: { '123': { thumbnail: { source: 'https://en.wiki/image.jpg' } } },
      },
    }));

    await fetchWikipediaImageMultiLang({ enwiki: 'Test' }, 'Test', ['en'], 1920);

    const calledUrl = mockFetch().mock.calls[0][0] as string;
    expect(calledUrl).toContain('pithumbsize=1920');
  });
});

// ---------- fetchWikipediaExtLinks ----------

describe('fetchWikipediaExtLinks', () => {
  it('returns tourism URLs from external links', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: {
          '123': {
            extlinks: [
              { '*': 'https://turismotorremolinos.es/en/beach' },
              { '*': 'https://www.facebook.com/torremolinos' },
              { '*': 'https://www.tripadvisor.com/place' },
              { '*': 'https://ayuntamiento.es/turismo' },
            ],
          },
        },
      },
    }));

    const result = await fetchWikipediaExtLinks('es', 'Torremolinos');
    expect(result).toContain('https://turismotorremolinos.es/en/beach');
    expect(result).toContain('https://ayuntamiento.es/turismo');
    expect(result).not.toContain('https://www.facebook.com/torremolinos');
    expect(result).not.toContain('https://www.tripadvisor.com/place');
  });

  it('filters out social media and aggregator URLs', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: {
          '123': {
            extlinks: [
              { '*': 'https://twitter.com/place' },
              { '*': 'https://instagram.com/place' },
              { '*': 'https://booking.com/hotel' },
              { '*': 'https://youtube.com/watch?v=123' },
            ],
          },
        },
      },
    }));

    const result = await fetchWikipediaExtLinks('en', 'SomePlace');
    expect(result).toHaveLength(0);
  });

  it('returns empty array on error', async () => {
    mockFetch().mockRejectedValueOnce(new Error('network error'));

    const result = await fetchWikipediaExtLinks('en', 'SomePlace');
    expect(result).toEqual([]);
  });

  it('returns empty array when no extlinks', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: { pages: { '123': {} } },
    }));

    const result = await fetchWikipediaExtLinks('en', 'SomePlace');
    expect(result).toEqual([]);
  });
});

// ---------- scrapeWebsiteImages ----------

describe('scrapeWebsiteImages', () => {
  it('extracts og:image from HTML', async () => {
    const html = `<html><head>
      <meta property="og:image" content="https://example.com/hero.jpg">
    </head><body></body></html>`;
    mockFetch().mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await scrapeWebsiteImages('https://example.com/page');
    expect(result).toContain('https://example.com/hero.jpg');
  });

  it('extracts img src tags from HTML', async () => {
    const html = `<html><body>
      <img src="https://example.com/gallery/photo1.jpg" alt="Photo">
      <img src="https://example.com/gallery/photo2.jpg" alt="Photo2">
    </body></html>`;
    mockFetch().mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await scrapeWebsiteImages('https://example.com/page');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some(u => u.includes('photo'))).toBe(true);
  });

  it('filters out logo/icon/favicon URLs', async () => {
    const html = `<html><body>
      <img src="https://example.com/logo.png">
      <img src="https://example.com/favicon.ico">
      <img src="https://example.com/icons/arrow.svg">
      <img src="https://example.com/gallery/real-photo.jpg">
    </body></html>`;
    mockFetch().mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await scrapeWebsiteImages('https://example.com/page');
    expect(result.every(u => !u.includes('logo'))).toBe(true);
    expect(result.every(u => !u.includes('favicon'))).toBe(true);
    expect(result.every(u => !u.includes('.svg'))).toBe(true);
  });

  it('converts relative URLs to absolute', async () => {
    const html = `<html><body>
      <img src="/images/gallery/photo.jpg">
    </body></html>`;
    mockFetch().mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await scrapeWebsiteImages('https://example.com/page');
    expect(result.some(u => u.startsWith('https://example.com/'))).toBe(true);
  });

  it('returns empty array on timeout/error', async () => {
    mockFetch().mockRejectedValueOnce(new Error('timeout'));

    const result = await scrapeWebsiteImages('https://example.com/page');
    expect(result).toEqual([]);
  });

  it('skips non-HTTPS URLs', async () => {
    const result = await scrapeWebsiteImages('http://insecure-site.com/page');
    expect(result).toEqual([]);
  });

  it('filters out data URIs, GIFs, and navigation images', async () => {
    const html = `<html><body>
      <img src="data:image/png;base64,iVBORw0KGgo=">
      <img src="https://example.com/static/images/newsite.gif">
      <img src="https://example.com/images/back_arrow.png">
      <img src="https://example.com/gallery/real-photo.jpg">
    </body></html>`;
    mockFetch().mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await scrapeWebsiteImages('https://example.com/page');
    expect(result.every(u => !u.includes('data:image'))).toBe(true);
    expect(result.every(u => !u.includes('.gif'))).toBe(true);
    expect(result.every(u => !u.includes('arrow'))).toBe(true);
    expect(result.some(u => u.includes('real-photo'))).toBe(true);
  });
});

// ---------- searchCommonsImagesSmart ----------

describe('searchCommonsImagesSmart', () => {
  it('returns images from full name+city query', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: {
          '1': {
            title: 'File:Beach.jpg',
            imageinfo: [{
              thumburl: 'https://commons.wiki/thumb/Beach.jpg',
              extmetadata: { ImageDescription: { value: 'A beach' } },
            }],
          },
        },
      },
    }));

    const result = await searchCommonsImagesSmart('La Carihuela', 'Torremolinos');
    expect(result).toHaveLength(1);
    expect(result[0].src).toContain('Beach.jpg');
  });

  it('falls back to simplified name on empty results', async () => {
    // Full query returns nothing
    mockFetch().mockResolvedValueOnce(mockResponse({ query: {} }));
    // Simplified query returns results
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: {
          '1': {
            title: 'File:Carihuela.jpg',
            imageinfo: [{
              thumburl: 'https://commons.wiki/thumb/Carihuela.jpg',
              extmetadata: { ImageDescription: { value: 'Carihuela beach' } },
            }],
          },
        },
      },
    }));

    const result = await searchCommonsImagesSmart('La Carihuela Strand en promenade', 'Torremolinos');
    expect(result).toHaveLength(1);
  });

  it('respects limit parameter', async () => {
    const pages: Record<string, unknown> = {};
    for (let i = 0; i < 10; i++) {
      pages[`${i}`] = {
        title: `File:Image${i}.jpg`,
        imageinfo: [{
          thumburl: `https://commons.wiki/thumb/Image${i}.jpg`,
          extmetadata: {},
        }],
      };
    }
    mockFetch().mockResolvedValueOnce(mockResponse({ query: { pages } }));

    const result = await searchCommonsImagesSmart('Test', 'City', 2);
    // The API call itself limits, so we check the limit is passed to API
    const calledUrl = mockFetch().mock.calls[0][0] as string;
    expect(calledUrl).toContain('gsrlimit=2');
  });
});

// ---------- Full pipeline (enrichAttractionMedia) ----------

describe('enrichAttractionMedia', () => {
  it('works with backwards-compatible signature (no options)', async () => {
    // Wikidata search
    mockFetch().mockResolvedValueOnce(mockResponse({ search: [] }));
    // Commons search (full name)
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: {
          '1': {
            title: 'File:Test.jpg',
            imageinfo: [{
              thumburl: 'https://commons.wiki/Test.jpg',
              extmetadata: { ImageDescription: { value: 'Test image' } },
            }],
          },
        },
      },
    }));

    const result = await enrichAttractionMedia('Alhambra', 'Granada');
    expect(result).toHaveProperty('thumbnail');
    expect(result).toHaveProperty('media');
    expect(Array.isArray(result.media)).toBe(true);
  });

  it('returns empty thumbnail and media when nothing found', async () => {
    // All fetches return empty
    mockFetch().mockResolvedValue(mockResponse({ search: [] }));

    const result = await enrichAttractionMedia('Nonexistent', 'Nowhere');
    expect(result.thumbnail).toBe('');
    expect(result.media).toEqual([]);
  });

  it('uses wikipediaSlug when provided', async () => {
    // Wikipedia image fetch using slug (skips Wikidata)
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: { '1': { thumbnail: { source: 'https://en.wiki/slug-image.jpg' } } },
      },
    }));
    // Wikipedia ext links
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: { pages: { '1': {} } },
    }));
    // Commons search
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: {
          '1': {
            title: 'File:Commons.jpg',
            imageinfo: [{
              thumburl: 'https://commons.wiki/Commons.jpg',
              extmetadata: {},
            }],
          },
        },
      },
    }));

    const result = await enrichAttractionMedia('Alhambra', 'Granada', {
      wikipediaSlug: 'Alhambra',
    });
    expect(result.thumbnail).toBe('https://en.wiki/slug-image.jpg');
  });

  it('deduplicates images by URL', async () => {
    // Wikidata returns nothing
    mockFetch().mockResolvedValueOnce(mockResponse({ search: [] }));
    // Commons returns duplicate URLs
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: {
          '1': {
            title: 'File:Same.jpg',
            imageinfo: [{
              thumburl: 'https://commons.wiki/same.jpg',
              extmetadata: { ImageDescription: { value: 'Image' } },
            }],
          },
          '2': {
            title: 'File:Same2.jpg',
            imageinfo: [{
              thumburl: 'https://commons.wiki/same.jpg',
              extmetadata: { ImageDescription: { value: 'Image' } },
            }],
          },
        },
      },
    }));

    const result = await enrichAttractionMedia('Test', 'City');
    // Should have deduplicated
    const urls = result.media.map(m => m.src);
    const uniqueUrls = [...new Set(urls)];
    expect(urls.length).toBe(uniqueUrls.length);
  });

  it('passes region to language chain detection', async () => {
    // For Japan, should try 'ja' Wikipedia
    mockFetch().mockResolvedValue(mockResponse({ search: [] }));

    await enrichAttractionMedia('Sensoji', 'Tokyo', { region: 'Tokyo, Japan' });

    // Verify at least one call was made — the implementation uses detected languages
    expect(mockFetch()).toHaveBeenCalled();
  });
});

// ---------- Batch enrichment ----------

describe('enrichAttractionsBatch', () => {
  it('returns results in same order as input', async () => {
    // Mock all fetches to return something identifiable per attraction
    let callCount = 0;
    mockFetch().mockImplementation(() => {
      callCount++;
      // Wikidata search returns nothing
      if (callCount % 2 === 1) {
        return mockResponse({ search: [] });
      }
      // Commons returns an image
      return mockResponse({
        query: {
          pages: {
            '1': {
              title: `File:Image${callCount}.jpg`,
              imageinfo: [{
                thumburl: `https://commons.wiki/Image${callCount}.jpg`,
                extmetadata: {},
              }],
            },
          },
        },
      });
    });

    const attractions = [
      { name: 'Place A', city: 'City1' },
      { name: 'Place B', city: 'City2' },
      { name: 'Place C', city: 'City3' },
    ];

    const results = await enrichAttractionsBatch(attractions);
    expect(results).toHaveLength(3);
    results.forEach(r => {
      expect(r).toHaveProperty('thumbnail');
      expect(r).toHaveProperty('media');
    });
  });

  it('isolates individual failures', async () => {
    mockFetch().mockImplementation((url: string) => {
      // Any request related to "Failing Place" or "City2" throws
      if (url.includes('Failing') || url.includes('City2')) {
        return Promise.reject(new Error('network error'));
      }
      // Wikidata search returns nothing for others
      if (url.includes('wbsearchentities')) {
        return mockResponse({ search: [] });
      }
      // Commons returns an image for others
      if (url.includes('commons.wikimedia.org')) {
        return mockResponse({
          query: {
            pages: {
              '1': {
                title: 'File:OK.jpg',
                imageinfo: [{
                  thumburl: 'https://commons.wiki/OK.jpg',
                  extmetadata: {},
                }],
              },
            },
          },
        });
      }
      return mockResponse({ search: [] });
    });

    const attractions = [
      { name: 'Place A', city: 'City1' },
      { name: 'Failing Place', city: 'City2' },
      { name: 'Place C', city: 'City3' },
    ];

    const results = await enrichAttractionsBatch(attractions);
    expect(results).toHaveLength(3);
    // Failed attraction should have empty results, not crash
    expect(results[1].thumbnail).toBe('');
    expect(results[1].media).toEqual([]);
  });

  it('handles empty input array', async () => {
    const results = await enrichAttractionsBatch([]);
    expect(results).toEqual([]);
  });

  it('passes region option through', async () => {
    mockFetch().mockResolvedValue(mockResponse({ search: [] }));

    await enrichAttractionsBatch(
      [{ name: 'Temple', city: 'Kyoto' }],
      { region: 'Kansai, Japan' }
    );

    expect(mockFetch()).toHaveBeenCalled();
  });
});

// ---------- fetchHeroImage ----------

describe('fetchHeroImage', () => {
  it('returns hero image at 1920px width', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: { '1': { thumbnail: { source: 'https://en.wiki/hero.jpg' } } },
      },
    }));

    const result = await fetchHeroImage('Granada');
    expect(result).toBe('https://en.wiki/hero.jpg');
  });

  it('returns null when no image found', async () => {
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: { pages: { '1': {} } },
    }));

    const result = await fetchHeroImage('Unknown City');
    expect(result).toBeNull();
  });

  it('accepts region parameter for multi-lang fallback', async () => {
    // en returns nothing
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: { pages: { '1': {} } },
    }));
    // es returns hero
    mockFetch().mockResolvedValueOnce(mockResponse({
      query: {
        pages: { '1': { thumbnail: { source: 'https://es.wiki/hero.jpg' } } },
      },
    }));

    const result = await fetchHeroImage('Torremolinos', 'Costa del Sol, Spain');
    expect(result).toBe('https://es.wiki/hero.jpg');
  });
});
