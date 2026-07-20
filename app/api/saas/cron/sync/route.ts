import { verifyCronSecret } from '@/lib/permissions';
import { requireSaasEnabled } from '@/lib/saas/flags';
import { syncOpenCompetitions } from '@/lib/saas/sync';

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
    return Response.json({
      ok: true,
      ms: Date.now() - startedAt,
      ...result,
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
