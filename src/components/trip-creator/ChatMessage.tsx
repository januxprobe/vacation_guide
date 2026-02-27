'use client';

import { useMemo } from 'react';
import { Bot, User } from 'lucide-react';
import AttractionSuggestion from './AttractionSuggestion';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  onAcceptAttraction?: (data: Record<string, unknown>) => void;
}

interface ParsedSegment {
  type: 'text' | 'attraction' | 'trip_config';
  content: string;
  data?: Record<string, unknown>;
}

function parseMessageContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    // Add text before this JSON block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: 'text', content: text });
    }

    // Parse JSON block
    try {
      const data = JSON.parse(match[1]);
      if (data.type === 'attraction_suggestion' && data.data) {
        segments.push({
          type: 'attraction',
          content: match[1],
          data: data.data,
        });
      } else if (data.type === 'trip_config' && data.data) {
        segments.push({
          type: 'trip_config',
          content: match[1],
          data: data.data,
        });
      } else {
        segments.push({ type: 'text', content: '```json\n' + match[1] + '```' });
      }
    } catch {
      segments.push({ type: 'text', content: '```json\n' + match[1] + '```' });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) segments.push({ type: 'text', content: text });
  }

  if (segments.length === 0 && content.trim()) {
    segments.push({ type: 'text', content: content.trim() });
  }

  return segments;
}

export default function ChatMessage({ role, content, onAcceptAttraction }: ChatMessageProps) {
  const segments = useMemo(() => parseMessageContent(content), [content]);
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-100' : 'bg-purple-100'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-blue-600" />
        ) : (
          <Bot className="h-4 w-4 text-purple-600" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {segments.map((segment, i) => {
          if (segment.type === 'attraction' && segment.data) {
            return (
              <AttractionSuggestion
                key={i}
                data={segment.data}
                onAccept={onAcceptAttraction ? () => onAcceptAttraction(segment.data!) : undefined}
              />
            );
          }

          if (segment.type === 'trip_config') {
            return (
              <div
                key={i}
                className="my-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800"
              >
                Trip configuration ready!
              </div>
            );
          }

          // Regular text
          return (
            <div
              key={i}
              className={`inline-block px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                isUser
                  ? 'bg-blue-600 text-white rounded-tr-md'
                  : 'bg-gray-100 text-gray-900 rounded-tl-md'
              } ${i > 0 ? 'mt-2' : ''}`}
            >
              {segment.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
