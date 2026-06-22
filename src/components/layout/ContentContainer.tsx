import { cn } from '@/lib/utils';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentContainer({ children, className }: ContentContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 py-8 md:px-8', className)}>{children}</div>
  );
}
