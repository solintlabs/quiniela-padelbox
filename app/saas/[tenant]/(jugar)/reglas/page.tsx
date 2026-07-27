import { describeRules, rulesOf } from '@/lib/saas/scoring';
import { loadTenantPlayer, loadActiveCompetition } from '@/lib/saas/playerView';
import { TenantRules } from '../../TenantRules';

export const dynamic = 'force-dynamic';

/** Reglas e inscripción de la quiniela + premios. */
export default async function ReglasPage({ params }: { params: { tenant: string } }) {
  const { tenant } = await loadTenantPlayer(params.tenant);
  const competition = await loadActiveCompetition(tenant.id);

  return (
    <div className="space-y-6">
      <TenantRules
        pointsSummary={competition ? describeRules(rulesOf(competition)) : []}
        championBonus={competition?.pointsBonus ?? 0}
        entryFee={tenant.entryFee}
        paymentInfo={tenant.paymentInfo}
        rulesText={tenant.rulesText}
      />

      {tenant.prizesText && (
        <section className="rounded-xl border border-line bg-bg-elev p-5">
          <h2 className="font-display text-lg mb-2">Premios</h2>
          <p className="text-sm whitespace-pre-line leading-relaxed">{tenant.prizesText}</p>
        </section>
      )}
    </div>
  );
}
