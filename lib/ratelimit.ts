import { prisma } from '@/lib/db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limiter sliding-window simple (DB-backed via Prisma).
 *
 * @param key   Bucket key — ej "predict:user:abc" o "predict:ip:1.2.3.4"
 * @param max   Requests máximas permitidas por ventana
 * @param windowSec  Tamaño de la ventana en segundos
 * @returns     { allowed, remaining, resetAt }
 *
 * Para los volúmenes de esta app (<200 users, ~100 req/min en pico) el coste
 * de Postgres es trivial (~5ms). Si crece, mover a Upstash/Redis.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const newWindowEnd = new Date(now.getTime() + windowSec * 1000);

  // Upsert atómico: si no existe o la ventana actual ha caducado, reset.
  // Si está dentro de la ventana, incrementa count.
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowEnd <= now) {
    // Nueva ventana
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, windowEnd: newWindowEnd },
      create: { key, count: 1, windowEnd: newWindowEnd },
    });
    return { allowed: true, remaining: max - 1, resetAt: newWindowEnd };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.windowEnd };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { allowed: true, remaining: max - existing.count - 1, resetAt: existing.windowEnd };
}

/** Respuesta 429 estándar. */
export function tooManyRequests(reset: Date): Response {
  const retryAfter = Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: 'Demasiadas peticiones',
      message: `Has hecho muchas predicciones en poco tiempo. Espera ${retryAfter}s.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': String(retryAfter),
        'x-ratelimit-reset': String(Math.floor(reset.getTime() / 1000)),
      },
    },
  );
}

/** Cleanup de buckets caducados — llamar desde cron diario. */
export async function cleanupRateLimit(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // hace 1h
  const r = await prisma.rateLimit.deleteMany({
    where: { windowEnd: { lt: cutoff } },
  });
  return { deleted: r.count };
}
