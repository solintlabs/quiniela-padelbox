import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimit, tooManyRequests } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(60).optional(),
  clubName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  expectedSize: z.number().int().positive().max(100000).optional(),
  source: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * POST /api/leads — captura de interés "quiero mi quiniela".
 * Público (no requiere login) pero rate-limited por IP + email.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  // Rate limits generosos — leads son user input bajo volumen y testing puede
  // dispararlos. Anti-spam real con honeypot/OTP iria en otra capa.
  const rlEmail = await rateLimit(`lead:email:${email}`, 10, 3600);
  if (!rlEmail.allowed) return tooManyRequests(rlEmail.resetAt);
  const rlIp = await rateLimit(`lead:ip:${ip}`, 30, 3600);
  if (!rlIp.allowed) return tooManyRequests(rlIp.resetAt);

  const lead = await prisma.lead.create({
    data: {
      email,
      name: parsed.data.name ?? null,
      clubName: parsed.data.clubName ?? null,
      phone: parsed.data.phone ?? null,
      expectedSize: parsed.data.expectedSize ?? null,
      source: parsed.data.source ?? 'unknown',
      notes: parsed.data.notes ?? null,
    },
  });

  // Notificación al admin del SaaS — best-effort, no bloquea la respuesta
  notifyAdminOfLead(lead).catch((e) =>
    console.error('[leads] notify admin email fallo:', e instanceof Error ? e.message : e),
  );

  return NextResponse.json({ ok: true });
}

interface LeadRow {
  id: string;
  email: string;
  name: string | null;
  clubName: string | null;
  phone: string | null;
  expectedSize: number | null;
  source: string | null;
  notes: string | null;
  createdAt: Date;
}

async function notifyAdminOfLead(lead: LeadRow): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL ?? 'info@solint.cloud';
  const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
  if (!apiKey) {
    console.warn('[leads] RESEND_API_KEY no configurada — lead solo guardado en DB');
    return;
  }

  // Helper: muestra el valor o "(sin datos)" en gris si está vacío.
  const display = (v: string | number | null | undefined) =>
    v != null && String(v).trim() !== '' ? String(v) : '(sin datos)';

  const phoneDigits = lead.phone ? lead.phone.replace(/\D/g, '') : '';
  const subject = `🟢 Lead QuinielaBOX: ${display(lead.name ?? lead.clubName ?? lead.email)}`;

  // PLAIN TEXT — siempre lista TODOS los campos, marca los vacíos.
  // Algunos clientes de email muestran solo text si no soportan HTML.
  const text = [
    '=== NUEVO LEAD QUINIELABOX ===',
    '',
    `Fecha:    ${lead.createdAt.toISOString()}`,
    '',
    '--- DATOS DEL INTERESADO ---',
    `Nombre:   ${display(lead.name)}`,
    `Email:    ${display(lead.email)}`,
    `WhatsApp: ${display(lead.phone)}`,
    `Club:     ${display(lead.clubName)}`,
    `Socios:   ${lead.expectedSize ? `~${lead.expectedSize}` : '(sin datos)'}`,
    '',
    '--- ORIGEN ---',
    `Source:   ${display(lead.source)}`,
    `Notas:    ${display(lead.notes)}`,
    '',
    '--- ACCIONES SUGERIDAS ---',
    `Responder email:  mailto:${lead.email}`,
    phoneDigits ? `WhatsApp:         https://wa.me/${phoneDigits}` : 'WhatsApp:         (no facilito)',
    '',
    `Panel admin: https://quinielabox.com/admin/saas`,
  ].join('\n');

  // HTML — limpio, todos los campos, sin colapsar los vacíos.
  const row = (label: string, value: string, accent = false) => `
    <tr>
      <td style="padding:8px 12px;color:#71717a;font-size:13px;border-bottom:1px solid #e4e4e7;width:100px;white-space:nowrap;">${label}</td>
      <td style="padding:8px 12px;color:${accent ? '#0a0a0a' : '#27272a'};font-size:14px;border-bottom:1px solid #e4e4e7;${accent ? 'font-weight:600;' : ''}">${value}</td>
    </tr>
  `;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#fafafa;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;background:#0a0a0a;color:#fff;">
      <p style="margin:0;font-size:11px;color:#a1a1aa;letter-spacing:2px;text-transform:uppercase;">Nuevo lead · ${escapeHtml(lead.source ?? 'unknown')}</p>
      <h1 style="margin:6px 0 0;font-size:22px;color:#B6FF3C;">🟢 ${escapeHtml(lead.name ?? lead.clubName ?? lead.email)}</h1>
      <p style="margin:6px 0 0;font-size:12px;color:#a1a1aa;">${escapeHtml(lead.createdAt.toUTCString())}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin:0;">
      ${row('Nombre', escapeHtml(display(lead.name)), true)}
      ${row('Email', `<a href="mailto:${escapeHtml(lead.email)}" style="color:#5CA31E;text-decoration:none;">${escapeHtml(lead.email)}</a>`, true)}
      ${row('WhatsApp', lead.phone
        ? `<a href="https://wa.me/${phoneDigits}" style="color:#25D366;text-decoration:none;">${escapeHtml(lead.phone)}</a>`
        : `<span style="color:#a1a1aa;">(sin datos)</span>`)}
      ${row('Club / grupo', escapeHtml(display(lead.clubName)))}
      ${row('Socios estimados', lead.expectedSize ? `~${lead.expectedSize}` : `<span style="color:#a1a1aa;">(sin datos)</span>`)}
      ${row('Source', escapeHtml(display(lead.source)))}
    </table>

    ${lead.notes ? `<div style="margin:12px 24px;padding:14px;background:#f4f4f5;border-radius:8px;font-size:13px;white-space:pre-wrap;color:#27272a;">
      <strong style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Notas</strong><br/>
      ${escapeHtml(lead.notes)}
    </div>` : ''}

    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;background:#fafafa;">
      <a href="https://quinielabox.com/admin/saas" style="display:inline-block;background:#5CA31E;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;">
        Ver en panel admin →
      </a>
      ${lead.phone ? `<a href="https://wa.me/${phoneDigits}?text=Hola%20${encodeURIComponent(lead.name ?? '')},%20te%20escribo%20de%20QuinielaBOX..." style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;margin-left:8px;">
        💬 Responder por WhatsApp
      </a>` : ''}
    </div>
  </div>
  </body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email,
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend HTTP ${res.status}: ${await res.text().catch(() => '')}`);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c] ?? c);
}
