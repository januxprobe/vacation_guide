'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useDayComments } from '@/hooks/useDayComments';
import { toast } from 'sonner';

interface DayCommentsProps {
  tripSlug: string;
  dayNumber: number;
}

export default function DayComments({ tripSlug, dayNumber }: DayCommentsProps) {
  const t = useTranslations();
  const { comments, addComment, deleteComment, isLoading } = useDayComments(tripSlug, dayNumber);
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show expanded content when opened
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isOpen]);

  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vacation-guide:commenter-name') ?? '';
    }
    return '';
  });
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    const success = await addComment(name.trim(), text.trim());
    if (success) {
      setText('');
    } else {
      toast.error(t('planner.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteComment(id);
    if (!success) {
      toast.error(t('planner.saveError'));
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors w-full"
      >
        <MessageSquare className="w-4 h-4" />
        <span>
          {t('planner.comments')}
          {comments.length > 0 && (
            <span className="ml-1 text-gray-400">({comments.length})</span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-auto" />
        )}
      </button>

      {isOpen && (
        <div ref={contentRef} className="mt-3 space-y-3">
          {isLoading ? (
            <div className="text-xs text-gray-400">{t('common.loading')}</div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400">{t('planner.noComments')}</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3 group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      {comment.author}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        {formatTime(comment.timestamp)}
                      </span>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                        title={t('planner.deleteComment')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{comment.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('planner.commentName')}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('planner.commentPlaceholder')}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!name.trim() || !text.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
