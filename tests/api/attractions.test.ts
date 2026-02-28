import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockTripRepo,
  createMockTripDataRepo,
  makeJsonRequest,
  makeParams,
  MOCK_TRIP_CONFIG,
  MOCK_ATTRACTION,
} from './helpers';

const mockTripRepo = createMockTripRepo();
const mockTripDataRepo = createMockTripDataRepo();
vi.mock('@/lib/repositories', () => ({
  getTripRepository: () => mockTripRepo,
  getTripDataRepository: () => mockTripDataRepo,
}));

const { POST } = await import('@/app/api/trips/[slug]/attractions/route');

describe('POST /api/trips/[slug]/attractions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a valid attraction (201)', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/attractions', MOCK_ATTRACTION);
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.id).toBe('test-attraction');
    expect(mockTripDataRepo.addAttraction).toHaveBeenCalledOnce();
  });

  it('returns 404 when trip not found', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const req = makeJsonRequest('http://localhost/api/trips/nope/attractions', MOCK_ATTRACTION);
    const res = await POST(req, makeParams('nope'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns 400 for invalid data', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/attractions', { id: 'x' });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid');
  });

  it('normalizes "square" category to "monument"', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/attractions', {
      ...MOCK_ATTRACTION,
      category: 'square',
    });
    const res = await POST(req, makeParams('test-trip'));

    expect(res.status).toBe(201);
    const savedAttraction = vi.mocked(mockTripDataRepo.addAttraction).mock.calls[0][1];
    expect(savedAttraction.category).toBe('monument');
  });

  it('normalizes "cathedral" category to "church"', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/attractions', {
      ...MOCK_ATTRACTION,
      category: 'cathedral',
    });
    const res = await POST(req, makeParams('test-trip'));

    expect(res.status).toBe(201);
    const savedAttraction = vi.mocked(mockTripDataRepo.addAttraction).mock.calls[0][1];
    expect(savedAttraction.category).toBe('church');
  });

  it('normalizes "important" priority to "essential"', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/attractions', {
      ...MOCK_ATTRACTION,
      priority: 'important',
    });
    const res = await POST(req, makeParams('test-trip'));

    expect(res.status).toBe(201);
    const savedAttraction = vi.mocked(mockTripDataRepo.addAttraction).mock.calls[0][1];
    expect(savedAttraction.priority).toBe('essential');
  });

  it('fills defaults for images, thumbnail, bookingRequired', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const { images, thumbnail, bookingRequired, ...withoutDefaults } = MOCK_ATTRACTION;
    const req = makeJsonRequest('http://localhost/api/trips/test-trip/attractions', withoutDefaults);
    const res = await POST(req, makeParams('test-trip'));

    expect(res.status).toBe(201);
    const savedAttraction = vi.mocked(mockTripDataRepo.addAttraction).mock.calls[0][1];
    expect(savedAttraction.images).toEqual([]);
    expect(savedAttraction.bookingRequired).toBe(false);
  });

  it('returns 500 on repo error', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.addAttraction).mockRejectedValueOnce(new Error('disk'));

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/attractions', MOCK_ATTRACTION);
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});
