import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { makeJsonRequest } from './helpers';

// Mock the Gemini API — capture the systemInstruction passed
let capturedSystemInstruction: string | undefined;

async function* fakeStream() {
  yield { text: 'Hello!' };
}

const mockGenerateContentStream = vi.fn().mockImplementation((opts: Record<string, unknown>) => {
  const config = opts.config as { systemInstruction?: string } | undefined;
  capturedSystemInstruction = config?.systemInstruction;
  return fakeStream();
});

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = { generateContentStream: mockGenerateContentStream };
  }
  return { GoogleGenAI: MockGoogleGenAI };
});

const { POST } = await import('@/app/api/ai/chat/route');

describe('POST /api/ai/chat', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedSystemInstruction = undefined;
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 400 when messages array is missing', async () => {
    const req = makeJsonRequest('http://localhost/api/ai/chat', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const req = makeJsonRequest('http://localhost/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hi' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('uses Dutch system prompt when locale is nl', async () => {
    const req = makeJsonRequest('http://localhost/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hallo' }],
      locale: 'nl',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(capturedSystemInstruction).toBeDefined();
    expect(capturedSystemInstruction).toContain('Dutch');
    // Attraction description/tips should be plain strings, not bilingual objects
    expect(capturedSystemInstruction).toContain('plain string');
    expect(capturedSystemInstruction).toContain('Nederlandse beschrijving');
  });

  it('uses English system prompt when locale is en', async () => {
    const req = makeJsonRequest('http://localhost/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hello' }],
      locale: 'en',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(capturedSystemInstruction).toBeDefined();
    expect(capturedSystemInstruction).toContain('English');
    // Attraction description/tips should be plain strings, not bilingual objects
    expect(capturedSystemInstruction).toContain('plain string');
    expect(capturedSystemInstruction).toContain('English description');
  });

  it('defaults to nl when locale is not provided', async () => {
    const req = makeJsonRequest('http://localhost/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hi' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(capturedSystemInstruction).toBeDefined();
    expect(capturedSystemInstruction).toContain('Dutch');
  });

  it('streams SSE response with data events', async () => {
    const req = makeJsonRequest('http://localhost/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hi' }],
      locale: 'en',
    });
    const res = await POST(req);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const text = await res.text();
    expect(text).toContain('data: ');
    expect(text).toContain('Hello!');
    expect(text).toContain('[DONE]');
  });

  it('attraction suggestion example uses plain string description (not bilingual object)', async () => {
    const req = makeJsonRequest('http://localhost/api/ai/chat', {
      messages: [{ role: 'user', content: 'Hi' }],
      locale: 'en',
    });
    await POST(req);

    // The system prompt should show description as a plain string, not { "nl": "...", "en": "..." }
    expect(capturedSystemInstruction).toContain('"description":');
    // Should NOT contain the bilingual object pattern in the attraction example
    expect(capturedSystemInstruction).toContain('plain string');
  });
});
