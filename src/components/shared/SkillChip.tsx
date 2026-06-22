import { Check, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { z } from 'zod';
import { skillSourceSchema } from '@/schemas/enums';

type SkillSource = z.infer<typeof skillSourceSchema>;

interface SkillChipProps {
  name: string;
  source: SkillSource;
  proficiencyLevel?: number | null;
  className?: string;
}

export function SkillChip({ name, source, proficiencyLevel, className }: SkillChipProps) {
  const isConfirmed = source === 'confirmed';

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium',
        isConfirmed
          ? 'border-slate-200 bg-slate-100 text-slate-700'
          : 'border-amber-200 bg-amber-50 text-amber-800',
        className,
      )}
      aria-label={`${name}, ${source} skill${proficiencyLevel != null ? `, level ${proficiencyLevel}` : ''}`}
    >
      {isConfirmed ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <Sparkles className="size-3" aria-hidden="true" />
      )}
      {name}
      {proficiencyLevel != null && (
        <span className="text-[10px] opacity-70">L{proficiencyLevel}</span>
      )}
    </Badge>
  );
}
