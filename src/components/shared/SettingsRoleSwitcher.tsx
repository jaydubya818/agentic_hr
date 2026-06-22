'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DemoRole } from '@/lib/auth/types';

const ROLES: { value: DemoRole; label: string; description: string }[] = [
  { value: 'employee', label: 'Employee', description: 'Personal growth home and career tools' },
  { value: 'manager', label: 'Manager', description: 'Team skills, coaching, and capability planning' },
  { value: 'hr', label: 'HR / Admin', description: 'Org readiness, mobility, and workforce insights' },
];

interface SettingsRoleSwitcherProps {
  initialRole: DemoRole;
}

export function SettingsRoleSwitcher({ initialRole }: SettingsRoleSwitcherProps) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<DemoRole>(initialRole);
  const [loading, setLoading] = useState(false);

  async function switchRole(role: DemoRole) {
    setLoading(true);
    await fetch('/api/auth/demo-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setActiveRole(role);
    const home = role === 'hr' ? '/hr/home' : role === 'manager' ? '/manager/home' : '/employee/home';
    router.push(home);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="grid gap-3">
      {ROLES.map((role) => (
        <button
          key={role.value}
          type="button"
          onClick={() => switchRole(role.value)}
          disabled={loading}
          className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
            activeRole === role.value
              ? 'border-primary bg-accent-muted/40'
              : 'border-border hover:bg-muted'
          }`}
        >
          <span className="font-medium text-foreground">{role.label}</span>
          <span className="text-sm text-muted-foreground">{role.description}</span>
        </button>
      ))}
      <Button variant="outline" disabled className="w-fit">
        Active role: {ROLES.find((r) => r.value === activeRole)?.label}
      </Button>
    </div>
  );
}
