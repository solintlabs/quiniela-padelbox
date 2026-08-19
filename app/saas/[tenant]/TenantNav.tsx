'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
      <path d="M12 7.5 8.5 10l1.3 4h4.4l1.3-4z" />
    </svg>
  );
}
function IconTrophy({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 21h8M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
    </svg>
  );
}
function IconBook({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2z" />
      <path d="M8 8h8M8 12h6" />
    </svg>
  );
}
function IconGear({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}

/**
 * Navegación del tenant estilo PADELBOX: barra inferior fija en móvil (para el
 * pulgar) y tabs horizontales en escritorio. Los enlaces cuelgan del slug del
 * tenant. El estado activo se marca con el pathname.
 */
export function TenantNav({ slug, isAdmin = false }: { slug: string; isAdmin?: boolean }) {
  const pathname = usePathname() ?? '';
  const base = `/saas/${slug}`;

  const tabs = [
    { href: base, label: 'Inicio', Icon: IconHome, active: pathname === base },
    { href: `${base}/partidos`, label: 'Partidos', Icon: IconBall, active: pathname.startsWith(`${base}/partidos`) },
    { href: `${base}/ranking`, label: 'Ranking', Icon: IconTrophy, active: pathname.startsWith(`${base}/ranking`) },
    { href: `${base}/reglas`, label: 'Reglas', Icon: IconBook, active: pathname.startsWith(`${base}/reglas`) },
    ...(isAdmin
      ? [{ href: `${base}/panel`, label: 'Panel', Icon: IconGear, active: pathname.startsWith(`${base}/panel`) }]
      : []),
  ];

  return (
    <>
      {/* Escritorio: tabs horizontales bajo la cabecera */}
      <nav className="hidden sm:flex gap-1 border-b border-line" aria-label="Secciones">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? 'page' : undefined}
            className={
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ' +
              (t.active ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink')
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Móvil: barra inferior fija */}
      <nav
        aria-label="Navegación"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-md border-t border-line"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => {
            const Icon = t.Icon;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={t.active ? 'page' : undefined}
                  className={
                    'flex flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors ' +
                    (t.active ? 'text-accent' : 'text-muted hover:text-ink')
                  }
                >
                  <Icon active={t.active} />
                  <span className={'leading-none ' + (t.active ? 'font-semibold' : 'font-medium')}>
                    {t.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
