'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from './utils';

interface EntityOption {
  id: string;
  label: string;
  description?: string;
  type?: string;
}

interface EntitySearchProps {
  onSearch: (query: string) => Promise<EntityOption[]> | EntityOption[];
  onSelect: (entity: EntityOption) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

export function EntitySearch({
  onSearch,
  onSelect,
  placeholder = 'Search entities...',
  debounceMs = 300,
  className,
  disabled = false,
}: EntitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly EntityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const data = await onSearch(q);
        setResults(data);
        setOpen(data.length > 0);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    },
    [onSearch],
  );

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => search(value), debounceMs);
    },
    [search, debounceMs],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) {
        onSelect(item);
        setQuery(item.label);
      }
      setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm transition',
            'focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50',
          )}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-fade-in">
          {results.map((entity, index) => (
            <li key={entity.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                  index === activeIndex ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onSelect(entity);
                  setQuery(entity.label);
                  setOpen(false);
                }}
              >
                <div className="flex-1">
                  <span className="block font-medium">{entity.label}</span>
                  {entity.description && (
                    <span className="block text-xs text-gray-400">{entity.description}</span>
                  )}
                </div>
                {entity.type && (
                  <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    {entity.type}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { EntityOption, EntitySearchProps };
