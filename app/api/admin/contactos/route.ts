import { requireAdminApi } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/contactos?filter=unpaid|all|paid
 * Descarga un archivo .vcf (vCard) con los contactos de los usuarios, para
 * importarlos todos de golpe al teléfono y contactarlos. Por defecto: los
 * que se registraron pero NO han pagado.
 */
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

  // Construir vCard 3.0 (compatible iOS/Android). Prefijo "QB" en el nombre
  // para identificarlos fácil en la agenda.
  const vcards = users
    .filter((u) => u.phone && u.phone.trim())
    .map((u) => {
      const displayName = (u.name?.trim() || u.email.split('@')[0]).replace(/[\r\n]/g, ' ');
      const fn = `QB ${displayName}`;
      const tel = u.phone!.trim();
      const note = `Quiniela PADELBOX · ${u.hasPaid ? 'PAGADO' : 'sin pagar'} · ${u.email}`;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${fn};;;`,
        `FN:${fn}`,
        `TEL;TYPE=CELL:${tel}`,
        `EMAIL:${u.email}`,
        `NOTE:${note}`,
        'END:VCARD',
      ].join('\r\n');
    })
    .join('\r\n');

  const filterLabel = filter === 'paid' ? 'pagados' : filter === 'all' ? 'todos' : 'sin-pagar';
  const filename = `Contactos Quiniela - ${filterLabel}.vcf`;
  const encoded = encodeURIComponent(filename);

  return new Response(vcards + '\r\n', {
    status: 200,
    headers: {
      'content-type': 'text/vcard; charset=utf-8',
      'content-disposition': `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encoded}`,
      'cache-control': 'no-store',
    },
  });
}
