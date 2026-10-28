import { prisma } from '@/lib/db';
import { isSaasEnabled } from '@/lib/saas/flags';
import { syncOpenCompetitions } from '@/lib/saas/sync';
import { lockDueFixtures, scoreCompetition } from '@/lib/saas/scoring';
import { sendDueTenantReminders } from '@/lib/saas/reminders';

/**
 * Un ciclo completo de mantenimiento de las quinielas de clientes: importar
 * resultados, cerrar los partidos que toca, puntuar, vencer los Pro de
 * temporada caducados y mandar los recordatorios.
 *
 * Vive aparte de la ruta porque lo disparan DOS sitios: su propio endpoint
 * (/api/saas/cron/sync) y el cron de PADELBOX (/api/cron/lock-and-score). El
 * segundo es el que de verdad lo mantiene vivo: en Vercel Hobby solo corre un
 * cron al día, así que el horario declarado en vercel.json no se ejecuta.
 */
export interface SaasCycleResult {
  skipped?: true;
  competitions?: number;
  locked?: number;
  scored?: number;
  expiredPro?: number;
  reminders?: unknown;
  failed?: unknown;
}

export async function runSaasCycle(origin: string): Promise<SaasCycleResult> {
  if (!isSaasEnabled()) return { skipped: true };

  const result = await syncOpenCompetitions();

  // Tras importar resultados: cerrar los partidos que ya toca y puntuar los
  // finalizados. Sin esto los puntos se quedan en null y el ranking en 0.
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

  // El Pro por temporada es un pago único: al vencer vuelve a FREE. La quiniela
  // sigue abierta (status ACTIVE), solo pierde las ventajas.
  const expired = await prisma.tenant.updateMany({
    where: { plan: 'PRO', proUntil: { not: null, lt: new Date() } },
    data: { plan: 'FREE', proUntil: null },
  });

  // Avisar a quien le falta pronosticar antes del cierre. Un fallo en el envío
  // no debe invalidar el resto del ciclo.
  let reminders: unknown = null;
  try {
    reminders = await sendDueTenantReminders(origin);
  } catch (e) {
    console.error('[saas/cycle] recordatorios:', e instanceof Error ? e.message : e);
  }

  return {
    competitions: result.competitions,
    failed: result.failed,
    locked,
    scored,
    expiredPro: expired.count,
    reminders,
  };
}
