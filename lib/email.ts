import { isAppleReviewEmail } from '@/lib/apple-review';

const RESEND_BATCH_URL = 'https://api.resend.com/emails/batch';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

  const clean = [...new Set(recipients.map((e) => e.trim().toLowerCase()))].filter(
    (e) => EMAIL_RE.test(e) && !isAppleReviewEmail(e),
  );
  if (clean.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
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
