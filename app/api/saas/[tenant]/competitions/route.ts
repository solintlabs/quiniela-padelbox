import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';
import { competitionScope } from '@/lib/saas/scope';
import { canAddCompetition, canUseEspnCatalog } from '@/lib/saas/plans';
import { isKnownLeague } from '@/lib/saas/providers/espn';
import { importCompetitionFixtures } from '@/lib/saas/sync';

/**
 * Competiciones de un tenant.
 *   GET  — las suyas (cualquier miembro)
 *   POST — crear una (ADMIN u OWNER)
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const pointsSchema = z.number().int().min(0).max(100);

const createSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    provider: z.enum(['ESPN', 'MANUAL']).default('MANUAL'),
    espnSlug: z.string().trim().max(60).optional(),
    season: z.string().trim().max(20).optional(),
    format: z.enum(['LEAGUE', 'GROUPS_KO', 'KO', 'CUSTOM']).default('LEAGUE'),
    pointsExact: pointsSchema.default(3),
    pointsWinner: pointsSchema.default(1),
    pointsGoalDiff: pointsSchema.default(0),
    pointsTeamScore: pointsSchema.default(0),
    pointsDrawBonus: pointsSchema.default(0),
    lockOffsetMin: z.number().int().min(0).max(1440).default(15),
    /** Rango a importar de ESPN. Si falta, se crea vacía. */
    importFrom: z.string().datetime().optional(),
    importTo: z.string().datetime().optional(),
  })
  .refine((v) => v.provider !== 'ESPN' || !!v.espnSlug, {
    message: 'Elige una liga del catálogo.',
    path: ['espnSlug'],
  })
  .refine((v) => v.pointsExact >= v.pointsWinner, {
    message: 'El marcador exacto no puede valer menos que acertar el ganador.',
    path: ['pointsExact'],
  });

export async function GET(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'PLAYER', req);
  if (ctx instanceof Response) return ctx;

  const competitions = await prisma.saasCompetition.findMany({
    where: competitionScope(ctx.tenant.id),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, status: true, provider: true, espnSlug: true,
      format: true, lastSyncedAt: true,
      pointsExact: true, pointsWinner: true, pointsGoalDiff: true,
      pointsTeamScore: true, pointsDrawBonus: true, lockOffsetMin: true,
      _count: { select: { fixtures: true, teams: true } },
    },
  });

  return Response.json({ competitions });
}

export async function POST(
  req: Request,
  { params }: { params: { tenant: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Límites del plan, antes de escribir nada.
  const currentCount = await prisma.saasCompetition.count({
    where: competitionScope(ctx.tenant.id),
  });
  const countGate = canAddCompetition(ctx.tenant.plan, currentCount);
  if (!countGate.allowed) {
    return Response.json({ error: countGate.message, reason: countGate.reason }, { status: 402 });
  }

  if (data.provider === 'ESPN') {
    const espnGate = canUseEspnCatalog(ctx.tenant.plan);
    if (!espnGate.allowed) {
      return Response.json({ error: espnGate.message, reason: espnGate.reason }, { status: 402 });
    }
    // Que el slug exista de verdad: guardar uno inventado dejaría la
    // competición sin sincronizar para siempre y sin explicación.
    if (!(await isKnownLeague(data.espnSlug!))) {
      return Response.json(
        { error: `La liga "${data.espnSlug}" no existe en el catálogo.` },
        { status: 400 },
      );
    }
  }

  const competition = await prisma.saasCompetition.create({
    data: {
      tenantId: ctx.tenant.id,
      name: data.name,
      provider: data.provider,
      espnSlug: data.provider === 'ESPN' ? data.espnSlug : null,
      season: data.season ?? null,
      format: data.format,
      // Abierta desde el minuto uno: acepta pronósticos y entra en el sync.
      // El organizador puede cerrarla luego desde el panel si quiere.
      status: 'OPEN',
      pointsExact: data.pointsExact,
      pointsWinner: data.pointsWinner,
      pointsGoalDiff: data.pointsGoalDiff,
      pointsTeamScore: data.pointsTeamScore,
      pointsDrawBonus: data.pointsDrawBonus,
      lockOffsetMin: data.lockOffsetMin,
    },
  });

  // Import inicial opcional. Un fallo aquí no tumba el alta: la competición
  // ya existe y el organizador puede reintentar desde el panel.
  let imported = null;
  if (data.provider === 'ESPN' && data.importFrom && data.importTo) {
    try {
      imported = await importCompetitionFixtures(competition.id, {
        start: new Date(data.importFrom),
        end: new Date(data.importTo),
      });
    } catch (e) {
      console.error('[saas/competitions] import inicial fallido:', e);
      imported = { error: 'La competición se creó, pero la importación falló. Reinténtala desde el panel.' };
    }
  }

  return Response.json({ ok: true, competition, imported }, { status: 201 });
}
