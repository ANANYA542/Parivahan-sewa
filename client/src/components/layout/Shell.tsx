import type { ReactNode } from 'react';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8">
      {children}
    </div>
  );
}

