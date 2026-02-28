import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockTripRepo,
  makeJsonRequest,
  MOCK_TRIP_CONFIG,
} from './helpers';

// Mock the repository factory
const mockTripRepo = createMockTripRepo();
vi.mock('@/lib/repositories', () => ({
  getTripRepository: () => mockTripRepo,
  getTripDataRepository: () => ({}),
}));

// Import route handlers AFTER mock is in place
const { GET, POST } = await import('@/app/api/trips/route');

describe('GET /api/trips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all trips (200)', async () => {
    vi.mocked(mockTripRepo.getAll).mockResolvedValueOnce([MOCK_TRIP_CONFIG]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].slug).toBe('test-trip');
  });

  it('returns empty array when no trips exist', async () => {
    vi.mocked(mockTripRepo.getAll).mockResolvedValueOnce([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('returns 500 on repo error', async () => {
    vi.mocked(mockTripRepo.getAll).mockRejectedValueOnce(new Error('disk error'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});

describe('POST /api/trips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a valid trip (201)', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const req = makeJsonRequest('http://localhost/api/trips', MOCK_TRIP_CONFIG);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.slug).toBe('test-trip');
    expect(mockTripRepo.create).toHaveBeenCalledOnce();
  });

  it('fills defaults for missing fields', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const minimal = {
      ...MOCK_TRIP_CONFIG,
      categories: undefined,
      highlights: undefined,
      travelerGroups: undefined,
      dataDirectory: undefined,
      id: undefined,
    };
    const req = makeJsonRequest('http://localhost/api/trips', minimal);
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockTripRepo.create).toHaveBeenCalledOnce();
  });

  it('rejects invalid data (400)', async () => {
    const req = makeJsonRequest('http://localhost/api/trips', { slug: 'x' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid');
  });

  it('detects duplicate slug (409)', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips', MOCK_TRIP_CONFIG);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain('already exists');
  });
});
