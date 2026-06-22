import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { getMockSession } from '@/lib/auth/mock-session';

export default async function ForbiddenPage() {
  const session = await getMockSession();
  const home =
    session?.activeRole === 'hr'
      ? '/hr/home'
      : session?.activeRole === 'manager'
        ? '/manager/home'
        : '/employee/home';

  return (
    <>
      <PageHeader title="Access denied" description="You don't have access to this page." />
      <Card className="max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>403 — Forbidden</CardTitle>
          <CardDescription>
            Your current role does not have permission to view this resource.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href={home} />}>Return to your home</Button>
        </CardContent>
      </Card>
    </>
  );
}
