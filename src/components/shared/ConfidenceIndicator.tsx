import {
  confidenceBarColor,
  confidenceLabel,
  confidenceTextColor,
  formatConfidencePercent,
  getConfidenceLevel,
} from '@/lib/format/confidence';
import { cn } from '@/lib/utils';
import type { z } from 'zod';
import { confidenceLevelSchema } from '@/schemas/enums';

type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;

interface ConfidenceIndicatorProps {
  value: number;
  level?: ConfidenceLevel;
  showPercent?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function ConfidenceIndicator({
  value,
  level,
  showPercent = true,
  className,
  size = 'md',
}: ConfidenceIndicatorProps) {
  const resolvedLevel = level ?? getConfidenceLevel(value);
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div
      className={cn('flex flex-col gap-1', className)}
      aria-label={`Confidence: ${confidenceLabel(resolvedLevel)}, ${percent} percent`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={cn('font-medium', confidenceTextColor(resolvedLevel))}>
          {confidenceLabel(resolvedLevel)}
        </span>
        {showPercent && (
          <span className="font-mono text-muted-foreground">{formatConfidencePercent(value)}</span>
        )}
      </div>
      <div className={cn('w-full overflow-hidden rounded-full bg-muted', barHeight)}>
        <div
          className={cn('h-full rounded-full transition-all', confidenceBarColor(resolvedLevel))}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
