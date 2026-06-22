import { getNavForRole, getRoleAreaLabel } from '@/lib/auth/navigation';
import type { MockSession } from '@/lib/auth/types';
import { ContentContainer } from './ContentContainer';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  session: MockSession;
  children: React.ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  const navItems = getNavForRole(session.activeRole);
  const roleLabel = getRoleAreaLabel(session.activeRole);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar
        organizationName={session.organizationName}
        userName={session.fullName}
        activeRole={session.activeRole}
        navItems={navItems}
        roleLabel={roleLabel}
      />
      <div className="flex flex-1">
        <Sidebar items={navItems} roleLabel={roleLabel} />
        <main className="flex-1">
          <ContentContainer>{children}</ContentContainer>
        </main>
      </div>
    </div>
  );
}
