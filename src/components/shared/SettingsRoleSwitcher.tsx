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
  const [error, setError] = useState<string | null>(null);

  async function switchRole(role: DemoRole) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/demo-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        setError('Could not switch roles. Your account may not have access to that view.');
        return;
      }
      setActiveRole(role);
      const home = role === 'hr' ? '/hr/home' : role === 'manager' ? '/manager/home' : '/employee/home';
      router.push(home);
      router.refresh();
    } catch {
      setError('Could not switch roles. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
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
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button variant="outline" disabled className="w-fit">
        Active role: {ROLES.find((r) => r.value === activeRole)?.label}
      </Button>
    </div>
  );
}
