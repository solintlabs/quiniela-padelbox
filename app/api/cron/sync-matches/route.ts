import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/permissions';
import { syncMatchesFromApi } from '@/lib/sync';

// Vercel Hobby permite hasta 60s; subimos a 30 para tener holgura frente a
// ESPN lento + cold start de Neon. Default era 10s -> timeout 500 ocasional.
export const maxDuration = 30;

export async function GET(req: Request) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;
  try {
    const result = await syncMatchesFromApi();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    // Devuelve 200 con ok:false para que el cron externo (GitHub Actions)
    // no aborte el resto del job (lock-and-score) por un fallo transitorio
    // de ESPN. El error se registra en logs de Vercel.
    console.error('[cron/sync-matches] failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'sync failed' },
      { status: 200 },
    );
  }
}

export const POST = GET;
