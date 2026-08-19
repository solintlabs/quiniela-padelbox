import { verifyCronSecret } from '@/lib/permissions';
import { requireSaasEnabled } from '@/lib/saas/flags';
import { runSaasCycle } from '@/lib/saas/cycle';

/**
 * POST /api/saas/cron/sync — ciclo de las quinielas de clientes.
 *
 * OJO: en Vercel Hobby solo se ejecuta UN cron al día, así que el horario que
 * vercel.json declara para esta ruta NO corre. El latido real lo da
 * /api/cron/lock-and-score (lo dispara GitHub Actions cada pocos minutos), que
 * llama al mismo `runSaasCycle`. Esta ruta se mantiene para poder dispararlo a
 * mano y para cuando el proyecto pase a Vercel Pro.
 *
 * Reusa `verifyCronSecret`, así que comparte el CRON_SECRET ya existente.
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
    const result = await runSaasCycle(new URL(req.url).origin);
    return Response.json({ ok: true, ms: Date.now() - startedAt, ...result });
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
