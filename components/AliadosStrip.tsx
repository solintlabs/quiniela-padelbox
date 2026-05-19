import { prisma } from '@/lib/db';

interface Props {
  /** Variante visual: dashboard (con eyebrow + cta) o compact (solo logos). */
  variant?: 'dashboard' | 'compact';
}

/**
 * Strip de logos de aliados comerciales. Server Component — query directa a DB.
 * Si no hay sponsors activos no renderiza nada.
 */
export async function AliadosStrip({ variant = 'dashboard' }: Props) {
  const sponsors = await prisma.sponsor.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, logoUrl: true, url: true },
  });
  if (sponsors.length === 0) return null;

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center gap-6 flex-wrap py-4">
        {sponsors.map((s) => (
          <SponsorLogo key={s.id} {...s} size={32} />
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-bg-elev p-3 sm:p-6">
      <header className="text-center mb-2 sm:mb-4">
        <p className="text-[10px] uppercase tracking-[0.22em] sm:tracking-[0.28em] text-accent font-bold">
          Aliados comerciales
        </p>
        <h3 className="font-display text-sm sm:text-2xl mt-1">
          Premios semanales cortesía de
        </h3>
      </header>
      <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
        {sponsors.map((s) => (
          <ResponsiveSponsorLogo key={s.id} {...s} />
        ))}
      </div>
      <p className="hidden sm:block text-[11px] text-muted text-center mt-4 max-w-md mx-auto">
        Top pronosticadores de cada semana se llevan gift cards y productos
        cortesía de nuestros aliados comerciales.
      </p>
    </section>
  );
}

function ResponsiveSponsorLogo(s: { id: string; name: string; logoUrl: string | null; url: string | null }) {
  if (!s.logoUrl) {
    return <span className="text-xs sm:text-sm text-muted">{s.name}</span>;
  }
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={s.logoUrl}
      alt={s.name}
      className="h-8 sm:h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
    />
  );
  if (s.url) {
    return (
      <a href={s.url} target="_blank" rel="noopener noreferrer" title={s.name}>
        {img}
      </a>
    );
  }
  return img;
}

function SponsorLogo({
  logoUrl,
  name,
  url,
  size,
}: {
  logoUrl: string | null;
  name: string;
  url: string | null;
  size: number;
}) {
  if (!logoUrl) {
    return <span className="text-sm text-muted">{name}</span>;
  }
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      style={{ height: size }}
      className="w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
    />
  );
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" title={name}>
        {img}
      </a>
    );
  }
  return img;
}
