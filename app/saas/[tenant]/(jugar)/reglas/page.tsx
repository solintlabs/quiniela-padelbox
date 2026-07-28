import { prisma } from '@/lib/db';
import { describeRules, rulesOf } from '@/lib/saas/scoring';
import { loadTenantPlayer, loadActiveCompetition } from '@/lib/saas/playerView';
import { TenantRules } from '../../TenantRules';
import { PaymentMethods, type PlayerPaymentMethod } from '../../PaymentMethods';

export const dynamic = 'force-dynamic';

/** Reglas e inscripción de la quiniela + cómo pagar + premios. */
export default async function ReglasPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await loadTenantPlayer(params.tenant);
  const [competition, methodRows] = await Promise.all([
    loadActiveCompetition(tenant.id),
    prisma.paymentMethod.findMany({
      where: { tenantId: tenant.id, enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, subtitle: true, icon: true, fields: true },
    }),
  ]);

  // `fields` es Json en el schema: se normaliza a la forma que espera la UI.
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
    <div className="space-y-6">
      <TenantRules
        pointsSummary={competition ? describeRules(rulesOf(competition)) : []}
        championBonus={competition?.pointsBonus ?? 0}
        entryFee={tenant.entryFee}
        paymentInfo={tenant.paymentInfo}
        rulesText={tenant.rulesText}
      />

      <PaymentMethods methods={methods} />

      {tenant.prizesText && (
        <section className="rounded-xl border border-line bg-bg-elev p-5">
          <h2 className="font-display text-lg mb-2">Premios</h2>
          <p className="text-sm whitespace-pre-line leading-relaxed">{tenant.prizesText}</p>
        </section>
      )}
    </div>
  );
}
