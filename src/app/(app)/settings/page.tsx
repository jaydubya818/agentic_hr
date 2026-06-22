import { SettingsRoleSwitcher } from '@/components/shared/SettingsRoleSwitcher';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMockSession } from '@/lib/auth/mock-session';

export default async function SettingsPage() {
  const session = await getMockSession();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your demo role, preferences, and account settings."
        breadcrumbs={['Settings']}
      />
      <div className="grid max-w-2xl gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Demo role switcher</CardTitle>
            <CardDescription>
              Switch between Employee, Manager, and HR views for demo purposes. You can also use the
              role dropdown in the top bar. Manager and HR pages use demo fixture data (Jordan Lee
              manager fixture team and org-wide HR metrics).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsRoleSwitcher initialRole={session?.activeRole ?? 'employee'} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Profile and notification settings (placeholder).</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Signed in as:</span>{' '}
              {session?.fullName} ({session?.email})
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">Organization:</span>{' '}
              {session?.organizationName}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
