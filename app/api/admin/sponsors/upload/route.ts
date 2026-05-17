import { put } from '@vercel/blob';
import { requireAdminApi } from '@/lib/permissions';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const guard = await requireAdminApi(req);
  if (guard instanceof Response) return guard;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: 'Vercel Blob no configurado. Activa Blob en el dashboard de Vercel y conecta el storage al proyecto.' },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Archivo requerido' }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return Response.json({ error: 'Maximo 2MB' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return Response.json({ error: 'Solo imagenes (png, jpg, svg, webp)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const safeName = `sponsors/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await put(safeName, file, {
    access: 'public',
    contentType: file.type,
  });

  return Response.json({ url: blob.url });
}
