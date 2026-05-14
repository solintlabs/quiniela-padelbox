'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownProps {
  target: string | Date;
  className?: string;
  /** Si quedan menos minutos que este umbral, se tiñe de --warning */
  warnAtMinutes?: number;
  /** Formato compacto "2h 14m 33s" vs detallado "02 : 14 : 33" */
  format?: 'compact' | 'clock';
  onExpire?: () => void;
}

function diffParts(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { expired: true, days: 0, h: 0, m: 0, s: 0 };
  const s = Math.floor(ms / 1000);
  return {
    expired: false,
    days: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function Countdown({
  target,
  className,
  warnAtMinutes = 120,
  format = 'compact',
  onExpire,
}: CountdownProps) {
  const t = typeof target === 'string' ? new Date(target) : target;
  const [parts, setParts] = useState(() => diffParts(t));

  useEffect(() => {
    setParts(diffParts(t));
    const id = setInterval(() => {
      const p = diffParts(t);
      setParts(p);
      if (p.expired) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [t, onExpire]);

  const totalMin = parts.days * 1440 + parts.h * 60 + parts.m;
  const warn = !parts.expired && totalMin <= warnAtMinutes;

  if (parts.expired) {
    return <span className={cn('text-muted', className)}>Cerrado</span>;
  }

  if (format === 'clock') {
    return (
      <span className={cn('font-display tabular-nums', warn && 'text-warning', className)}>
        {parts.days > 0
          ? `${parts.days}d ${String(parts.h).padStart(2, '0')}h`
          : `${String(parts.h).padStart(2, '0')} : ${String(parts.m).padStart(2, '0')} : ${String(parts.s).padStart(2, '0')}`}
      </span>
    );
  }

  // compact
  if (parts.days > 0) {
    return <span className={cn('tabular-nums', className)}>{`${parts.days}d ${parts.h}h`}</span>;
  }
  return (
    <span className={cn('tabular-nums', warn && 'text-warning', className)}>
      {parts.h > 0 ? `${parts.h}h ${String(parts.m).padStart(2, '0')}m` : `${parts.m}m ${String(parts.s).padStart(2, '0')}s`}
    </span>
  );
}
