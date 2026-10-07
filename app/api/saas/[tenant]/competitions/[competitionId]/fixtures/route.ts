import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireTenantRoleApi } from '@/lib/saas/permissions';

/**
 * GET  — lista los partidos de una competición (para el panel del organizador).
 * POST — añade un partido a mano (equipos por nombre) a una competición.
 * Ambos solo ADMIN.
 */
export const dynamic = 'force-dynamic';

const addSchema = z.object({
  homeTeam: z.string().trim().min(1).max(60),
  awayTeam: z.string().trim().min(1).max(60),
  kickoff: z.string().min(1),
  round: z.string().trim().max(40).optional(),
});

async function findOrCreateTeam(competitionId: string, name: string): Promise<string> {
  const existing = await prisma.saasTeam.findFirst({
    where: { competitionId, name },
    select: { id: true },
  });
  if (existing) return existing.id;
  const t = await prisma.saasTeam.create({ data: { competitionId, name } });
  return t.id;
}

export async function GET(
  req: Request,
  { params }: { params: { tenant: string; competitionId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  const comp = await prisma.saasCompetition.findFirst({
    where: { id: params.competitionId, tenantId: ctx.tenant.id },
    select: { id: true, provider: true },
  });
  if (!comp) return Response.json({ error: 'Competición no encontrada.' }, { status: 404 });

  const fixtures = await prisma.saasFixture.findMany({
    where: { competitionId: comp.id },
    orderBy: { kickoff: 'asc' },
    take: 100,
    include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
  });

  return Response.json({
    provider: comp.provider,
    fixtures: fixtures.map((f) => ({
      id: f.id,
      home: f.homeTeam.name,
      away: f.awayTeam.name,
      kickoff: f.kickoff.toISOString(),
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      status: f.status,
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { tenant: string; competitionId: string } },
): Promise<Response> {
  const ctx = await requireTenantRoleApi(params.tenant, 'ADMIN', req);
  if (ctx instanceof Response) return ctx;

  const comp = await prisma.saasCompetition.findFirst({
    where: { id: params.competitionId, tenantId: ctx.tenant.id },
    select: { id: true },
  });
  if (!comp) return Response.json({ error: 'Competición no encontrada.' }, { status: 404 });

  const parsed = addSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
      { status: 400 },
    );
  }
  const { homeTeam, awayTeam, kickoff, round } = parsed.data;
  const when = new Date(kickoff);
  if (Number.isNaN(when.getTime())) {
    return Response.json({ error: 'Fecha inválida.' }, { status: 400 });
  }

  const [homeTeamId, awayTeamId] = await Promise.all([
    findOrCreateTeam(comp.id, homeTeam),
    findOrCreateTeam(comp.id, awayTeam),
  ]);

  const fixture = await prisma.saasFixture.create({
    data: {
      competitionId: comp.id,
      homeTeamId,
      awayTeamId,
      kickoff: when,
      round: round ?? null,
      source: 'MANUAL',
    },
    select: { id: true },
  });

  return Response.json({ ok: true, id: fixture.id });
}
