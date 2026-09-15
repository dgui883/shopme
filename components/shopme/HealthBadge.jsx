import React from 'react';
import { cn } from '@/lib/utils';

const MAP = {
  healthy: {
    label: 'Healthy',
    dot: 'bg-emerald-500',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ring: 'text-emerald-500',
  },
  needs_attention: {
    label: 'Needs Attention',
    dot: 'bg-amber-500',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    ring: 'text-amber-500',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-red-500',
    cls: 'bg-red-50 text-red-700 border-red-200',
    ring: 'text-red-500',
  },
};

export function HealthBadge({ health, className, withDot = true, size = 'md' }) {
  const m = MAP[health] || MAP.healthy;
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border font-medium', m.cls, pad, className)}>
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />}
      {m.label}
    </span>
  );
}

export function HealthDot({ health, className }) {
  const m = MAP[health] || MAP.healthy;
  return <span className={cn('inline-block h-2 w-2 rounded-full', m.dot, className)} />;
}

export const healthMeta = MAP;