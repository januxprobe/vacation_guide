import type { MediaItem } from '@/types';

/**
 * Fetch the main image from a Wikipedia article.
 * Uses the PageImages API to get the primary thumbnail.
 */
async function fetchWikipediaImage(
  title: string,
  width: number = 800
): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=${width}&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as Record<string, unknown>;
    const thumb = page?.thumbnail as { source?: string } | undefined;
    return thumb?.source ?? null;
  } catch {
    return null;
  }
}

/**
 * Search Wikimedia Commons for images matching a query.
 * Returns thumbnail URLs at the specified width.
 */
async function searchCommonsImages(
  query: string,
  limit: number = 4
): Promise<MediaItem[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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
        // Extract description from metadata if available
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

/**
 * Enrich an attraction with real images from Wikipedia and Wikimedia Commons.
 * Returns a thumbnail URL and an array of MediaItems.
 */
export async function enrichAttractionMedia(
  attractionName: string,
  city: string
): Promise<{ thumbnail: string; media: MediaItem[] }> {
  const [wikiImage, commonsImages] = await Promise.all([
    fetchWikipediaImage(attractionName),
    searchCommonsImages(`${attractionName} ${city}`, 4),
  ]);

  const thumbnail = wikiImage || commonsImages[0]?.src || '';
  return { thumbnail, media: commonsImages };
}

/**
 * Fetch a hero image for a destination city from Wikipedia.
 * Uses higher resolution (1920px) for the full-width banner.
 */
export async function fetchHeroImage(cityName: string): Promise<string | null> {
  return fetchWikipediaImage(cityName, 1920);
}
