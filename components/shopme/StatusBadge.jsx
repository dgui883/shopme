import React from 'react';
import { cn } from '@/lib/utils';

const STATUS = {
  fulfilled: { label: 'Fulfilled', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  unfulfilled: { label: 'Unfulfilled', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  delayed: { label: 'Delayed', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Processing', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  active: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  suspended: { label: 'Suspended', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  banned: { label: 'Banned', cls: 'bg-red-50 text-red-700 border-red-200' },
  unused: { label: 'Unused', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  revoked: { label: 'Revoked', cls: 'bg-red-50 text-red-700 border-red-200' },
  connected: { label: 'Connected', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  syncing: { label: 'Syncing', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  disconnected: { label: 'Disconnected', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  success: { label: 'Success', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  warning: { label: 'Warning', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  destructive: { label: 'Alert', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function StatusBadge({ status, className, children }) {
  const m = STATUS[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium', m.cls, className)}>
      {children || m.label}
    </span>
  );
}

export const statusMeta = STATUS;