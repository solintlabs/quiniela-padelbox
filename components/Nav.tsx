import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { MobileNav } from './MobileNav';
import { signOut } from '@/lib/auth';

interface NavProps {
  isAdmin?: boolean;
  userEmail?: string;
}

export function Nav({ isAdmin, userEmail }: NavProps) {
  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/partidos', label: 'Partidos' },
    { href: '/ranking', label: 'Ranking' },
    { href: '/reglas', label: 'Reglas' },
    { href: '/inscripcion', label: 'Inscripción' },
    { href: '/perfil', label: 'Perfil' },
  ];

  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-bg/85 border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Logo size={28} />
          <span className="font-display text-lg text-zinc-500 leading-none">×</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/partners/delish.svg" alt="DELISH" className="h-7 w-auto" />
        </Link>

        {/* Desktop nav — solo md+ */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>{l.label}</NavLink>
          ))}
          {isAdmin && <NavLink href="/admin" className="text-accent">Admin</NavLink>}
        </nav>

        {/* Right side — desktop: theme + salir / mobile: theme + hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          {/* Salir — solo desktop */}
          <form className="hidden md:block" action={signOutAction}>
            <button
              type="submit"
              className="text-xs text-muted hover:text-ink px-3 h-9 rounded-md border border-line"
              title={userEmail ?? 'Salir'}
            >
              Salir
            </button>
          </form>

          {/* Hamburger — solo mobile */}
          <MobileNav
            links={links}
            isAdmin={isAdmin}
            userEmail={userEmail}
            signOutAction={signOutAction}
          />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={'px-3 py-1.5 rounded-md hover:bg-bg-elev transition-colors ' + (className ?? '')}
    >
      {children}
    </Link>
  );
}
