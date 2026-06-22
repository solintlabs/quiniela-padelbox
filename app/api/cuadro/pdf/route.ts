import { requireUserApi, requireAdminApi } from '@/lib/permissions';
import { buildCuadroPdf } from '@/lib/cuadro-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/cuadro/pdf            -> PDF del usuario autenticado
 * GET /api/cuadro/pdf?userId=X   -> PDF de otro usuario (solo admin)
 *
 * Devuelve un PDF descargable con nombre:
 * "Fase de grupos - <nombre> - <fecha> - <email>.pdf"
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const targetId = url.searchParams.get('userId');

  let userId: string;
  if (targetId) {
    // Pedir el de otro usuario requiere admin.
    const admin = await requireAdminApi(req);
    if (admin instanceof Response) return admin;
    userId = targetId;
  } else {
    const user = await requireUserApi(req);
    if (user instanceof Response) return user;
    userId = user.id;
  }

  const result = await buildCuadroPdf(userId);
  if (!result) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Content-Disposition con dos formas:
  // - filename="..."  -> fallback ASCII (navegadores viejos). Sin acentos
  //   aqui para que no salgan caracteres raros.
  // - filename*=UTF-8'' -> nombre real con acentos/ñ (navegadores actuales).
  const asciiFallback = result.filename
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/"/g, '');
  const encoded = encodeURIComponent(result.filename);
  return new Response(Buffer.from(result.bytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
      'cache-control': 'no-store',
    },
  });
}
