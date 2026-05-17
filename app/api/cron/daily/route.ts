import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/permissions';
import { syncMatchesFromApi, lockAndScore } from '@/lib/sync';
import { cleanupRateLimit } from '@/lib/ratelimit';

/**
 * Cron diario combinado — compatible con Vercel Hobby (1 ejecución/día por cron).
 * Ejecuta sync con API-Football + lock + score en un único job.
 *
 * Si se sube a Pro o se usa cron externo (GitHub Actions, cron-job.org)
 * con frecuencia ~10min, llamar a /api/cron/lock-and-score por separado.
 *
 * Nota: el CIERRE de pronósticos se valida lazy en /api/predictions también,
 * así que aunque este cron tarde en correr, nadie puede predecir tras kickoff-15m.
 */
export async function GET(req: Request) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;

  const result: { sync?: unknown; lock?: unknown; errors: string[] } = { errors: [] };

  try {
    result.sync = await syncMatchesFromApi();
  } catch (e) {
    result.errors.push(`sync: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    result.lock = await lockAndScore();
  } catch (e) {
    result.errors.push(`lock: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Cleanup buckets caducados del rate limit (TTL 1h)
  try {
    await cleanupRateLimit();
  } catch (e) {
    result.errors.push(`ratelimit-cleanup: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({ ok: result.errors.length === 0, ...result });
}

export const POST = GET;
