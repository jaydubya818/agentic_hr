'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { SkillChip } from '@/components/shared/SkillChip';

interface InferredSkillReviewRowProps {
  employeeSkillId: string;
  skillName: string;
  proficiencyLevel?: number | null;
}

export function InferredSkillReviewRow({
  employeeSkillId,
  skillName,
  proficiencyLevel,
}: InferredSkillReviewRowProps) {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);

  async function review(action: 'confirm' | 'reject') {
    setLoading(true);
    try {
      const response = await fetch(`/api/employee-skills/${employeeSkillId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        setStatus(action === 'confirm' ? 'confirmed' : 'rejected');
      }
    } finally {
      setLoading(false);
    }
  }

  if (status === 'rejected') {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <div className="flex items-center gap-2">
        <SkillChip name={skillName} source="inferred" proficiencyLevel={proficiencyLevel} />
        {status === 'confirmed' && (
          <span className="text-xs text-emerald-700">Confirmed</span>
        )}
      </div>
      {status === 'pending' && (
        <div className="flex gap-2">
          <Button size="sm" disabled={loading} onClick={() => review('confirm')}>
            Confirm
          </Button>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => review('reject')}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
