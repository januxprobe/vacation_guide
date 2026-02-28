import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createMockTripDataRepo,
  makeParams,
  MOCK_COMMENT,
} from './helpers';

const mockTripDataRepo = createMockTripDataRepo();
vi.mock('@/lib/repositories', () => ({
  getTripRepository: () => ({}),
  getTripDataRepository: () => mockTripDataRepo,
}));

const { GET, POST, DELETE } = await import('@/app/api/trips/[slug]/comments/route');

function makeNextRequest(url: string, body?: unknown, method = 'GET'): NextRequest {
  if (body !== undefined) {
    return new NextRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  return new NextRequest(url, { method });
}

describe('GET /api/trips/[slug]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns comments (200)', async () => {
    vi.mocked(mockTripDataRepo.getComments).mockResolvedValueOnce([MOCK_COMMENT]);

    const req = makeNextRequest('http://localhost/api/trips/test-trip/comments');
    const res = await GET(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.comments).toHaveLength(1);
    expect(body.comments[0].author).toBe('Alice');
  });

  it('returns empty array on error (graceful fallback)', async () => {
    vi.mocked(mockTripDataRepo.getComments).mockRejectedValueOnce(new Error('disk'));

    const req = makeNextRequest('http://localhost/api/trips/test-trip/comments');
    const res = await GET(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.comments).toEqual([]);
  });
});

describe('POST /api/trips/[slug]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a valid comment (200)', async () => {
    const req = makeNextRequest(
      'http://localhost/api/trips/test-trip/comments',
      MOCK_COMMENT,
      'POST',
    );
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockTripDataRepo.addComment).toHaveBeenCalledOnce();
  });

  it('returns 400 for invalid data', async () => {
    const req = makeNextRequest(
      'http://localhost/api/trips/test-trip/comments',
      { id: 'c1', author: '', text: 'hi', timestamp: 123, dayNumber: 1 },
      'POST',
    );
    const res = await POST(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid');
  });

  it('returns 400 when missing required fields', async () => {
    const req = makeNextRequest(
      'http://localhost/api/trips/test-trip/comments',
      { id: 'c1' },
      'POST',
    );
    const res = await POST(req, makeParams('test-trip'));

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/trips/[slug]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes a comment (200)', async () => {
    vi.mocked(mockTripDataRepo.deleteComment).mockResolvedValueOnce(true);

    const req = makeNextRequest(
      'http://localhost/api/trips/test-trip/comments',
      { id: 'test-comment-1' },
      'DELETE',
    );
    const res = await DELETE(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 400 when ID is missing', async () => {
    const req = makeNextRequest(
      'http://localhost/api/trips/test-trip/comments',
      {},
      'DELETE',
    );
    const res = await DELETE(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Missing');
  });

  it('returns 404 when comment not found', async () => {
    vi.mocked(mockTripDataRepo.deleteComment).mockResolvedValueOnce(false);

    const req = makeNextRequest(
      'http://localhost/api/trips/test-trip/comments',
      { id: 'nonexistent' },
      'DELETE',
    );
    const res = await DELETE(req, makeParams('test-trip'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });
});
