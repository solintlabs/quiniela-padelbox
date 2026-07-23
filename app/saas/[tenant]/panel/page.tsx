import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireTenantRolePage } from '@/lib/saas/permissions';
import { competitionScope, membershipScope } from '@/lib/saas/scope';
import { describeRules, rulesOf } from '@/lib/saas/scoring';
import { PLANS, limitsFor } from '@/lib/saas/plans';
import { formatDateTime } from '@/lib/format';
import { UpgradeButton } from './UpgradeButton';
import { SyncButton } from './SyncButton';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Panel del organizador. Todo lo que ve sale de consultas scopeadas a SU
 * tenant: no hay ninguna consulta sin `where` de tenant en esta página.
 */
export default async function PanelPage({
  params,
  searchParams,
}: {
  params: { tenant: string };
  searchParams: { nueva?: string; aviso?: string; upgraded?: string };
}) {
  const ctx = await requireTenantRolePage(params.tenant, 'ADMIN');
  const { tenant } = ctx;
  const isOwner = ctx.membership.role === 'OWNER';

  const [competitions, players, paidCount] = await Promise.all([
    prisma.saasCompetition.findMany({
      where: competitionScope(tenant.id),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { fixtures: true, teams: true } } },
    }),
    prisma.saasMembership.count({ where: membershipScope(tenant.id) }),
    prisma.saasMembership.count({ where: membershipScope(tenant.id, { hasPaid: true }) }),
  ]);

  const plan = PLANS[tenant.plan];
  const limits = limitsFor(tenant.plan);
  const inviteUrl = `/saas/${tenant.slug}/unirse`;

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] font-bold" style={{ color: tenant.accentColor }}>
              {tenant.name}
            </p>
            <h1 className="font-display text-3xl mt-1">Panel del organizador</h1>
            <p className="text-sm text-muted mt-1">
              Plan {plan.name} · {tenant.status === 'TRIAL' ? 'en prueba' : tenant.status.toLowerCase()}
            </p>
          </div>
          <Link
            href={`/saas/${tenant.slug}`}
            className="h-10 px-4 rounded-lg border border-line text-sm flex items-center"
          >
            Ver como jugador →
          </Link>
        </header>

        {searchParams.upgraded && (
          <p className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
            ¡Listo! Tu plan <strong>Pro</strong> está activo. Ya tienes más jugadores,
            más competencias y sin anuncios.
          </p>
        )}
        {isOwner && tenant.plan === 'FREE' && (
          <section className="rounded-2xl border border-accent/40 bg-accent/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">Plan Pro</p>
            <h2 className="font-display text-xl mt-1">Sube a Pro cuando tu quiniela crezca</h2>
            <p className="text-sm text-muted mt-1 mb-4">
              Hasta 500 jugadores, 5 competencias a la vez, catálogo de 221 ligas y sin anuncios
              para tus jugadores. $9/mes, se paga aquí en la web.
            </p>
            <UpgradeButton slug={tenant.slug} />
          </section>
        )}
        {searchParams.nueva && (
          <p className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
            Tu quiniela está creada. Comparte el enlace de invitación y empieza a
            apuntar gente.
          </p>
        )}
        {searchParams.aviso && (
          <p className="rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-danger">
            {searchParams.aviso}
          </p>
        )}

        <section className="grid grid-cols-3 gap-3">
          <Stat label="Jugadores" value={`${players}${limits.maxPlayers === Infinity ? '' : ` / ${limits.maxPlayers}`}`} />
          <Stat label="Inscripción pagada" value={String(paidCount)} />
          <Stat label="Competiciones" value={String(competitions.length)} />
        </section>

        <section className="rounded-xl border border-line bg-bg-elev p-5">
          <h2 className="font-display text-lg">Invita a tus jugadores</h2>
          <p className="text-sm text-muted mt-1">
            Comparte este enlace por WhatsApp. Quien entre queda apuntado, y tú
            confirmas quién ha pagado el bote.
          </p>
          <code className="mt-3 block rounded-lg bg-bg border border-line px-3 py-2.5 text-sm font-mono break-all">
            {inviteUrl}
          </code>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Competiciones</h2>
            <span className="text-xs text-muted">
              {competitions.length} de {limits.maxCompetitions === Infinity ? '∞' : limits.maxCompetitions}
            </span>
          </div>

          {competitions.length === 0 ? (
            <p className="text-sm text-muted rounded-xl border border-line p-5">
              Aún no has creado ninguna competición.
            </p>
          ) : (
            competitions.map((c) => (
              <article key={c.id} className="rounded-xl border border-line bg-bg-elev p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      {c.provider === 'ESPN' ? `Catálogo · ${c.espnSlug}` : 'Manual'} ·{' '}
                      {c._count.teams} equipos · {c._count.fixtures} partidos
                    </p>
                    {c.lastSyncedAt && (
                      <p className="text-[11px] text-muted mt-0.5">
                        Última sincronización: {formatDateTime(c.lastSyncedAt)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-line">
                    {c.status}
                  </span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {describeRules(rulesOf(c)).map((line) => (
                    <li key={line} className="text-xs rounded-full border border-line px-2.5 py-1 text-muted">
                      {line}
                    </li>
                  ))}
                </ul>
                {c.provider === 'ESPN' && <SyncButton slug={tenant.slug} competitionId={c.id} />}
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="font-display text-2xl mt-1 tabular-nums">{value}</p>
    </div>
  );
}
