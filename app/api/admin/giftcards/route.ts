import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminApi } from '@/lib/permissions';

// Sin 0/O/1/I/L para que el local pueda teclearlo sin ambigüedad.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function genCode(): string {
  const bytes = randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `QB-${s.slice(0, 4)}-${s.slice(4)}`;
}

const bodySchema = z.object({
  monto: z.string().trim().min(1).max(40),
  titulo: z.string().trim().max(36).optional(),
  detalle: z.string().trim().max(48).optional(),
  sponsorName: z.string().trim().max(60).optional(),
  winnerName: z.string().trim().max(32).optional(),
  // Email del local: si viene, se le envían los datos + código al emitir.
  sendTo: z.string().trim().email().max(120).optional().or(z.literal('')),
});

interface CardEmailData {
  code: string;
  monto: string;
  detalle: string | null;
  sponsorName: string | null;
  winnerName: string | null;
}

function buildGiftCardEmail(c: CardEmailData) {
  const verifyUrl = `https://quinielabox.com/gift/${c.code}`;
  const subject = `🎁 Gift card ${c.code} · ${c.monto} — Quiniela PADELBOX`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px;color:#737373;font-size:13px;">${label}</td><td style="padding:6px 12px;color:#171717;font-size:14px;font-weight:600;">${value}</td></tr>`;
  const html = `
  <div style="background:#f5f5f5;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;">
      <div style="background:#0A0A0A;padding:24px;text-align:center;">
        <p style="margin:0;color:#B6FF3C;font-size:13px;letter-spacing:3px;font-weight:bold;">QUINIELA PADELBOX</p>
        <p style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:bold;">🎁 Gift card emitida</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;color:#404040;font-size:14px;line-height:1.5;">
          Se ha emitido una gift card como premio de la quiniela. Estos son sus datos oficiales:
        </p>
        <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:10px;">
          ${row('Premio', c.monto)}
          ${c.sponsorName ? row('Patrocina', c.sponsorName) : ''}
          ${c.winnerName ? row('Ganador', c.winnerName) : ''}
          ${c.detalle ? row('Detalle', c.detalle) : ''}
        </table>
        <div style="margin:20px 0;text-align:center;background:#0A0A0A;border-radius:12px;padding:18px;">
          <p style="margin:0;color:#737373;font-size:11px;letter-spacing:2px;">CÓDIGO DE CANJE</p>
          <p style="margin:6px 0 0;color:#B6FF3C;font-size:28px;font-weight:bold;font-family:Consolas,monospace;letter-spacing:2px;">${c.code}</p>
        </div>
        <p style="margin:0 0 8px;color:#404040;font-size:14px;line-height:1.5;">
          <strong>Para validarla:</strong> escanea el QR de la tarjeta o abre este enlace —
          verás si es válida o si ya fue canjeada:
        </p>
        <p style="margin:0 0 16px;text-align:center;">
          <a href="${verifyUrl}" style="display:inline-block;background:#B6FF3C;color:#0A0A0A;padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px;text-decoration:none;">Verificar gift card →</a>
        </p>
        <p style="margin:0;color:#737373;font-size:12px;line-height:1.5;">
          ⚠ Válida para <strong>un solo canje</strong>. Tras entregar el premio, avisa al
          organizador para que la marque como canjeada. Si el enlace dice
          «ya fue canjeada» o «código no válido», no la aceptes.
        </p>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #eeeeee;text-align:center;">
        <p style="margin:0;color:#a3a3a3;font-size:11px;">Quiniela PADELBOX × DELISH · quinielabox.com</p>
      </div>
    </div>
  </div>`;
  const text = [
    'GIFT CARD EMITIDA — Quiniela PADELBOX',
    '',
    `Premio: ${c.monto}`,
    c.sponsorName ? `Patrocina: ${c.sponsorName}` : null,
    c.winnerName ? `Ganador: ${c.winnerName}` : null,
    c.detalle ? `Detalle: ${c.detalle}` : null,
    '',
    `CÓDIGO DE CANJE: ${c.code}`,
    `Verificar: ${verifyUrl}`,
    '',
    'Válida para un solo canje. Si el enlace dice "ya fue canjeada" o "código no válido", no la aceptes.',
  ]
    .filter((l): l is string => l !== null)
    .join('\n');
  return { subject, html, text };
}

/** Emite una gift card: crea el registro, devuelve el código y (opcional) la envía por email al local. */
export async function POST(req: Request) {
  const admin = await requireAdminApi(req);
  if (admin instanceof Response) return admin;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos (revisa el email del local)' }, { status: 400 });
  }
  const b = parsed.data;

  // Reintenta si colisiona el código único (probabilidad ínfima).
  let card: { id: string; code: string } | null = null;
  for (let attempt = 0; attempt < 3 && !card; attempt++) {
    try {
      card = await prisma.giftCard.create({
        data: {
          code: genCode(),
          monto: b.monto,
          titulo: b.titulo || null,
          detalle: b.detalle || null,
          sponsorName: b.sponsorName || null,
          winnerName: b.winnerName || null,
        },
        select: { id: true, code: true },
      });
    } catch (e) {
      const isUniqueClash =
        typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === 'P2002';
      if (!isUniqueClash) throw e;
    }
  }
  if (!card) {
    return NextResponse.json({ error: 'No se pudo generar un código único' }, { status: 500 });
  }

  // Envío opcional al local (la emisión NO falla si el email falla).
  let emailed = false;
  let emailError: string | null = null;
  const sendTo = b.sendTo?.trim();
  if (sendTo) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
    if (!apiKey) {
      emailError = 'RESEND_API_KEY no configurado';
    } else {
      const { subject, html, text } = buildGiftCardEmail({
        code: card.code,
        monto: b.monto,
        detalle: b.detalle || null,
        sponsorName: b.sponsorName || null,
        winnerName: b.winnerName || null,
      });
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: sendTo,
          reply_to: process.env.EMAIL_REPLY_TO ?? 'info@solint.cloud',
          subject,
          html,
          text,
        }),
      }).catch(() => null);
      if (r?.ok) {
        emailed = true;
      } else {
        emailError = 'No se pudo enviar el email (la tarjeta SÍ quedó emitida)';
        console.error('[giftcards] resend fallo:', r ? await r.text().catch(() => r.status) : 'fetch error');
      }
    }
  }

  return NextResponse.json({ code: card.code, id: card.id, emailed, emailError });
}
