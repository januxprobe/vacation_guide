import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockTripRepo,
  createMockTripDataRepo,
  makeJsonRequest,
  makeParams,
  MOCK_TRIP_CONFIG,
  MOCK_ITINERARY,
} from './helpers';

const mockTripRepo = createMockTripRepo();
const mockTripDataRepo = createMockTripDataRepo();
vi.mock('@/lib/repositories', () => ({
  getTripRepository: () => mockTripRepo,
  getTripDataRepository: () => mockTripDataRepo,
}));

const { POST } = await import('@/app/api/trips/[slug]/itinerary/route');

describe('POST /api/trips/[slug]/itinerary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a valid itinerary (201)', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/itinerary', MOCK_ITINERARY);
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(mockTripDataRepo.saveItinerary).toHaveBeenCalledOnce();
  });

  it('returns 404 when trip not found', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(undefined);

    const req = makeJsonRequest('http://localhost/api/trips/nope/itinerary', MOCK_ITINERARY);
    const res = await POST(req, makeParams('nope'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns 400 for invalid data', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/itinerary', { trip: {} });
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid');
  });

  it('normalizes AM/PM times before validation', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const itineraryWithAmPm = {
      ...MOCK_ITINERARY,
      days: [
        {
          ...MOCK_ITINERARY.days[0],
          activities: [
            { time: '9:00 AM', attractionId: 'test-attraction', duration: 90 },
          ],
          meals: [
            { type: 'lunch', time: '1:00 PM', estimatedCost: 15 },
          ],
        },
      ],
    };

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/itinerary', itineraryWithAmPm);
    const res = await POST(req, makeParams('test-trip'));

    expect(res.status).toBe(201);
    const savedItinerary = vi.mocked(mockTripDataRepo.saveItinerary).mock.calls[0][1];
    expect(savedItinerary.days[0].activities[0].time).toBe('09:00');
    expect(savedItinerary.days[0].meals[0].time).toBe('13:00');
  });

  it('normalizes capitalized transport methods', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);

    const itineraryWithTransport = {
      ...MOCK_ITINERARY,
      days: [
        {
          ...MOCK_ITINERARY.days[0],
          activities: [
            {
              time: '09:00',
              attractionId: 'test-attraction',
              duration: 90,
              transport: { method: 'Walking', duration: 15 },
            },
          ],
        },
      ],
    };

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/itinerary', itineraryWithTransport);
    const res = await POST(req, makeParams('test-trip'));

    expect(res.status).toBe(201);
    const saved = vi.mocked(mockTripDataRepo.saveItinerary).mock.calls[0][1];
    expect(saved.days[0].activities[0].transport?.method).toBe('walk');
  });

  it('returns 500 on repo error', async () => {
    vi.mocked(mockTripRepo.getBySlug).mockResolvedValueOnce(MOCK_TRIP_CONFIG);
    vi.mocked(mockTripDataRepo.saveItinerary).mockRejectedValueOnce(new Error('disk'));

    const req = makeJsonRequest('http://localhost/api/trips/test-trip/itinerary', MOCK_ITINERARY);
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeDefined();
  });
});
