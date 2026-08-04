'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alex.chen@techforward.io');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    let response: Response;
    try {
      response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // A network failure would otherwise leave the form stuck in loading.
      setError('Could not reach the server. Check your connection and try again.');
      setLoading(false);
      return;
    }

    if (!response.ok) {
      // Surface the server's reason for non-credential failures: a rate-limited
      // (429) or unconfigured-auth (503) response otherwise reads as bad
      // credentials and invites retries that extend the lockout.
      let message = 'Invalid credentials. Use the demo email and any password.';
      if (response.status !== 401) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        message = payload?.error ?? 'Sign-in failed. Try again.';
      }
      setError(message);
      setLoading(false);
      return;
    }

    const data = (await response.json()) as { redirectTo?: string };
    router.push(data.redirectTo ?? '/employee/home');
    router.refresh();
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-primary">GrowthOS</CardTitle>
        <CardDescription>Sign in to your growth workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="#" className="text-primary hover:underline">
              Forgot password?
            </Link>{' '}
            (placeholder)
          </p>
          <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
            Demo mode: mock authentication only. Sign in with <strong>alex.chen@techforward.io</strong>{' '}
            and any password. After login, use Settings or the top-bar role switcher to explore
            Manager and HR experiences.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
