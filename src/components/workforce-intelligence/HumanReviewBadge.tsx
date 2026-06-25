'use client';

import { ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export function HumanReviewBadge() {
  return (
    <Badge variant="outline" className="gap-1 text-amber-800">
      <ShieldAlert className="size-3" aria-hidden />
      Human review recommended
    </Badge>
  );
}
