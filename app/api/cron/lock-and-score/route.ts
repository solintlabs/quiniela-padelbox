import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/permissions';
import { lockAndScore } from '@/lib/sync';
import { runSaasCycle } from '@/lib/saas/cycle';

// lockAndScore puede tardar: sync interno + scoring de varios matches + push.
// Subimos a 45s para tener margen (Hobby max 60s).
export const maxDuration = 60;

export async function GET(req: Request) {
  const denied = verifyCronSecret(req);
  if (denied) return denied;
  try {
    const result = await lockAndScore();

    // Las quinielas de clientes (SaaS) viajan con este cron a propósito: en
    // Vercel Hobby solo corre 1 cron diario, así que el cron horario que
    // vercel.json declara para /api/saas/cron/sync NO se ejecuta. Este endpoint
    // sí lo dispara GitHub Actions cada pocos minutos, y es el único latido
    // fiable que hay. Sin esto los clientes se quedan sin puntos ni avisos.
    // Es no-bloqueante: un fallo aquí no puede tumbar el cron de PADELBOX.
    let saas: unknown = null;
    try {
      const origin = new URL(req.url).origin;
      saas = await runSaasCycle(origin);
    } catch (e) {
      console.error('[cron/lock-and-score] ciclo saas:', e instanceof Error ? e.message : e);
    }

    return NextResponse.json({ ok: true, ...result, saas });
  } catch (e) {
    console.error('[cron/lock-and-score] failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'lock-and-score failed' },
      { status: 200 },
    );
  }
}

export const POST = GET;
