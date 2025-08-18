'use client';

import { cn } from '@/lib/utils';

export function BlinkingCursor() {
  return (
    <span
      className={cn(
        'inline-block w-2 h-5 bg-foreground animate-pulse',
        'animation-delay-200'
      )}
    />
  );
}
