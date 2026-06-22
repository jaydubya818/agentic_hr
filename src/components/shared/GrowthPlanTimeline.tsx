import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GrowthPlanItem } from '@/services/data-provider/types';

const MILESTONES = [30, 60, 90] as const;

const ITEM_TYPE_LABELS: Record<GrowthPlanItem['itemType'], string> = {
  learning: 'Learning',
  project: 'Project',
  conversation: 'Conversation',
  skill: 'Skill',
};

const STATUS_ICON = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
} as const;

interface GrowthPlanTimelineProps {
  items: GrowthPlanItem[];
  compact?: boolean;
  className?: string;
}

export function GrowthPlanTimeline({ items, compact = false, className }: GrowthPlanTimelineProps) {
  const itemsByMilestone = MILESTONES.map((day) => ({
    day,
    items: items.filter((item) => item.milestoneDay === day),
  }));

  if (items.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn('grid gap-3 sm:grid-cols-3', className)}>
        {itemsByMilestone.map(({ day, items: milestoneItems }) => (
          <div key={day} className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Day {day}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {milestoneItems.length} milestone{milestoneItems.length !== 1 ? 's' : ''}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {milestoneItems.filter((i) => i.status === 'completed').length} completed
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {itemsByMilestone.map(({ day, items: milestoneItems }) => (
        <section key={day} aria-labelledby={`milestone-${day}`}>
          <h3 id={`milestone-${day}`} className="mb-4 text-lg font-semibold text-foreground">
            {day}-Day Milestone
          </h3>
          {milestoneItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items scheduled for this milestone.</p>
          ) : (
            <div className="space-y-3 border-l-2 border-primary/20 pl-6">
              {milestoneItems.map((item) => {
                const StatusIcon = STATUS_ICON[item.status];
                return (
                  <Card key={item.id} className="shadow-sm">
                    <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                      <StatusIcon
                        className={cn(
                          'mt-0.5 size-5 shrink-0',
                          item.status === 'completed' && 'text-emerald-600',
                          item.status === 'in_progress' && 'text-amber-600',
                          item.status === 'pending' && 'text-muted-foreground',
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <Badge variant="outline">{ITEM_TYPE_LABELS[item.itemType]}</Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pl-11">
                      <Badge
                        variant="secondary"
                        className={cn(
                          item.status === 'completed' && 'bg-emerald-50 text-emerald-800',
                          item.status === 'in_progress' && 'bg-amber-50 text-amber-800',
                        )}
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
