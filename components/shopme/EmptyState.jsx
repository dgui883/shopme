import React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description, icon: Icon = Inbox, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center', className)}>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}