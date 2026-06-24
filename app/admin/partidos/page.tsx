import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompetitionToggleButton } from '@/components/CompetitionToggleButton';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';
import { calcPoints } from '@/lib/scoring';
import { syncMatchesFromApi, recomputeAll } from '@/lib/sync';
import { COMPETITIONS, getCompetitionById } from '@/lib/competitions';

export const dynamic = 'force-dynamic';

const STAGES = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] as const;
const STATUSES = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'] as const;

async function syncMatches() {
  'use server';
  await requireAdmin();
  // Invocacion directa: una fetch server-to-self no propaga la cookie de sesion
  // y requireAdminApi devolveria 401. Llamamos al helper del modulo igual que
  // hace la ruta /api/admin/sync-matches.
  try {
    await syncMatchesFromApi();
  } catch (e) {
    console.error('[admin/partidos] sync fallo:', e instanceof Error ? e.message : e);
  }
  revalidatePath('/admin/partidos');
}

async function recompute() {
  'use server';
  await requireAdmin();
  try {
    await recomputeAll();
  } catch (e) {
    console.error('[admin/partidos] recompute fallo:', e instanceof Error ? e.message : e);
  }
  revalidatePath('/admin/partidos');
}

async function toggleSync() {
  'use server';
  await requireAdmin();
  const cur = await prisma.rules.findUnique({ where: { id: 1 } });
  await prisma.rules.upsert({
    where: { id: 1 },
    update: { syncPaused: !cur?.syncPaused },
    create: { id: 1, syncPaused: true },
  });
  revalidatePath('/admin/partidos');
}

