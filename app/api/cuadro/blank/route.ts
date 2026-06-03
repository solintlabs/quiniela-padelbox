import { buildBlankCuadroPdf } from '@/lib/cuadro-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/cuadro/blank
 * Plantilla en blanco de la fase de grupos para rellenar a mano. Pública
 * (no contiene datos personales). Descargable / imprimible.
 */
export async function GET() {
  const result = await buildBlankCuadroPdf();
  const encoded = encodeURIComponent(result.filename);
  return new Response(Buffer.from(result.bytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${result.filename.replace(/"/g, '')}"; filename*=UTF-8''${encoded}`,
      'cache-control': 'public, max-age=3600',
    },
  });
}
