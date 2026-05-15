import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { signOut } from '@/lib/auth';

interface NavProps {
  isAdmin?: boolean;
  userEmail?: string;
}

export function Nav({ isAdmin, userEmail }: NavProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-bg/85 border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} />
          <span className="text-xs text-muted hidden sm:inline">Quiniela Mundial 2026</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/">Inicio</NavLink>
          <NavLink href="/partidos">Partidos</NavLink>
          <NavLink href="/ranking">Ranking</NavLink>
          <NavLink href="/inscripcion">Inscripción</NavLink>
          <NavLink href="/perfil">Perfil</NavLink>
          {isAdmin && <NavLink href="/admin" className="text-accent">Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="text-xs text-muted hover:text-ink px-3 h-9 rounded-md border border-line"
              title={userEmail ?? 'Salir'}
            >
              Salir
            </button>
          </form>
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
