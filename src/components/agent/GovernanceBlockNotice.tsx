import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GOVERNANCE_BLOCK_MESSAGE } from '@/lib/governance/prohibited-patterns';

interface GovernanceBlockNoticeProps {
  message?: string;
}

export function GovernanceBlockNotice({
  message = GOVERNANCE_BLOCK_MESSAGE,
}: GovernanceBlockNoticeProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
      <CardContent className="flex gap-3 pt-6">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900">Suggestion not available</p>
          <p className="text-sm leading-relaxed text-amber-800">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
