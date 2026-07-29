import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { isSaasEnabled } from '@/lib/saas/flags';
import { resolveTenant } from '@/lib/saas/tenant';
import { tenantThemeVars } from '@/lib/saas/theme';
import { showsBranding } from '@/lib/saas/plans';
import { SaasLegalFooter } from '@/components/SaasLegalFooter';
import { PaymentMethods, type PlayerPaymentMethod } from '../PaymentMethods';

/**
 * Inscripción pública de una quiniela — la única página del tenant SIN login.
 *
 * Existe para la app móvil: Apple no permite mostrar dentro de la app cómo
 * pagar un bote en dinero real, así que la app enlaza aquí. El jugador llega
 * desde el botón "Cómo pagar tu inscripción" y ve la cuota y los métodos de
 * cobro que su organizador configuró en el panel, sin tener que iniciar
 * sesión en el navegador.
 *
 * noindex: es pública para quien tenga la URL, pero contiene datos de cobro
 * del organizador — no debe aparecer en buscadores.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { tenant: string };
}): Promise<Metadata> {
  if (!isSaasEnabled()) return {};
  const tenant = await resolveTenant(params.tenant);
  if (!tenant) return {};
  return {
    title: `Inscripción · ${tenant.name}`,
    description: `Cuota y métodos de pago para participar en la quiniela de ${tenant.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function InscripcionPublicaPage({
  params,
}: {
  params: { tenant: string };
}) {
  if (!isSaasEnabled()) notFound();
  const tenant = await resolveTenant(params.tenant);
  if (!tenant) notFound();

  const methodRows = await prisma.paymentMethod.findMany({
    where: { tenantId: tenant.id, enabled: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, title: true, subtitle: true, icon: true, fields: true },
  });
  const methods: PlayerPaymentMethod[] = methodRows.map((m) => ({
    id: m.id,
    title: m.title,
    subtitle: m.subtitle,
    icon: m.icon,
    fields: Array.isArray(m.fields)
      ? (m.fields as Array<{ label: string; value: string; mono?: boolean }>)
      : [],
  }));

  return (
    <div style={tenantThemeVars(tenant.accentColor)} className="min-h-dvh">
      <main className="max-w-xl mx-auto px-5 py-10 space-y-6">
        <header className="text-center space-y-3">
          {tenant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-14 w-14 rounded-xl object-contain mx-auto"
            />
          )}
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Inscripción</p>
          <h1 className="font-display text-3xl">{tenant.name}</h1>
        </header>

        {tenant.entryFee && (
          <section className="rounded-xl border border-line bg-bg-elev p-6 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Cuota de inscripción</p>
            <p className="font-display text-4xl mt-2 tabular-nums">{tenant.entryFee}</p>
          </section>
        )}

        {tenant.paymentInfo && (
          <section className="rounded-xl border border-line bg-bg-elev p-5">
            <h2 className="font-display text-lg mb-2">Cómo pagar</h2>
            <p className="text-sm whitespace-pre-line leading-relaxed">{tenant.paymentInfo}</p>
          </section>
        )}

        <PaymentMethods methods={methods} />

        {!tenant.entryFee && !tenant.paymentInfo && methods.length === 0 && (
          <section className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-sm text-muted">
              El organizador aún no ha configurado la inscripción. Pregúntale directamente cómo
              participar.
            </p>
          </section>
        )}

        <Link
          href={`/saas/${tenant.slug}`}
          className="flex items-center justify-center h-12 rounded-xl bg-accent text-accent-fg font-display text-base"
        >
          Abrir la quiniela →
        </Link>

        {showsBranding(tenant.plan) ? (
          <SaasLegalFooter />
        ) : (
          <p className="text-[11px] text-muted text-center pt-4">
            <Link href="/soporte" className="hover:underline">
              Soporte
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
