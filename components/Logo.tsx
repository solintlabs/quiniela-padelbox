'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

export function Logo({ className, size = 36, priority = false }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Antes del hydrate, asume dark (mejora LCP en login que es dark)
  const dark = !mounted ? true : resolvedTheme === 'dark';
  const src = dark ? '/logos/completo-blanco.png' : '/logos/completo-negro.png';

  return (
    <Image
      src={src}
      alt="PADELBOX"
      width={size * 3.2}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
