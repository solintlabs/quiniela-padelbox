import { prisma } from '@/lib/db';
import { verifyCronSecret } from '@/lib/permissions';
import { requireSaasEnabled } from '@/lib/saas/flags';
import { syncOpenCompetitions } from '@/lib/saas/sync';
import { lockDueFixtures, scoreCompetition } from '@/lib/saas/scoring';
import { sendDueTenantReminders } from '@/lib/saas/reminders';

/**
 * POST /api/saas/cron/sync — sincroniza las competiciones ESPN abiertas.
 *
 * Endpoint NUEVO e independiente. Los crons de PADELBOX
 * (/api/cron/sync-matches, /api/cron/lock-and-score, /api/cron/daily) y el
 * workflow de GitHub Actions que los dispara siguen exactamente igual.
 *
 * Reusa `verifyCronSecret` de lib/permissions.ts sin modificarlo, así que
 * comparte el CRON_SECRET ya existente y no hay un secreto más que gestionar.
 *
 * Con SAAS_ENABLED apagado responde 404 y no consulta la base.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle(req: Request): Promise<Response> {
  const off = requireSaasEnabled();
  if (off) return off;

  const forbidden = verifyCronSecret(req);
  if (forbidden) return forbidden;

  const startedAt = Date.now();
  try {
    const result = await syncOpenCompetitions();

    // Tras importar resultados: cerrar los partidos que ya toca y puntuar los
    // finalizados. Sin esto los puntos se quedaban en null y el ranking en 0.
    const open = await prisma.saasCompetition.findMany({
      where: { status: 'OPEN' },
      select: { id: true, lockOffsetMin: true },
    });
    let locked = 0;
    let scored = 0;
    for (const c of open) {
      locked += await lockDueFixtures(c);
      const s = await scoreCompetition(c.id);
      scored += s.entriesScored;
    }

    // El Pro comprado por temporada es un pago único: al vencer, vuelve a FREE.
    // La quiniela sigue abierta (status ACTIVE), solo pierde las ventajas.
    const expired = await prisma.tenant.updateMany({
      where: { plan: 'PRO', proUntil: { not: null, lt: new Date() } },
      data: { plan: 'FREE', proUntil: null },
    });

    // Avisar a quien le falta pronosticar antes de que cierre. No debe tumbar
    // el cron si el envío falla.
    let reminders: unknown = null;
    try {
      const origin = new URL(req.url).origin;
      reminders = await sendDueTenantReminders(origin);
    } catch (e) {
      console.error('[saas/cron/sync] recordatorios:', e);
    }

    return Response.json({
      ok: true,
      ms: Date.now() - startedAt,
      ...result,
      locked,
      scored,
      expiredPro: expired.count,
      reminders,
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error('[saas/cron/sync] fallo global:', error);
    return Response.json({ ok: false, error }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}

/** GET permitido para poder probarlo con curl sin montar un POST. */
export async function GET(req: Request): Promise<Response> {
  return handle(req);
}
