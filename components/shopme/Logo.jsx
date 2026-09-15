import React from 'react';
import { cn } from '@/lib/utils';

export default function Logo({ className, size = 'md', showWordmark = true, tone = 'default' }) {
  const sizes = {
    sm: { box: 'h-7 w-7', text: 'text-base' },
    md: { box: 'h-8 w-8', text: 'text-lg' },
    lg: { box: 'h-10 w-10', text: 'text-2xl' },
    xl: { box: 'h-12 w-12', text: 'text-3xl' },
  };
  const s = sizes[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          s.box,
          'relative grid place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft'
        )}
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
          <path d="M5 7h14l-1 9.5a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 7Z" />
          <path d="M9 9V7.2a3 3 0 0 1 6 0V9" />
        </svg>
      </div>
      {showWordmark && (
        <span
          className={cn(
            s.text,
            'font-extrabold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-foreground'
          )}
          style={{ letterSpacing: '-0.02em' }}
        >
          SHOPME
        </span>
      )}
    </div>
  );
}