import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { tenantThemeVars } from '@/lib/saas/theme';
import { showsBranding, showsAds } from '@/lib/saas/plans';
import { SaasLegalFooter } from '@/components/SaasLegalFooter';
import { AdSlot } from '@/components/AdSlot';
import { TenantNav } from '../TenantNav';
import { saasSignOut } from '../../actions';
import { loadTenantPlayer } from '@/lib/saas/playerView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { tenant: string };
}): Promise<Metadata> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.tenant },
    select: { name: true },
  });
  if (!tenant) return { title: 'Quiniela · QuinielaBOX' };
  const title = `${tenant.name} · Quiniela`;
  const description = `Pronostica los partidos y compite en la clasificación de ${tenant.name}. Quiniela creada con QuinielaBOX.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website' },
  };
}

/**
 * Marco común de las pantallas del jugador (inicio, partidos, ranking, reglas):
 * tema del tenant, cabecera con la marca, navegación tipo PADELBOX (tabs arriba
 * en escritorio, barra inferior en móvil) y pie con patrocinadores + legal.
 */
export default async function JugarLayout({
  params,
  children,
}: {
  params: { tenant: string };
  children: React.ReactNode;
}) {
  const { tenant, isAdmin } = await loadTenantPlayer(params.tenant);

  const sponsors = await prisma.sponsor.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, logoUrl: true, url: true },
  });

  return (
    <main
      className="min-h-screen bg-bg pb-24 sm:pb-10"
      style={tenantThemeVars(tenant.accentColor)}
    >
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <header className="flex items-center gap-4">
          {tenant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-12 w-12 rounded-xl object-contain border border-line bg-bg-elev shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] uppercase tracking-[0.24em] font-bold"
              style={{ color: tenant.accentColor }}
            >
              Quiniela
            </p>
            <h1 className="font-display text-2xl sm:text-3xl truncate">{tenant.name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/mis-quinielas"
              title="Mis quinielas"
              className="h-9 px-3 rounded-lg border border-line text-xs flex items-center hover:bg-bg-elev"
            >
              Mis quinielas
            </Link>
            {isAdmin && (
              <Link
                href={`/saas/${tenant.slug}/panel`}
                className="h-9 px-3 rounded-lg border border-line text-xs flex items-center hover:bg-bg-elev"
              >
                Panel
              </Link>
            )}
            <form action={saasSignOut}>
              <button
                type="submit"
                className="h-9 px-3 rounded-lg border border-line text-xs text-muted hover:text-ink"
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        <TenantNav slug={tenant.slug} isAdmin={isAdmin} />

        {children}

        {sponsors.length > 0 && (
          <section className="pt-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted text-center mb-3">
              Patrocinadores
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {sponsors.map((s) => {
                const inner = s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt={s.name} className="h-8 object-contain" />
                ) : (
                  <span className="text-sm text-muted">{s.name}</span>
                );
                return s.url ? (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">
                    {inner}
                  </a>
                ) : (
                  <span key={s.id}>{inner}</span>
                );
              })}
            </div>
          </section>
        )}

        {showsAds(tenant.plan) && (
          <AdSlot
            slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TENANT}
            fallback={
              <a
                href="/"
                className="block rounded-xl border border-dashed border-line bg-bg-elev p-3 text-center text-xs text-muted hover:border-accent transition-colors"
              >
                Publicidad ·{' '}
                <span className="text-accent font-semibold">
                  Crea tu propia quiniela gratis en QuinielaBOX →
                </span>{' '}
                <span className="block mt-0.5">
                  ¿Organizas esta quiniela? El plan Pro quita los anuncios.
                </span>
              </a>
            }
          />
        )}

        {showsBranding(tenant.plan) && (
          <p className="text-[11px] text-muted text-center pt-4 border-t border-line">
            Powered by QuinielaBOX ·{' '}
            <a href="/" className="hover:text-accent">
              crea la tuya
            </a>
          </p>
        )}

        <SaasLegalFooter />
      </div>
    </main>
  );
}
