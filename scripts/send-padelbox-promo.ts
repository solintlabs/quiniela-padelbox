/**
 * Envío del correo promocional del club PADELBOX a los participantes de la
 * quiniela.
 *
 *   node scripts/send-padelbox-promo.mjs --test        → solo al admin
 *   node scripts/send-padelbox-promo.mjs --limit 100   → primeros 100 pendientes
 *   node scripts/send-padelbox-promo.mjs --all         → todos
 *
 * Lleva registro de a quién ya se le envió (tabla RateLimit, clave por email)
 * para poder mandarlo en varios días sin repetir a nadie: el plan gratuito de
 * Resend permite 100 correos al día y hay más destinatarios que eso.
 *
 * Requiere DATABASE_URL y RESEND_API_KEY en el entorno.
 */
import { PrismaClient } from '@prisma/client';
import { buildPadelboxPromoEmail } from '../lib/emails/padelbox-promo';

const ORIGIN = process.env.PROMO_ORIGIN ?? 'https://www.quinielabox.com';
const FROM = process.env.EMAIL_FROM ?? 'quiniela@contact.solint.cloud';
const REPLY_TO = process.env.PROMO_REPLY_TO ?? process.env.EMAIL_REPLY_TO ?? 'info@solint.cloud';
const CAMPAIGN = 'promo:padelbox:2026-08';

const args = process.argv.slice(2);
const isTest = args.includes('--test');
const sendAll = args.includes('--all');
const limitArg = args.indexOf('--limit');
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : isTest ? 1 : 100;

const prisma = new PrismaClient();

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Falta RESEND_API_KEY');

  const { subject, html, text } = buildPadelboxPromoEmail({ origin: ORIGIN });

  // Destinatarios: usuarios de PADELBOX con email.
  const users = await prisma.user.findMany({
    where: isTest ? { role: 'ADMIN' } : {},
    select: { email: true },
    orderBy: { createdAt: 'asc' },
  });

  // Quién ya lo recibió (para reanudar mañana sin duplicar).
  const already = await prisma.rateLimit.findMany({
    where: { key: { startsWith: `${CAMPAIGN}:` } },
    select: { key: true },
  });
  const done = new Set(already.map((r) => r.key.slice(CAMPAIGN.length + 1)));

  const pending = users
    .map((u) => u.email)
    .filter((e) => !!e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    .filter((e) => isTest || !done.has(e));

  const batch = sendAll ? pending : pending.slice(0, limit);

  console.log(`destinatarios totales: ${pending.length}`);
  console.log(`ya enviados antes: ${done.size}`);
  console.log(`se enviarán ahora: ${batch.length}${isTest ? ' (MODO PRUEBA)' : ''}`);
  if (batch.length === 0) return;

  let sent = 0;
  let failed = 0;
  // De 100 en 100, que es el máximo del endpoint batch de Resend.
  for (let i = 0; i < batch.length; i += 100) {
    const group = batch.slice(i, i + 100);
    const payload = group.map((to) => ({ from: FROM, to, reply_to: REPLY_TO, subject, html, text }));
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((e) => {
      console.error('fallo de red:', e.message);
      return null;
    });

    if (res && res.ok) {
      sent += group.length;
      if (!isTest) {
        // Marca a quién se le envió, para no repetir en el siguiente lote.
        await prisma.rateLimit.createMany({
          data: group.map((e) => ({
            key: `${CAMPAIGN}:${e}`,
            count: 1,
            windowEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          })),
          skipDuplicates: true,
        });
      }
    } else {
      failed += group.length;
      if (res) console.error('error de Resend:', res.status, await res.text().catch(() => ''));
    }
  }

  console.log(`\nenviados: ${sent} | fallidos: ${failed}`);
  const left = pending.length - (isTest ? 0 : sent);
  if (!isTest && left > 0) {
    console.log(`quedan ${left} para el siguiente lote (mañana, por el límite diario de Resend).`);
  }
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
