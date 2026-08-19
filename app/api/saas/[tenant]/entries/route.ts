import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';
import { requireTenantMemberApi } from '@/lib/saas/permissions';
import { entryScope, fixtureScope } from '@/lib/saas/scope';
import { canSubmitEntry } from '@/lib/saas/scoring';
import { hasAtLeastRole } from '@/lib/saas/roles';

/**
 * Pronósticos del jugador que hace la petición.
 *   GET  — los suyos en una competición
 *   POST — guardar/actualizar uno
 *
 * Un jugador solo puede tocar SUS pronósticos: el membershipId sale del
 * contexto autenticado, nunca del body. Aunque mande otro, se ignora.
 */
export const dynamic = 'force-dynamic';

const MAX_GOALS = 20;

const submitSchema = z.object({
  fixtureId: z.string().min(1),
  homeScore: z.number().int().min(0).max(MAX_GOALS),
  awayScore: z.number().int().min(0).max(MAX_GOALS),
});

export async function GET(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantMemberApi(params.tenant, req);
  if (ctx instanceof Response) return ctx;

  const competitionId = new URL(req.url).searchParams.get('competitionId');
  if (!competitionId) {
    return Response.json({ error: 'Falta competitionId.' }, { status: 400 });
  }

  const entries = await prisma.saasEntry.findMany({
    where: entryScope(ctx.tenant.id, {
      membershipId: ctx.membership.id,
      fixture: { competitionId },
    }),
    select: { id: true, fixtureId: true, homeScore: true, awayScore: true, points: true },
  });

  return Response.json({ entries });
}

export async function POST(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantMemberApi(params.tenant, req);
  if (ctx instanceof Response) return ctx;

  // Generoso para jugar (una jornada entera de golpe cabe), corta el spam.
  const rl = await rateLimit(`saas-entry:${ctx.userId}`, 60, 60);
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  // Con cuota: sin pagar la entrada al bote no se pronostica (lo marca el
  // organizador a mano; el dinero nunca pasa por la app). SIN cuota la
  // quiniela es "por diversión" y juega todo el mundo. El organizador
  // (ADMIN/OWNER) siempre puede — no se paga a sí mismo.
  if (
    ctx.tenant.entryFee &&
    !ctx.membership.hasPaid &&
    !hasAtLeastRole(ctx.membership.role, 'ADMIN')
  ) {
    return Response.json(
      {
        error: 'Inscripción pendiente',
        message: 'El organizador aún no ha confirmado tu inscripción.',
      },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }
  const { fixtureId, homeScore, awayScore } = parsed.data;

  // El partido tiene que ser de ESTE tenant: si no, un jugador podría
  // pronosticar en la quiniela de otro comercio conociendo un id.
  const fixture = await prisma.saasFixture.findFirst({
    where: fixtureScope(ctx.tenant.id, { id: fixtureId }),
    select: {
      id: true,
      kickoff: true,
      lockedAt: true,
      status: true,
      competition: { select: { id: true, status: true, lockOffsetMin: true } },
    },
  });
  if (!fixture) return Response.json({ error: 'Partido no encontrado.' }, { status: 404 });

  if (fixture.competition.status !== 'OPEN') {
    return Response.json(
      { error: 'La competición no admite pronósticos ahora mismo.' },
      { status: 409 },
    );
  }

  const gate = canSubmitEntry(fixture, fixture.competition.lockOffsetMin, new Date());
  if (!gate.allowed) {
    return Response.json(
      {
        error:
          gate.reason === 'started'
            ? 'El partido ya ha empezado.'
            : 'Los pronósticos de este partido ya están cerrados.',
      },
      { status: 409 },
    );
  }

  const entry = await prisma.saasEntry.upsert({
    where: {
      membershipId_fixtureId: { membershipId: ctx.membership.id, fixtureId: fixture.id },
    },
    create: {
      membershipId: ctx.membership.id,
      fixtureId: fixture.id,
      homeScore,
      awayScore,
    },
    // Al cambiar el pronóstico se limpian los puntos: si ya los tuviera por
    // un recálculo, quedarían desfasados respecto al nuevo marcador.
    update: { homeScore, awayScore, points: null },
    select: { id: true, fixtureId: true, homeScore: true, awayScore: true },
  });

  return Response.json({ ok: true, entry });
}
