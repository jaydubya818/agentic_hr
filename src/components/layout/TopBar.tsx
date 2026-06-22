'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { DemoRole } from '@/lib/auth/types';
import type { NavItem } from '@/lib/auth/navigation';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface TopBarProps {
  organizationName: string;
  userName: string;
  activeRole: DemoRole;
  navItems: NavItem[];
  roleLabel: string;
}

const ROLE_OPTIONS: { value: DemoRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR / Admin' },
];

export function TopBar({
  organizationName,
  userName,
  activeRole,
  navItems,
  roleLabel,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleRoleChange(value: DemoRole) {
    await fetch('/api/auth/demo-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: value }),
    });
    const home =
      value === 'hr' ? '/hr/home' : value === 'manager' ? '/manager/home' : '/employee/home';
    router.push(home);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle>{roleLabel} Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => {
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
          </SheetContent>
        </Sheet>
        <Link href="/" className="text-lg font-semibold text-primary">
          GrowthOS
        </Link>
        <span className="hidden text-sm text-muted-foreground md:inline">{organizationName}</span>
      </div>

      <div className="flex items-center gap-3">
        <Select value={activeRole} onValueChange={(value) => handleRoleChange(value as DemoRole)}>
          <SelectTrigger className="w-[140px]" size="sm">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
