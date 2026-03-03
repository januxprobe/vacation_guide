'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TripPreview from './TripPreview';
import CreateTripButton from './CreateTripButton';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface TripReadiness {
  destination: boolean;
  dates: boolean;
  travelers: boolean;
  cities: boolean;
  attractions: number;
}

export default function TripChat() {
  const t = useTranslations('tripCreator');
  const locale = useLocale();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('initialMessage'),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [tripData, setTripData] = useState<Record<string, unknown> | null>(null);
  const [acceptedAttractions, setAcceptedAttractions] = useState<Record<string, unknown>[]>([]);
  const [readiness, setReadiness] = useState<TripReadiness>({
    destination: false,
    dates: false,
    travelers: false,
    cities: false,
    attractions: 0,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract trip_config and trip_ready from messages
  useEffect(() => {
    let latestReadiness: TripReadiness | null = null;

    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      const configMatch = msg.content.match(/```json\s*\n([\s\S]*?)```/g);
      if (!configMatch) continue;
      for (const block of configMatch) {
        try {
          const json = block.replace(/```json\s*\n/, '').replace(/```$/, '');
          const data = JSON.parse(json);
          if (data.type === 'trip_config' && data.data) {
            setTripData(data.data);
          }
          if (data.type === 'trip_ready' && data.data) {
            latestReadiness = {
              destination: !!data.data.destination,
              dates: !!data.data.dates,
              travelers: !!data.data.travelers,
              cities: !!data.data.cities,
              attractions: typeof data.data.attractions === 'number' ? data.data.attractions : 0,
            };
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    if (latestReadiness) {
      // Override attractions count with actual accepted count (more reliable than AI's count)
      latestReadiness.attractions = acceptedAttractions.length;
      setReadiness(latestReadiness);
    }
  }, [messages, acceptedAttractions.length]);

  const handleSend = useCallback(async (text: string) => {
    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    // Create placeholder for assistant response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const allMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, locale }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);

          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                }
                return updated;
              });
            }
          } catch {
            // ignore parse errors in stream
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = {
            ...last,
            content: t('error'),
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, t]);

  const handleAcceptAttraction = useCallback((data: Record<string, unknown>) => {
    setAcceptedAttractions((prev) => {
      // Avoid duplicates by ID
      const id = data.id as string;
      if (prev.some((a) => a.id === id)) return prev;
      return [...prev, data];
    });
  }, []);

  const handleCreateTrip = useCallback(async () => {
    setIsCreating(true);

    try {
      // Step 1: Finalize trip data via AI
      const allMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const finalizeRes = await fetch('/api/ai/finalize-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, acceptedAttractions }),
      });

      if (!finalizeRes.ok) {
        throw new Error('Failed to finalize trip');
      }

      const finalData = await finalizeRes.json();
      const { tripConfig, attractions, restaurants, itinerary } = finalData;

      if (!tripConfig || !attractions) {
        throw new Error('Invalid finalized data');
      }

      if (!itinerary) {
        const errDetail = finalData._itineraryErrors
          ? `\nValidation: ${JSON.stringify(finalData._itineraryErrors).slice(0, 300)}`
          : '';
        throw new Error(`No itinerary generated (AI output failed validation)${errDetail}`);
      }

      // Step 2: Create the trip
      const createRes = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripConfig),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create trip');
      }

      // Step 3: Add attractions
      for (const attraction of attractions) {
        await fetch(`/api/trips/${tripConfig.slug}/attractions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attraction),
        });
      }

      // Step 4: Save restaurants (if any were generated)
      if (restaurants && Array.isArray(restaurants) && restaurants.length > 0) {
        const restaurantRes = await fetch(`/api/trips/${tripConfig.slug}/restaurants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurants }),
        });
        if (!restaurantRes.ok) {
          console.warn('Failed to save restaurants, continuing without them');
        }
      }

      // Step 5: Save itinerary
      const itineraryRes = await fetch(`/api/trips/${tripConfig.slug}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itinerary),
      });
      if (!itineraryRes.ok) {
        throw new Error('Failed to save itinerary');
      }

      // Step 6: Redirect to the new trip
      toast.success(t('success'));
      // Use window.location for full reload so the server picks up new files
      const locale = window.location.pathname.split('/')[1] || 'nl';
      window.location.href = `/${locale}/${tripConfig.slug}`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Create trip error:', errorMsg);
      toast.error(t('error'));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `${t('error')}\n\nDetails: ${errorMsg}`,
        },
      ]);
    } finally {
      setIsCreating(false);
    }
  }, [messages, acceptedAttractions, t]);

  const hasEnoughContext =
    readiness.destination &&
    readiness.dates &&
    readiness.travelers &&
    readiness.cities &&
    tripData !== null;

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              onAcceptAttraction={
                msg.role === 'assistant' ? handleAcceptAttraction : undefined
              }
            />
          ))}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isStreaming || isCreating} />
      </div>

      {/* Preview sidebar - desktop */}
      <div className="hidden lg:flex lg:w-80 flex-col border-l border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-sm text-gray-900">
            {t('tripPreview')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TripPreview
            tripData={tripData}
            acceptedAttractions={acceptedAttractions}
            readiness={readiness}
          />
        </div>
        {hasEnoughContext && (
          <div className="p-4 border-t border-gray-200">
            <CreateTripButton
              onClick={handleCreateTrip}
              loading={isCreating}
            />
          </div>
        )}
      </div>

      {/* Preview toggle - mobile */}
      <div className="lg:hidden fixed bottom-20 right-4 z-10 flex flex-col gap-2">
        {acceptedAttractions.length > 0 && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-sm font-bold"
          >
            {acceptedAttractions.length}
          </button>
        )}
        {hasEnoughContext && (
          <button
            onClick={handleCreateTrip}
            disabled={isCreating}
            className="h-12 px-4 rounded-full bg-green-600 text-white shadow-lg flex items-center justify-center text-sm font-semibold disabled:opacity-50"
          >
            {isCreating ? '...' : t('createTrip')}
          </button>
        )}
      </div>

      {/* Mobile preview overlay */}
      {showPreview && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowPreview(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-900">
                {t('tripPreview')}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <TripPreview
              tripData={tripData}
              acceptedAttractions={acceptedAttractions}
              readiness={readiness}
            />
          </div>
        </div>
      )}
    </div>
  );
}
