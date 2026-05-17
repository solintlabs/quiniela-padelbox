import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { SponsorsManager } from './SponsorsManager';

export const metadata = { title: 'Sponsors · Admin' };
export const dynamic = 'force-dynamic';

async function createSponsor(formData: FormData) {
  'use server';
  const name = String(formData.get('name') ?? '').trim();
  const logoUrl = String(formData.get('logoUrl') ?? '').trim() || null;
  const url = String(formData.get('url') ?? '').trim() || null;
  if (!name) return;
  const max = await prisma.sponsor.aggregate({ _max: { sortOrder: true } });
  await prisma.sponsor.create({
    data: {
      name,
      logoUrl,
      url,
      enabled: true,
      sortOrder: (max._max.sortOrder ?? 0) + 10,
    },
  });
  revalidatePath('/admin/sponsors');
  revalidatePath('/login');
  revalidatePath('/');
}

async function updateSponsor(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const logoUrl = String(formData.get('logoUrl') ?? '').trim() || null;
  const url = String(formData.get('url') ?? '').trim() || null;
  if (!id || !name) return;
  await prisma.sponsor.update({
    where: { id },
    data: { name, logoUrl, url },
  });
  revalidatePath('/admin/sponsors');
  revalidatePath('/login');
  revalidatePath('/');
}

async function toggleSponsor(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const cur = await prisma.sponsor.findUnique({ where: { id } });
  if (!cur) return;
  await prisma.sponsor.update({ where: { id }, data: { enabled: !cur.enabled } });
  revalidatePath('/admin/sponsors');
  revalidatePath('/login');
  revalidatePath('/');
}

async function deleteSponsor(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.sponsor.delete({ where: { id } });
  revalidatePath('/admin/sponsors');
  revalidatePath('/login');
  revalidatePath('/');
}

async function reorderSponsor(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const dir = String(formData.get('dir') ?? '');
  if (!id || (dir !== 'up' && dir !== 'down')) return;

  const all = await prisma.sponsor.findMany({ orderBy: { sortOrder: 'asc' } });
  const idx = all.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const swap = dir === 'up' ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;

  await prisma.$transaction([
    prisma.sponsor.update({ where: { id: all[idx].id }, data: { sortOrder: all[swap].sortOrder } }),
    prisma.sponsor.update({ where: { id: all[swap].id }, data: { sortOrder: all[idx].sortOrder } }),
  ]);
  revalidatePath('/admin/sponsors');
  revalidatePath('/login');
  revalidatePath('/');
}

export default async function SponsorsAdminPage() {
  const sponsors = await prisma.sponsor.findMany({ orderBy: { sortOrder: 'asc' } });
  const blobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl">Patrocinadores</h1>
        <p className="text-sm text-muted mt-1">
          Logos visibles en login y dashboard. El orden definido aquí es el que ven los socios.
        </p>
      </header>

      {!blobConfigured && (
        <section className="rounded-xl border border-warning/40 bg-warning/10 p-5 text-sm">
          <p className="font-semibold">📦 Vercel Blob no está configurado</p>
          <p className="mt-1 text-muted">
            Para subir archivos de logo directamente desde aquí, activa <strong>Blob</strong> en el dashboard
            de Vercel (Storage → Create → Blob) y conéctalo a este proyecto. Mientras tanto, puedes pegar
            URLs públicas (Imgur, Cloudinary, etc.) en el campo &quot;URL del logo&quot;.
          </p>
        </section>
      )}

      <SponsorsManager
        sponsors={sponsors}
        blobConfigured={blobConfigured}
        actions={{
          create: createSponsor,
          update: updateSponsor,
          toggle: toggleSponsor,
          delete: deleteSponsor,
          reorder: reorderSponsor,
        }}
      />
    </div>
  );
}
