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

  // RFC 5987 para el nombre con espacios/caracteres.
  const encoded = encodeURIComponent(result.filename);
  return new Response(Buffer.from(result.bytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${result.filename.replace(/"/g, '')}"; filename*=UTF-8''${encoded}`,
      'cache-control': 'no-store',
    },
  });
}
