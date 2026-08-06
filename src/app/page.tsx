import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/auth/session-context';

export default async function HomePage() {
  // Use the session context (not the raw mock cookie) so the live-mode
  // redirect target reflects the activeRole clamped to database-backed roles.
  const session = await getSessionContext();

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
