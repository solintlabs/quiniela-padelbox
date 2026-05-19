'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomQuickNavProps {
  hasPaid: boolean;
}

type IconProps = { active: boolean };

function IconHome({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9.5a.5.5 0 0 0 .5.5H10v-6h4v6h4.5a.5.5 0 0 0 .5-.5V10" />
    </svg>
  );
}

function IconBall({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
      <path d="M12 7.5 8.5 10l1.3 4h4.4l1.3-4z" />
    </svg>
  );
}

function IconTrophy({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 1.5 4.5 4 5" />
      <path d="M17 6h3a1 1 0 0 1 1 1c0 2.5-1.5 4.5-4 5" />
      <path d="M10 14v2.5c0 .8-.4 1.5-1 2L8 19h8l-1-.5c-.6-.5-1-1.2-1-2V14" />
      <path d="M7 21h10" />
    </svg>
  );
}

function IconUser({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export function BottomQuickNav({ hasPaid }: BottomQuickNavProps) {
  const pathname = usePathname() ?? '/';

  const tabs: Array<{
    href: string;
    label: string;
    Icon: (p: IconProps) => React.JSX.Element;
    active: (p: string) => boolean;
    badge?: 'paid' | 'unpaid';
  }> = [
    { href: '/', label: 'Inicio', Icon: IconHome, active: (p) => p === '/' },
    { href: '/partidos', label: 'Partidos', Icon: IconBall, active: (p) => p.startsWith('/partidos') },
    { href: '/ranking', label: 'Ranking', Icon: IconTrophy, active: (p) => p.startsWith('/ranking') },
    {
      href: '/perfil',
      label: 'Perfil',
      Icon: IconUser,
      active: (p) => p.startsWith('/perfil'),
      badge: hasPaid ? 'paid' : 'unpaid',
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-md border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const isActive = t.active(pathname);
          const Icon = t.Icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={isActive ? 'page' : undefined}
                className={
                  'flex flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors relative ' +
                  (isActive ? 'text-accent' : 'text-muted hover:text-ink')
                }
              >
                <span className="relative inline-flex">
                  <Icon active={isActive} />
                  {t.badge === 'unpaid' && (
                    <span
                      aria-hidden
                      className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-warning"
                    />
                  )}
                </span>
                <span className={'leading-none ' + (isActive ? 'font-semibold' : 'font-medium')}>
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
