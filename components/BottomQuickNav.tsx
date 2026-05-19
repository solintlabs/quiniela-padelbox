import Link from 'next/link';

interface BottomQuickNavProps {
  hasPaid: boolean;
}

/**
 * Menú estático de accesos rápidos visible al final de cada página (solo en
 * móvil web). En desktop está oculto porque el Nav superior con hamburguesa
 * ya cubre la navegación.
 */
export function BottomQuickNav({ hasPaid }: BottomQuickNavProps) {
  return (
    <nav
      aria-label="Accesos rápidos"
      className="sm:hidden mt-12 pt-6 border-t border-line"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-muted text-center mb-4">
        Accesos rápidos
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Tile
          href="/partidos"
          icon="🎯"
          title="Mis pronósticos"
          subtitle="Predice y edita"
        />
        <Tile
          href="/ranking"
          icon="🏆"
          title="Ranking"
          subtitle="Ver tabla"
        />
        <Tile
          href="/perfil"
          icon="👤"
          title="Mi perfil"
          subtitle={hasPaid ? '✓ Activado' : '⚠ Pendiente'}
          badgeColor={hasPaid ? 'text-success' : 'text-warning'}
        />
        <Tile
          href="/reglas"
          icon="📋"
          title="Reglas"
          subtitle="Cómo funciona"
        />
      </div>
    </nav>
  );
}

function Tile({
  href,
  icon,
  title,
  subtitle,
  badgeColor,
}: {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  badgeColor?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-line bg-bg-elev p-4 hover:border-accent hover:bg-accent/5 transition-colors flex flex-col items-center text-center"
    >
      <span className="text-2xl mb-2">{icon}</span>
      <p className="font-display text-sm leading-tight">{title}</p>
      <p className={`text-[11px] mt-1 ${badgeColor ?? 'text-muted'}`}>{subtitle}</p>
    </Link>
  );
}
