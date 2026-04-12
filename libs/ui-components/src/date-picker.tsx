'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { cn } from './utils';
import { Button } from './button';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
          'focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500',
          'disabled:cursor-not-allowed disabled:bg-gray-50',
          value ? 'border-gray-300 text-gray-900' : 'border-gray-300 text-gray-400',
        )}
      >
        <svg
          className="h-4 w-4 shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="truncate">{value ? format(value, 'dd MMM yyyy') : placeholder}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg animate-fade-in">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              if (date) setOpen(false);
            }}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            classNames={{
              day_selected: 'bg-green-600 text-white',
              day_today: 'font-bold text-green-600',
            }}
          />
          <div className="flex justify-end border-t border-gray-100 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export type { DatePickerProps };
