import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, delta, trend = 'up', sub, icon: Icon, accent = 'default', className }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-emerald-600 bg-emerald-50' : trend === 'down' ? 'text-red-600 bg-red-50' : 'text-muted-foreground bg-muted';

  const iconWrap = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    revenue: 'bg-violet-50 text-violet-600',
  }[accent];

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-soft-md', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', iconWrap)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(delta || sub) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {delta && (
            <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {delta}
            </span>
          )}
          {sub && <span className="text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  );
}