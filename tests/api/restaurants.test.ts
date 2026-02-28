import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockTripRepo,
  createMockTripDataRepo,
  makeJsonRequest,
  makeParams,
  MOCK_TRIP_CONFIG,
  MOCK_RESTAURANT,
} from './helpers';

const mockTripRepo = createMockTripRepo();
const mockTripDataRepo = createMockTripDataRepo();
vi.mock('@/lib/repositories', () => ({
  getTripRepository: () => mockTripRepo,
  getTripDataRepository: () => mockTripDataRepo,
}));

const { POST, PUT, DELETE } = await import('@/app/api/trips/[slug]/restaurants/route');

describe('POST /api/trips/[slug]/restaurants (batch save)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a batch of restaurants (201)', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/restaurants', {
      restaurants: [MOCK_RESTAURANT],
    });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.count).toBe(1);
    expect(mockTripDataRepo.saveRestaurants).toHaveBeenCalledOnce();
  });

  it('returns 404 when trip not found', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const req = makeJsonRequest('http://localhost/api/trips/nope/restaurants', {
      restaurants: [MOCK_RESTAURANT],
    });
    const res = await POST(req, makeParams('nope'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns 400 for invalid data', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/restaurants', {
      restaurants: [{ id: 'x' }],
    });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid');
  });

  it('returns 500 on repo error', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.saveRestaurants).mockRejectedValueOnce(new Error('disk'));

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/restaurants', {
      restaurants: [MOCK_RESTAURANT],
    });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});

describe('PUT /api/trips/[slug]/restaurants (add single)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a restaurant (201)', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/restaurants', MOCK_RESTAURANT, 'PUT');
    const res = await PUT(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.id).toBe('test-restaurant');
    expect(mockTripDataRepo.addRestaurant).toHaveBeenCalledOnce();
  });

  it('blocks protected trip (403)', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(true);

    const req = makeJsonRequest('http://localhost/api/trips/andalusia-2026/restaurants', MOCK_RESTAURANT, 'PUT');
    const res = await PUT(req, makeParams('andalusia-2026'));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('built-in');
  });

  it('returns 404 when trip not found', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const req = makeJsonRequest('http://localhost/api/trips/nope/restaurants', MOCK_RESTAURANT, 'PUT');
    const res = await PUT(req, makeParams('nope'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns 400 for invalid data', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/restaurants', { id: 'x' }, 'PUT');
    const res = await PUT(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid');
  });

  it('returns 409 for duplicate restaurant', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.addRestaurant).mockRejectedValueOnce(
      new Error('Restaurant already exists'),
    );

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/restaurants', MOCK_RESTAURANT, 'PUT');
    const res = await PUT(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain('already exists');
  });
});

describe('DELETE /api/trips/[slug]/restaurants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes a restaurant (200)', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.removeRestaurant).mockResolvedValueOnce(true);

    const req = makeJsonRequest(
      'http://localhost/api/trips/test-trip/restaurants',
      { id: 'test-restaurant' },
      'DELETE',
    );
    const res = await DELETE(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('blocks protected trip (403)', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(true);

    const req = makeJsonRequest(
      'http://localhost/api/trips/andalusia-2026/restaurants',
      { id: 'r1' },
      'DELETE',
    );
    const res = await DELETE(req, makeParams('andalusia-2026'));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('built-in');
  });

  it('returns 400 when ID is missing', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest(
      'http://localhost/api/trips/test-trip/restaurants',
      {},
      'DELETE',
    );
    const res = await DELETE(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('returns 404 when restaurant not found', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.removeRestaurant).mockResolvedValueOnce(false);

    const req = makeJsonRequest(
      'http://localhost/api/trips/test-trip/restaurants',
      { id: 'nonexistent' },
      'DELETE',
    );
    const res = await DELETE(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });
});