async function updateScore(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const homeScore = parseInt(String(formData.get('homeScore') ?? ''), 10);
  const awayScore = parseInt(String(formData.get('awayScore') ?? ''), 10);
  const status = String(formData.get('status') ?? 'FINISHED') as typeof STATUSES[number];
  // Marcar como resultado manual (90 min): el sync de ESPN no lo sobrescribirá.
  const manualResult = formData.get('manualResult') === 'on';
  if (!id || !Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return;

  const rules = await prisma.rules.findUnique({ where: { id: 1 } });
  const pointsExact = rules?.pointsExact ?? 3;
  const pointsWinner = rules?.pointsWinner ?? 1;

  await prisma.match.update({
    where: { id },
    data: {
      homeScore,
      awayScore,
      status,
      manualResult,
      ...(status === 'FINISHED' ? { scoredAt: new Date() } : {}),
    },
  });

  if (status === 'FINISHED') {
    const preds = await prisma.prediction.findMany({ where: { matchId: id } });
    for (const p of preds) {
      const points = calcPoints(
        { homeScore: p.homeScore, awayScore: p.awayScore },
        { homeScore, awayScore },
        { pointsExact, pointsWinner },
      );
      await prisma.prediction.update({ where: { id: p.id }, data: { points } });
    }
  }
  revalidatePath('/admin/partidos');
}

async function updateMatchFull(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const homeTeam = String(formData.get('homeTeam') ?? '').trim();
  const awayTeam = String(formData.get('awayTeam') ?? '').trim();
  const kickoffStr = String(formData.get('kickoff') ?? '');
  const group = String(formData.get('group') ?? '').trim() || null;
  const stage = String(formData.get('stage') ?? 'GROUP') as typeof STAGES[number];
  if (!id || !homeTeam || !awayTeam || !kickoffStr) return;

  await prisma.match.update({
    where: { id },
    data: {
      homeTeam,
      awayTeam,
      kickoff: new Date(kickoffStr),
      group,
      stage,
    },
  });
  revalidatePath('/admin/partidos');
}

async function createMatch(formData: FormData) {
  'use server';
  await requireAdmin();
  const homeTeam = String(formData.get('homeTeam') ?? '').trim();
  const awayTeam = String(formData.get('awayTeam') ?? '').trim();
  const kickoffStr = String(formData.get('kickoff') ?? '');
  const group = String(formData.get('group') ?? '').trim() || null;
  const stage = String(formData.get('stage') ?? 'GROUP') as typeof STAGES[number];
  if (!homeTeam || !awayTeam || !kickoffStr) return;

  // Usa un externalId negativo para no chocar con IDs de ESPN (siempre positivos).
  const externalId = -Date.now();

  await prisma.match.create({
    data: {
      externalId,
      homeTeam,
      awayTeam,
      kickoff: new Date(kickoffStr),
      group,
      stage,
      status: 'SCHEDULED',
    },
  });
  revalidatePath('/admin/partidos');
}

/**
 * Toggle de una competición entera: marca todos sus matches como excluidos
 * (o reactiva) y anula los points de sus predicciones cuando se desactiva.
 *
 * Recibe el id de la competición tal y como esta en COMPETITIONS, y el modo
 * 'disable' o 'enable'. Si se desactiva: excludeFromScoring=true en todos los
 * matches de esos groups, y points=null en sus predicciones. Si se reactiva:
 * excludeFromScoring=false (los puntos hay que recalcular manualmente con
 * "Recalcular puntos" para que vuelvan a salir).
 */
async function toggleCompetition(competitionId: string, mode: 'disable' | 'enable') {
  'use server';
  await requireAdmin();

  const comp = getCompetitionById(competitionId);
  if (!comp) throw new Error('Competición desconocida');

  const exclude = mode === 'disable';

  await prisma.match.updateMany({
    where: { group: { in: [...comp.groups] } },
    data: { excludeFromScoring: exclude },
  });

  // Si la desactivamos, anulamos puntos para que no contaminen el ranking
  if (exclude) {
    await prisma.prediction.updateMany({
      where: { match: { group: { in: [...comp.groups] } } },
      data: { points: null },
    });
  }

  revalidatePath('/admin/partidos');
  revalidatePath('/');
  revalidatePath('/ranking');
}

async function deleteMatch(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.prediction.deleteMany({ where: { matchId: id } });
  await prisma.match.delete({ where: { id } });
  revalidatePath('/admin/partidos');
}

function toDatetimeLocal(d: Date): string {
  // YYYY-MM-DDTHH:mm en hora local del servidor.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MUNDIAL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

/** Construye el filtro de la lista segun la pestaña elegida. */
function buildMatchFilter(filtro: string): import('@prisma/client').Prisma.MatchWhereInput {
  if (filtro === 'liga') return { group: 'LIGA' };
  if (filtro === 'grupos') return { stage: 'GROUP', group: { in: MUNDIAL_GROUPS } };
  if (['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'].includes(filtro)) {
    return { stage: filtro as typeof STAGES[number] };
  }
  return {}; // todos
}

export default async function PartidosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const sp = await searchParams;
  const filtro = sp.filtro ?? 'todos';
  const matchFilter = buildMatchFilter(filtro);

  const [matches, rules, stageGroups, ligaCount] = await Promise.all([
    prisma.match.findMany({
      where: matchFilter,
      orderBy: { kickoff: 'asc' },
      take: 250,
      include: { _count: { select: { predictions: true } } },
    }),
    prisma.rules.findUnique({ where: { id: 1 } }),
    // Conteos por etapa del Mundial (para las pestañas) — excluye LIGA.
    prisma.match.groupBy({ by: ['stage'], where: { group: { not: 'LIGA' } }, _count: { _all: true } }),
    prisma.match.count({ where: { group: 'LIGA' } }),
  ]);
  const syncPaused = rules?.syncPaused ?? false;

  const countByStage = new Map(stageGroups.map((g) => [g.stage, g._count._all]));
  const gruposCount = countByStage.get('GROUP') ?? 0;
  // Para "grupos" hay que restar los de LIGA (tambien son stage GROUP).
  const mundialGruposCount = gruposCount - ligaCount;
  const stageTabs: Array<{ key: string; label: string; count: number }> = [
    { key: 'grupos', label: 'Grupos', count: mundialGruposCount },
    { key: 'R32', label: '1/16', count: countByStage.get('R32') ?? 0 },
    { key: 'R16', label: 'Octavos', count: countByStage.get('R16') ?? 0 },
    { key: 'QF', label: 'Cuartos', count: countByStage.get('QF') ?? 0 },
    { key: 'SF', label: 'Semis', count: countByStage.get('SF') ?? 0 },
    { key: 'THIRD', label: '3er puesto', count: countByStage.get('THIRD') ?? 0 },
    { key: 'FINAL', label: 'Final', count: countByStage.get('FINAL') ?? 0 },
  ].filter((t) => t.count > 0);

  // Stats por competición (para el panel de toggle)
  const compStats = await Promise.all(
    COMPETITIONS.map(async (c) => {
      const total = await prisma.match.count({ where: { group: { in: [...c.groups] } } });
      if (total === 0) return null; // si no hay matches, no mostramos esta comp
      const excluded = await prisma.match.count({
        where: { group: { in: [...c.groups] }, excludeFromScoring: true },
      });
      const predsWithPoints = await prisma.prediction.count({
        where: { points: { not: null }, match: { group: { in: [...c.groups] } } },
      });
      return {
        comp: c,
        total,
        excluded,
        active: total - excluded,
        predsWithPoints,
        currentMode: excluded === total ? ('disabled' as const) : ('active' as const),
      };
    }),
  ).then((arr) => arr.filter((x): x is NonNullable<typeof x> => x !== null));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Partidos</h1>
          <p className="text-sm text-muted mt-1">
            {filtro === 'todos'
              ? `${matches.length} en base de datos · sincroniza con ESPN o gestiona a mano.`
              : `${matches.length} en este filtro · sincroniza con ESPN o gestiona a mano.`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/api/cuadro/blank"
            className="inline-flex items-center h-10 px-4 rounded-lg border border-line hover:bg-bg-elev text-sm"
            title="Plantilla en blanco para rellenar a mano"
          >
            📄 Hoja en blanco
          </a>
          <form action={syncMatches}>
            <Button disabled={syncPaused} title={syncPaused ? 'Sync pausado — reactivalo abajo' : ''}>
              Sincronizar ESPN
            </Button>
          </form>
          <form action={recompute}>
            <Button variant="secondary">Recalcular puntos</Button>
          </form>
        </div>
      </header>

      {/* Toggle modo manual */}
      <section
        className={
          'rounded-xl border p-4 flex items-center justify-between gap-3 flex-wrap ' +
          (syncPaused
            ? 'border-warning/60 bg-warning/15'
            : 'border-line bg-bg-elev')
        }
      >
        <div>
          <p className="font-semibold">
            {syncPaused ? '⏸  Modo manual ACTIVO' : '🔄  Sync automático con ESPN'}
          </p>
          <p className="text-xs text-muted mt-1">
            {syncPaused
              ? 'El cron NO va a tocar la DB hasta que reactives el sync. Edita partidos y resultados a mano.'
              : 'El cron sincroniza cada 10min con ESPN. Si la API cae, pulsa pausar para gestionar a mano.'}
          </p>
        </div>
        <form action={toggleSync}>
          <Button variant={syncPaused ? 'primary' : 'secondary'} size="sm">
            {syncPaused ? 'Reanudar sync' : 'Pausar sync (modo manual)'}
          </Button>
        </form>
      </section>

      {/* Competiciones: cada una se puede activar/desactivar independientemente */}
      {compStats.length > 0 && (
        <section className="rounded-xl border border-line bg-bg-elev p-4 space-y-3">
          <div>
            <p className="font-semibold">🏆 Competiciones</p>
            <p className="text-xs text-muted mt-1">
              Cada competición se puede desactivar (no entra en el ranking ni en el scoring) o reactivar.
              Las predicciones se conservan siempre — solo se anulan los puntos al desactivar.
            </p>
          </div>
          <div className="space-y-2">
            {compStats.map((cs) => {
              const isDisabled = cs.currentMode === 'disabled';
              return (
                <div
                  key={cs.comp.id}
                  className={
                    'rounded-md border p-3 flex items-start gap-3 flex-wrap justify-between ' +
                    (isDisabled ? 'border-warning/40 bg-warning/5' : 'border-line bg-bg')
                  }
                >
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-sm flex items-center gap-2">
                      {cs.comp.label}
                      {isDisabled && (
                        <span className="text-[10px] uppercase tracking-wider text-warning px-1.5 py-0.5 rounded bg-warning/15 border border-warning/30">
                          Desactivada
                        </span>
                      )}
                    </p>
                    {cs.comp.description && (
                      <p className="text-[11px] text-muted mt-0.5">{cs.comp.description}</p>
                    )}
                    <p className="text-[11px] text-muted mt-1 tabular-nums">
                      {cs.total} partidos
                      {!isDisabled && cs.predsWithPoints > 0 && (
                        <> · {cs.predsWithPoints} predicciones con puntos</>
                      )}
                    </p>
                  </div>
                  <CompetitionToggleButton
                    competitionId={cs.comp.id}
                    competitionLabel={cs.comp.label}
                    mode={isDisabled ? 'enable' : 'disable'}
                    matchesCount={cs.total}
                    predictionsWithPointsCount={cs.predsWithPoints}
                    toggleAction={toggleCompetition}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Crear partido manual */}
      <details className="rounded-xl border border-line bg-bg-elev">
        <summary className="cursor-pointer px-5 py-4 font-semibold">
          ➕ Crear partido manual
        </summary>
        <form action={createMatch} className="p-5 pt-0 grid sm:grid-cols-2 gap-3">
          <Field label="Equipo local *">
            <Input name="homeTeam" required maxLength={60} placeholder="ej. Argentina" />
          </Field>
          <Field label="Equipo visitante *">
            <Input name="awayTeam" required maxLength={60} placeholder="ej. Brazil" />
          </Field>
          <Field label="Kickoff (hora local) *">
            <Input name="kickoff" type="datetime-local" required />
          </Field>
          <Field label="Grupo (A-L) o LIGA">
            <Input name="group" maxLength={4} placeholder="A" />
          </Field>
          <Field label="Stage">
            <select name="stage" defaultValue="GROUP" className="h-11 w-full bg-bg border border-line rounded-md px-3 text-sm text-ink">
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s] ?? s}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit">Crear partido</Button>
          </div>
        </form>
      </details>

      <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <strong>Editor manual:</strong> introduce marcadores y status; al pulsar
        <em> Finalizado</em> se recalculan los puntos. Para cambiar equipos, hora o
        grupo expande el panel ⚙️ de cada partido.
      </div>

      {/* Filtro por competición / etapa */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-muted mr-1">Filtrar:</span>
        <FiltroTab filtro="todos" actual={filtro} label="Todos" />
        {stageTabs.map((t) => (
          <FiltroTab key={t.key} filtro={t.key} actual={filtro} label={`${t.label} (${t.count})`} />
        ))}
        {ligaCount > 0 && <FiltroTab filtro="liga" actual={filtro} label={`Liga (${ligaCount})`} />}
      </div>

      {/* Lista de partidos */}
      <div className="space-y-2">
        {matches.map((m) => (
          <div key={m.id} className="rounded-xl border border-line bg-bg-elev">
            <form action={updateScore} className="p-3 sm:p-4 flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={m.id} />

              <div className="flex-1 min-w-[200px]">
                <p className="text-xs text-muted">
                  {formatDateTime(m.kickoff)} ·{' '}
                  {m.group === 'LIGA'
                    ? 'La Liga'
                    : m.stage === 'GROUP' && m.group
                      ? `Grupo ${m.group}`
                      : STAGE_LABEL[m.stage] ?? m.stage}
                  {m.externalId < 0 && <span className="ml-2 text-warning">· manual</span>}
                  {m._count.predictions > 0 && (
                    <span className="ml-2 text-accent">· {m._count.predictions} pred.</span>
                  )}
                </p>
                <p className="font-semibold text-sm mt-0.5 truncate">
                  {m.homeTeam} <span className="text-muted">vs</span> {m.awayTeam}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Input type="number" name="homeScore" defaultValue={m.homeScore ?? ''} min={0} max={20} placeholder="–" className="w-14 h-9 text-center" />
                <span className="text-muted">–</span>
                <Input type="number" name="awayScore" defaultValue={m.awayScore ?? ''} min={0} max={20} placeholder="–" className="w-14 h-9 text-center" />
              </div>

              <select
                name="status"
                defaultValue={m.status}
                className="h-9 bg-bg border border-line rounded-md text-xs px-2 text-ink"
              >
                <option value="SCHEDULED">Programado</option>
                <option value="LIVE">En juego</option>
                <option value="FINISHED">Finalizado</option>
                <option value="POSTPONED">Aplazado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>

              {/* Resultado manual (90 min) — el sync de ESPN no lo sobrescribe.
                  Útil en eliminatorias con prórroga/penales. */}
              <label className="flex items-center gap-1.5 text-[11px] text-muted" title="No dejar que ESPN sobrescriba este resultado (para 90 min en eliminatorias)">
                <input type="checkbox" name="manualResult" defaultChecked={m.manualResult} className="h-3.5 w-3.5" />
                Manual (90&apos;)
                {m.manualResult && <span className="text-warning">🔒</span>}
              </label>

              <Button type="submit" size="sm">Guardar</Button>
            </form>

            {/* Panel avanzado: editar equipos, hora, grupo, stage + borrar */}
            <details className="border-t border-line">
              <summary className="cursor-pointer px-4 py-2 text-xs text-muted hover:text-ink">
                ⚙️ Editar datos del partido (equipos, hora, grupo)
              </summary>
              <div className="p-4 grid sm:grid-cols-2 gap-3">
                <form action={updateMatchFull} className="contents">
                  <input type="hidden" name="id" value={m.id} />
                  <Field label="Equipo local">
                    <Input name="homeTeam" defaultValue={m.homeTeam} required maxLength={60} />
                  </Field>
                  <Field label="Equipo visitante">
                    <Input name="awayTeam" defaultValue={m.awayTeam} required maxLength={60} />
                  </Field>
                  <Field label="Kickoff">
                    <Input name="kickoff" type="datetime-local" defaultValue={toDatetimeLocal(m.kickoff)} required />
                  </Field>
                  <Field label="Grupo">
                    <Input name="group" defaultValue={m.group ?? ''} maxLength={4} />
                  </Field>
                  <Field label="Stage">
                    <select name="stage" defaultValue={m.stage} className="h-11 w-full bg-bg border border-line rounded-md px-3 text-sm text-ink">
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{STAGE_LABEL[s] ?? s}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="sm:col-span-2 flex justify-between items-center gap-3">
                    <Button type="submit" size="sm">Guardar cambios</Button>
                  </div>
                </form>
                <form action={deleteMatch} className="sm:col-span-2 flex justify-end">
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="text-xs text-danger hover:bg-danger/10 px-3 py-1.5 rounded-md border border-danger/40"
                  >
                    🗑 Borrar partido y sus {m._count.predictions} predicciones
                  </button>
                </form>
              </div>
            </details>
          </div>
        ))}
        {matches.length === 0 && (
          <div className="rounded-xl border border-line bg-bg-elev py-8 text-center text-muted">
            {filtro === 'todos'
              ? <>Aún no hay partidos. Pulsa <em>Sincronizar ESPN</em> o crea uno manual arriba.</>
              : 'No hay partidos en este filtro.'}
          </div>
        )}
      </div>
    </div>
  );
}

function FiltroTab({ filtro, actual, label }: { filtro: string; actual: string; label: string }) {
  const href = filtro === 'todos' ? '/admin/partidos' : `/admin/partidos?filtro=${filtro}`;
  const active = actual === filtro;
  return (
    <a
      href={href}
      className={
        'text-xs px-2.5 py-1.5 rounded-md border transition-colors ' +
        (active
          ? 'border-accent bg-accent/15 text-accent font-semibold'
          : 'border-line text-muted hover:text-ink hover:bg-bg-elev')
      }
    >
      {label}
    </a>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-[0.18em] text-muted">{label}</label>
      {children}
    </div>
  );
}
