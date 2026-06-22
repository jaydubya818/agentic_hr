import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { getMockSession } from '@/lib/auth/mock-session';
import { preloadDataProviderStore } from '@/services/data-provider/preload';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await preloadDataProviderStore();
  const session = await getMockSession();

  if (!session) {
    redirect('/login');
  }

  return <AppShell session={session}>{children}</AppShell>;
}
