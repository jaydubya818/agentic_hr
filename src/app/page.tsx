import { redirect } from 'next/navigation';
import { getMockSession } from '@/lib/auth/mock-session';

export default async function HomePage() {
  const session = await getMockSession();

  if (!session) {
    redirect('/login');
  }

  const home =
    session.activeRole === 'hr'
      ? '/hr/home'
      : session.activeRole === 'manager'
        ? '/manager/home'
        : '/employee/home';

  redirect(home);
}
