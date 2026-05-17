import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime, STAGE_LABEL } from '@/lib/format';
import { calcPoints } from '@/lib/scoring';
import { syncMatchesFromApi, recomputeAll } from '@/lib/sync';

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

export default async function PartidosAdmin() {
  const [matches, rules] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: 'asc' },
      take: 250,
      include: { _count: { select: { predictions: true } } },
    }),
    prisma.rules.findUnique({ where: { id: 1 } }),
  ]);
  const syncPaused = rules?.syncPaused ?? false;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Partidos</h1>
          <p className="text-sm text-muted mt-1">
            {matches.length} en base de datos · sincroniza con ESPN o gestiona a mano.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
            Aún no hay partidos. Pulsa <em>Sincronizar ESPN</em> o crea uno manual arriba.
          </div>
        )}
      </div>
    </div>
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
