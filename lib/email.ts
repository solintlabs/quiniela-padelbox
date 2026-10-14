import { prisma } from '@/lib/db';
import { isAppleReviewEmail } from '@/lib/apple-review';

const RESEND_BATCH_URL = 'https://api.resend.com/emails/batch';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Tope de correos MASIVOS por día. Deja margen dentro del límite del plan de
 * Resend para los transaccionales (magic link, código de acceso), que son los
 * únicos sin alternativa: si se agota la cuota con recordatorios, la gente no
 * puede ni entrar. Ajustable con RESEND_DAILY_BULK_CAP.
 */
const DAILY_BULK_CAP = Number(process.env.RESEND_DAILY_BULK_CAP ?? 60);

/**
 * Reserva hasta `wanted` envíos del cupo de hoy y devuelve cuántos se conceden.
 * Se apoya en la tabla RateLimit (ya existe) usando la fecha como clave, así
 * que el contador se reinicia solo cada día y no hace falta migración.
 */
async function reserveDailyQuota(wanted: number): Promise<number> {
  if (DAILY_BULK_CAP <= 0) return wanted; // 0 = sin tope
  const day = new Date().toISOString().slice(0, 10);
  const key = `email:bulk:${day}`;
  try {
    const row = await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        count: 0,
        // Vence al final del día siguiente: el cron de limpieza lo barre.
        windowEnd: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      update: {},
      select: { count: true },
    });
    const remaining = Math.max(0, DAILY_BULK_CAP - row.count);
    const grant = Math.min(wanted, remaining);
    if (grant > 0) {
      await prisma.rateLimit.update({
        where: { key },
        data: { count: { increment: grant } },
      });
    }
    return grant;
  } catch (e) {
    // Si el contador falla, no bloqueamos el envío: peor es no avisar a nadie.
    console.error('[email] no se pudo comprobar el tope diario:', e);
    return wanted;
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Envía el MISMO email a muchos destinatarios, cada uno por separado (sin
 * exponer la lista de correos entre ellos). Usa el endpoint batch de Resend
 * (hasta 100 por llamada). Deduplica, descarta direcciones inválidas y la
 * cuenta de Apple Review. Nunca lanza: registra el fallo y sigue.
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
  text: string,
): Promise<{ sent: number; failed: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
  const replyTo = process.env.EMAIL_REPLY_TO ?? 'info@solint.cloud';
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY missing — skipping bulk send');
    return { sent: 0, failed: recipients.length };
  }

  const cleanAll = [...new Set(recipients.map((e) => e.trim().toLowerCase()))].filter(
    (e) => EMAIL_RE.test(e) && !isAppleReviewEmail(e),
  );
  if (cleanAll.length === 0) return { sent: 0, failed: 0 };

  // Tope diario: los envíos masivos (recordatorios) no pueden agotar la cuota
  // de Resend y dejar sin enviar los correos que SÍ son imprescindibles —
  // magic link y código de acceso, que no tienen alternativa por push.
  const allowance = await reserveDailyQuota(cleanAll.length);
  if (allowance === 0) {
    console.warn(`[email] tope diario alcanzado — se omiten ${cleanAll.length} envíos masivos`);
    return { sent: 0, failed: cleanAll.length };
  }
  const clean = cleanAll.slice(0, allowance);
  const skipped = cleanAll.length - clean.length;
  if (skipped > 0) {
    console.warn(`[email] tope diario: se envían ${clean.length} y se omiten ${skipped}`);
  }

  let sent = 0;
  let failed = skipped; // los omitidos por el tope cuentan como no enviados
  for (const group of chunk(clean, 100)) {
    const payload = group.map((to) => ({ from, to, reply_to: replyTo, subject, html, text }));
    const r = await fetch(RESEND_BATCH_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((e) => {
      console.error('[email] batch fetch failed:', e);
      return null;
    });
    if (r && r.ok) {
      sent += group.length;
    } else {
      failed += group.length;
      if (r) console.error('[email] batch error:', r.status, await r.text().catch(() => ''));
    }
  }
  return { sent, failed };
}
