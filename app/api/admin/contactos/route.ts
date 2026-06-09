import { requireAdminApi } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/contactos?filter=unpaid|all|paid
 * Descarga un .vcf (vCard) con TODOS los contactos del filtro, para
 * importarlos de golpe al teléfono. Por defecto: registrados sin pagar.
 */

/** Escapa caracteres especiales de un valor de texto vCard 3.0. */
function vesc(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Limpia un teléfono dejando + y dígitos (formato válido para TEL). */
function cleanPhone(p: string): string {
  const trimmed = p.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/[^\d]/g, '');
}

export async function GET(req: Request) {
  const admin = await requireAdminApi(req);
  if (admin instanceof Response) return admin;

  const url = new URL(req.url);
  const filter = url.searchParams.get('filter') ?? 'unpaid';

  const where =
    filter === 'paid' ? { hasPaid: true } : filter === 'all' ? {} : { hasPaid: false };

  const users = await prisma.user.findMany({
    where: { ...where, phone: { not: null } },
    select: { name: true, email: true, phone: true, hasPaid: true },
    orderBy: { createdAt: 'desc' },
  });

  const cards: string[] = [];
  for (const u of users) {
    const phoneRaw = (u.phone ?? '').trim();
    if (!phoneRaw) continue;
    const tel = cleanPhone(phoneRaw);
    if (tel.replace(/\D/g, '').length < 7) continue; // descarta teléfonos basura

    const displayName = (u.name?.trim() || u.email.split('@')[0]).replace(/[\r\n]/g, ' ').trim();
    const fn = vesc(`QB ${displayName}`);
    const note = vesc(`Quiniela PADELBOX - ${u.hasPaid ? 'PAGADO' : 'SIN PAGAR'} - ${u.email}`);

    cards.push(
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'PRODID:-//QuinielaBOX//Contactos//ES',
        // N: Apellido;Nombre;Segundo;Prefijo;Sufijo (5 campos = 4 ';')
        `N:;${fn};;;`,
        `FN:${fn}`,
        `TEL;TYPE=CELL,VOICE:${tel}`,
        `EMAIL;TYPE=INTERNET:${vesc(u.email)}`,
        `NOTE:${note}`,
        'END:VCARD',
      ].join('\r\n'),
    );
  }

  const body = cards.join('\r\n') + '\r\n';

  const filterLabel = filter === 'paid' ? 'pagados' : filter === 'all' ? 'todos' : 'sin-pagar';
  const filename = `Contactos Quiniela - ${filterLabel} (${cards.length}).vcf`;
  const encoded = encodeURIComponent(filename);

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/vcard; charset=utf-8',
      'content-disposition': `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encoded}`,
      'cache-control': 'no-store',
    },
  });
}
