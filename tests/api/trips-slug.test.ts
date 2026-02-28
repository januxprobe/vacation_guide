import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockTripRepo,
  makeParams,
  MOCK_TRIP_CONFIG,
} from './helpers';

const mockTripRepo = createMockTripRepo();
vi.mock('@/lib/repositories', () => ({
  getTripRepository: () => mockTripRepo,
  getTripDataRepository: () => ({}),
}));

const { GET, DELETE } = await import('@/app/api/trips/[slug]/route');

describe('GET /api/trips/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns trip when found (200)', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const res = await GET(
      new Request('http://localhost/api/trips/test-trip'),
      makeParams('test-trip'),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.slug).toBe('test-trip');
  });

  it('returns 404 when not found', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const res = await GET(
      new Request('http://localhost/api/trips/nope'),
      makeParams('nope'),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });
});

describe('DELETE /api/trips/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a dynamic trip (200)', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const res = await DELETE(
      new Request('http://localhost/api/trips/test-trip', { method: 'DELETE' }),
      makeParams('test-trip'),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockTripRepo.delete).toHaveBeenCalledWith('test-trip');
  });

  it('blocks protected trip (403)', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(true);

    const res = await DELETE(
      new Request('http://localhost/api/trips/andalusia-2026', { method: 'DELETE' }),
      makeParams('andalusia-2026'),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('built-in');
  });

  it('returns 404 for nonexistent trip', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const res = await DELETE(
      new Request('http://localhost/api/trips/nope', { method: 'DELETE' }),
      makeParams('nope'),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns 500 on repo error', async () => {
    vi.mocked(mockTripRepo.isProtected).mockResolvedValueOnce(false);
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripRepo.delete).mockRejectedValueOnce(new Error('disk error'));

    const res = await DELETE(
      new Request('http://localhost/api/trips/test-trip', { method: 'DELETE' }),
      makeParams('test-trip'),
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});
