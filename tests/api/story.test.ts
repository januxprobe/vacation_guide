import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import {
  createMockTripRepo,
  createMockTripDataRepo,
  makeJsonRequest,
  makeParams,
  MOCK_TRIP_CONFIG,
  MOCK_TRIP_STORY,
  MOCK_ITINERARY,
  MOCK_ATTRACTION,
} from './helpers';

const mockTripRepo = createMockTripRepo();
const mockTripDataRepo = createMockTripDataRepo();
vi.mock('@/lib/repositories', () => ({
  getTripRepository: () => mockTripRepo,
  getTripDataRepository: () => mockTripDataRepo,
}));

// Mock the Gemini API
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

const { GET, POST } = await import('@/app/api/trips/[slug]/story/route');

describe('GET /api/trips/[slug]/story', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing story (200)', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.getStory).mockResolvedValueOnce(MOCK_TRIP_STORY);

    const req = new Request('http://localhost/api/trips/test-trip/story');
    const res = await GET(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.story.style).toBe('adventure');
    expect(body.story.chapters).toHaveLength(1);
  });

  it('returns 404 when no story exists', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.getStory).mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/trips/test-trip/story');
    const res = await GET(req, makeParams('test-trip'));

    expect(res.status).toBe(404);
  });

  it('returns 404 when trip not found', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const req = new Request('http://localhost/api/trips/nope/story');
    const res = await GET(req, makeParams('nope'));

    expect(res.status).toBe(404);
  });
});

describe('POST /api/trips/[slug]/story', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('generates and saves a story (201)', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.getItinerary).mockResolvedValueOnce(MOCK_ITINERARY);
    vi.mocked(mockTripDataRepo.getAllAttractions).mockResolvedValueOnce([MOCK_ATTRACTION]);
    vi.mocked(mockTripDataRepo.getRestaurants).mockResolvedValueOnce([]);
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(MOCK_TRIP_STORY),
    });

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/story', { style: 'adventure' });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.story.style).toBe('adventure');
    expect(mockTripDataRepo.saveStory).toHaveBeenCalledOnce();
  });

  it('returns 404 when trip not found', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const req = makeJsonRequest('http://localhost/api/trips/nope/story', { style: 'adventure' });
    const res = await POST(req, makeParams('nope'));

    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid style', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/story', { style: 'thriller' });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('style');
  });

  it('returns 400 when itinerary is missing', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.getItinerary).mockResolvedValueOnce(null);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/story', { style: 'adventure' });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('itinerary');
  });

  it('returns 500 when GEMINI_API_KEY not configured', async () => {
    delete process.env.GEMINI_API_KEY;
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.getItinerary).mockResolvedValueOnce(MOCK_ITINERARY);
    vi.mocked(mockTripDataRepo.getAllAttractions).mockResolvedValueOnce([MOCK_ATTRACTION]);
    vi.mocked(mockTripDataRepo.getRestaurants).mockResolvedValueOnce([]);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/story', { style: 'adventure' });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('GEMINI_API_KEY');
  });

  it('returns 500 on Gemini error', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.getItinerary).mockResolvedValueOnce(MOCK_ITINERARY);
    vi.mocked(mockTripDataRepo.getAllAttractions).mockResolvedValueOnce([MOCK_ATTRACTION]);
    vi.mocked(mockTripDataRepo.getRestaurants).mockResolvedValueOnce([]);
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini down'));

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/story', { style: 'adventure' });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });

  it('normalizes AI output before validation', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.getItinerary).mockResolvedValueOnce(MOCK_ITINERARY);
    vi.mocked(mockTripDataRepo.getAllAttractions).mockResolvedValueOnce([MOCK_ATTRACTION]);
    vi.mocked(mockTripDataRepo.getRestaurants).mockResolvedValueOnce([]);

    // Gemini returns with capitalized style and plain string title
    const aiResponse = {
      ...MOCK_TRIP_STORY,
      style: 'Adventure',
      title: 'My Trip Story',
      introduction: 'Welcome',
      conclusion: 'Goodbye',
      chapters: [
        {
          dayNumber: '1',
          city: 'testcity',
          title: 'Day 1',
          blocks: [{ type: 'Narrative', content: 'It started...' }],
        },
      ],
    };
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(aiResponse),
    });

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/story', { style: 'adventure' });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.story.style).toBe('adventure');
    expect(body.story.title).toEqual({ nl: 'My Trip Story', en: 'My Trip Story' });
    expect(body.story.chapters[0].dayNumber).toBe(1);
    expect(body.story.chapters[0].blocks[0].type).toBe('narrative');
  });
});
