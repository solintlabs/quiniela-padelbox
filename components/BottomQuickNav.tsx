'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomQuickNavProps {
  hasPaid: boolean;
}

/**
 * Tab bar fijo al fondo de la pantalla en móvil (estilo iOS). Solo visible
 * en anchos < sm (640px). El layout añade pb-20 sm:pb-8 al main para que
 * el contenido no quede tapado por la barra.
 *
 * Es client component porque usa usePathname() para resaltar el tab activo.
 */
export function BottomQuickNav({ hasPaid }: BottomQuickNavProps) {
  const pathname = usePathname() ?? '/';

  const tabs: Array<{
    href: string;
    label: string;
    icon: string;
    active: (p: string) => boolean;
    badge?: 'paid' | 'unpaid';
  }> = [
    { href: '/', label: 'Inicio', icon: '🏠', active: (p) => p === '/' },
    { href: '/partidos', label: 'Partidos', icon: '🎯', active: (p) => p.startsWith('/partidos') },
    { href: '/ranking', label: 'Ranking', icon: '🏆', active: (p) => p.startsWith('/ranking') },
    {
      href: '/perfil',
      label: 'Perfil',
      icon: '👤',
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
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors relative ' +
                  (isActive ? 'text-accent' : 'text-muted hover:text-ink')
                }
              >
                <span className="text-xl leading-none relative">
                  {t.icon}
                  {t.badge === 'unpaid' && (
                    <span
                      aria-hidden
                      className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-warning"
                    />
                  )}
                </span>
                <span className="font-medium leading-none">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
