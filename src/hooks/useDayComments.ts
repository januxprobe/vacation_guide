'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DayComment } from '@/types';

export function useDayComments(tripSlug: string, dayNumber: number) {
  const [comments, setComments] = useState<DayComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripSlug}/comments`);
      if (!res.ok) return;
      const data = await res.json();
      const allComments: DayComment[] = data.comments ?? [];
      setComments(allComments.filter((c) => c.dayNumber === dayNumber));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [tripSlug, dayNumber]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(async (author: string, text: string) => {
    const comment: DayComment = {
      id: crypto.randomUUID(),
      author,
      text,
      timestamp: Date.now(),
      dayNumber,
    };

    // Optimistic update
    setComments((prev) => [...prev, comment]);

    try {
      const res = await fetch(`/api/trips/${tripSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      });
      if (!res.ok) {
        // Rollback
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
        return false;
      }
      // Save author name for reuse
      localStorage.setItem('vacation-guide:commenter-name', author);
      return true;
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      return false;
    }
  }, [tripSlug, dayNumber]);

  const deleteComment = useCallback(async (commentId: string) => {
    const original = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const res = await fetch(`/api/trips/${tripSlug}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId }),
      });
      if (!res.ok) {
        setComments(original);
        return false;
      }
      return true;
    } catch {
      setComments(original);
      return false;
    }
  }, [tripSlug, comments]);

  return { comments, addComment, deleteComment, isLoading };
}
