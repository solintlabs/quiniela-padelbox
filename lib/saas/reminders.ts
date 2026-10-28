import { prisma } from '@/lib/db';
import { sendPushToUsers, usersWithoutPush } from '@/lib/push';
import { sendBulkEmail } from '@/lib/email';
import { recipientsForBulk } from '@/lib/unsubscribe';
import { buildTenantReminderEmail } from '@/lib/emails/tenant-reminder';
import { lockTimeFor } from '@/lib/saas/scoring-core';
import { formatDateTime } from '@/lib/format';

/**
 * Recordatorios de las quinielas SaaS: avisa a quien todavía NO ha pronosticado
 * un partido que está a punto de cerrarse.
 *
 * Es lo que mantiene viva una quiniela: sin aviso la gente se olvida, deja de
 * jugar y el club no renueva. Equivalente por tenant al recordatorio de
 * PADELBOX, pero con la marca del cliente.
 *
 * Idempotente: cada partido se marca con `reminderSentAt`, así que aunque el
 * cron pase varias veces solo se avisa una vez.
 */

/** Cuánto antes del CIERRE se avisa. */
const REMIND_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 h

/**
 * Espera mínima entre dos avisos a la MISMA persona. Sin esto, alguien que no
 * pronostica recibe un aviso por cada tanda de partidos que cierra: en una
 * liga con partidos repartidos por la semana eso son varios correos al día.
 * Con 20 h se le avisa como mucho una vez al día.
 */
const PER_PLAYER_COOLDOWN_MS = 20 * 60 * 60 * 1000;

export interface ReminderResult {
  fixtures: number;
  pushed: number;
  emailed: number;
  errors: string[];
}

export async function sendDueTenantReminders(origin: string): Promise<ReminderResult> {
  const now = new Date();
  const result: ReminderResult = { fixtures: 0, pushed: 0, emailed: 0, errors: [] };

  // Partidos por jugarse en competiciones abiertas, sin recordatorio enviado.
  const fixtures = await prisma.saasFixture.findMany({
    where: {
      status: 'SCHEDULED',
      lockedAt: null,
      reminderSentAt: null,
      // El margen extra cubre el cierre más anticipado que permite el panel
      // (24 h); el filtro fino por competición se hace justo debajo.
      kickoff: { gt: now, lt: new Date(now.getTime() + REMIND_WINDOW_MS + 25 * 60 * 60 * 1000) },
      competition: { status: 'OPEN' },
    },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      competition: {
        select: {
          id: true,
          lockOffsetMin: true,
          tenant: { select: { id: true, slug: true, name: true, accentColor: true } },
        },
      },
    },
    take: 200,
  });

  // Solo los que cierran dentro de la ventana (el cierre depende de cada
  // competición, por eso se filtra aquí y no en la consulta).
  const due = fixtures.filter((f) => {
    const lock = lockTimeFor(f.kickoff, f.competition.lockOffsetMin).getTime();
    return lock > now.getTime() && lock - now.getTime() <= REMIND_WINDOW_MS;
  });
  if (due.length === 0) return result;

  // Se agrupa por tenant para mandar UN aviso por jugador aunque cierren varios
  // partidos a la vez.
  const byTenant = new Map<string, typeof due>();
  for (const f of due) {
    const list = byTenant.get(f.competition.tenant.id) ?? [];
    list.push(f);
    byTenant.set(f.competition.tenant.id, list);
  }

  for (const [tenantId, tenantFixtures] of byTenant) {
    const tenant = tenantFixtures[0].competition.tenant;
    try {
      // Solo se avisa a quien ya está confirmado por el organizador: el resto
      // ni siquiera puede pronosticar.
      const memberships = await prisma.saasMembership.findMany({
        where: { tenantId, hasPaid: true },
        select: { id: true, userId: true, lastRemindedAt: true },
      });
      if (memberships.length === 0) continue;

      const fixtureIds = tenantFixtures.map((f) => f.id);
      const entries = await prisma.saasEntry.findMany({
        where: { fixtureId: { in: fixtureIds }, membershipId: { in: memberships.map((m) => m.id) } },
        select: { membershipId: true, fixtureId: true },
      });
      const done = new Set(entries.map((e) => `${e.membershipId}:${e.fixtureId}`));

      // Quien no ha pronosticado AL MENOS uno de los partidos que cierran y a
      // quien no se ha avisado hace poco: un aviso por persona, no uno por
      // tanda de partidos.
      const cooldownFrom = new Date(now.getTime() - PER_PLAYER_COOLDOWN_MS);
      const pending = memberships.filter(
        (m) =>
          fixtureIds.some((fid) => !done.has(`${m.id}:${fid}`)) &&
          (!m.lastRemindedAt || m.lastRemindedAt < cooldownFrom),
      );
      if (pending.length === 0) continue;

      const labels = tenantFixtures.map(
        (f) => `${f.homeTeam.name} vs ${f.awayTeam.name} · ${formatDateTime(f.kickoff)}`,
      );
      const url = `${origin}/saas/${tenant.slug}`;
      const userIds = pending.map((m) => m.userId);

      // Push a quien tenga la app.
      const push = await sendPushToUsers(userIds, () => ({
        title: tenant.name,
        body:
          labels.length === 1
            ? `Cierra pronto: ${labels[0]}. Te falta pronosticar.`
            : `Te faltan ${labels.length} pronósticos y cierran pronto.`,
        data: { url },
      }));
      result.pushed += push.sent;

      // El email es RESPALDO, no duplicado: solo a quien no tiene la app, y
      // solo a quien no se ha dado de baja. Un único correo por persona con
      // TODOS los partidos que le faltan, no uno por partido.
      const noPush = await usersWithoutPush(userIds);
      const recipients = await recipientsForBulk(noPush);
      for (const r of recipients) {
        const { subject, html, text } = buildTenantReminderEmail({
          tenantName: tenant.name,
          accentColor: tenant.accentColor,
          fixtures: labels,
          url,
          unsubUrl: r.unsubUrl,
        });
        // De uno en uno porque el enlace de baja es personal.
        const sent = await sendBulkEmail([r.email], subject, html, text);
        result.emailed += sent.sent;
      }

      // Marca a quién se avisó (para el periodo de espera) y los partidos ya
      // notificados (para no repetir la tanda).
      await prisma.saasMembership.updateMany({
        where: { id: { in: pending.map((m) => m.id) } },
        data: { lastRemindedAt: new Date() },
      });
      await prisma.saasFixture.updateMany({
        where: { id: { in: fixtureIds } },
        data: { reminderSentAt: new Date() },
      });
      result.fixtures += tenantFixtures.length;
    } catch (e) {
      result.errors.push(`${tenant.slug}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}
