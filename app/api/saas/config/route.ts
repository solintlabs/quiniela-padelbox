import { requireSaasEnabled } from '@/lib/saas/flags';
import { buildMobileConfig } from '@/lib/saas/mobileConfig';

/**
 * GET /api/saas/config — config pública para la app móvil: planes, el
 * interruptor remoto de "Subir a Pro" y las plantillas de URL hacia la web.
 *
 * Sin auth a propósito: es la misma información que enseña la landing y la
 * app la necesita también antes del login.
 */
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const off = requireSaasEnabled();
  if (off) return off;

  return Response.json(
    buildMobileConfig({
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com',
      upgradeFlag: process.env.MOBILE_UPGRADE_ENABLED,
    }),
  );
}
