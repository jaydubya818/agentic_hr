'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/auth/navigation';

interface SidebarProps {
  items: NavItem[];
  roleLabel: string;
  className?: string;
}

export function Sidebar({ items, roleLabel, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden w-60 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col',
        className,
      )}
    >
      <div className="border-b border-border px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {roleLabel}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">Navigation</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
