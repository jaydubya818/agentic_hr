'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        setError('Could not sign out. Try again.');
        return;
      }
      router.push('/login');
      router.refresh();
    } catch {
      setError('Could not sign out. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button variant="outline" onClick={signOut} disabled={loading} className="w-fit">
        {loading ? 'Signing out…' : 'Sign out'}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
