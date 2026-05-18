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

  const rlEmail = await rateLimit(`lead:email:${email}`, 3, 3600);
  if (!rlEmail.allowed) return tooManyRequests(rlEmail.resetAt);
  const rlIp = await rateLimit(`lead:ip:${ip}`, 10, 3600);
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

  const subject = `🟢 Nuevo lead QuinielaBOX: ${lead.clubName ?? lead.name ?? lead.email}`;
  const lines = [
    `Email:  ${lead.email}`,
    lead.name && `Nombre: ${lead.name}`,
    lead.clubName && `Club:   ${lead.clubName}`,
    lead.phone && `Tel:    ${lead.phone}`,
    lead.expectedSize && `Socios: ~${lead.expectedSize}`,
    lead.source && `Source: ${lead.source}`,
    '',
    lead.notes && `Notas:\n${lead.notes}`,
    '',
    `Ver en super-admin: https://quiniela.solint.cloud/super-admin`,
  ].filter(Boolean).join('\n');

  const html = `<div style="font-family:-apple-system,sans-serif;color:#111;background:#fff;padding:20px;max-width:560px;">
    <h2 style="margin:0 0 16px;font-size:20px;">🟢 Nuevo lead QuinielaBOX</h2>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      <tr><td style="padding:6px 0;color:#666;width:80px;">Email</td><td><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td></tr>
      ${lead.name ? `<tr><td style="padding:6px 0;color:#666;">Nombre</td><td>${escapeHtml(lead.name)}</td></tr>` : ''}
      ${lead.clubName ? `<tr><td style="padding:6px 0;color:#666;">Club</td><td><strong>${escapeHtml(lead.clubName)}</strong></td></tr>` : ''}
      ${lead.phone ? `<tr><td style="padding:6px 0;color:#666;">WhatsApp</td><td><a href="https://wa.me/${lead.phone.replace(/\D/g, '')}">${escapeHtml(lead.phone)}</a></td></tr>` : ''}
      ${lead.expectedSize ? `<tr><td style="padding:6px 0;color:#666;">Socios</td><td>~${lead.expectedSize}</td></tr>` : ''}
      ${lead.source ? `<tr><td style="padding:6px 0;color:#666;">Source</td><td>${escapeHtml(lead.source)}</td></tr>` : ''}
    </table>
    ${lead.notes ? `<div style="margin-top:16px;padding:12px;background:#f4f4f5;border-radius:6px;white-space:pre-wrap;font-size:13px;">${escapeHtml(lead.notes)}</div>` : ''}
    <p style="margin-top:24px;font-size:12px;color:#666;">
      <a href="https://quiniela.solint.cloud/super-admin" style="color:#6BA50A;">Ver en super-admin →</a>
    </p>
  </div>`;

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
      text: lines,
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
