import { requireUserApi } from '@/lib/permissions';
import { requireSaasEnabled } from '@/lib/saas/flags';
import { listLeagues, filterLeagues } from '@/lib/saas/providers/espn';

/**
 * GET /api/saas/leagues?q=liga — catálogo de ligas de ESPN para el wizard.
 *
 * Exige sesión: el catálogo es barato de servir pero no hay motivo para
 * dejarlo abierto a cualquiera. ESPN solo se llama desde el servidor.
 */
export const dynamic = 'force-dynamic';

const MAX_RESULTS = 40;

export async function GET(req: Request): Promise<Response> {
  const off = requireSaasEnabled();
  if (off) return off;

  const user = await requireUserApi(req);
  if (user instanceof Response) return user;

  const query = new URL(req.url).searchParams.get('q') ?? '';

  try {
    const all = await listLeagues();
    const matches = filterLeagues(all, query);
    return Response.json({
      total: matches.length,
      leagues: matches.slice(0, MAX_RESULTS),
    });
  } catch (e) {
    console.error('[saas/leagues] ESPN no responde:', e);
    // ESPN caído no debe romper el alta: el organizador siempre puede tirar
    // de modo manual o CSV.
    return Response.json(
      {
        total: 0,
        leagues: [],
        warning: 'El catálogo de ligas no está disponible ahora mismo. Puedes crear la competición a mano.',
      },
      { status: 200 },
    );
  }
}
