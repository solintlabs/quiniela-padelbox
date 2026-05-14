'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={cn(
        'inline-flex items-center justify-center h-9 w-9 rounded-md border border-line hover:bg-bg-elev',
        className,
      )}
    >
      {/* sun / moon */}
      <span className="text-sm" aria-hidden>{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
