import { notFound } from 'next/navigation';
import { isSaasEnabled } from '@/lib/saas/flags';

/**
 * Layout raíz de todo el SaaS multi-tenant.
 *
 * Con `SAAS_ENABLED` apagado (el default, y lo que hay en producción) este
 * layout devuelve 404 para cualquier ruta bajo /saas. Nada de lo que se
 * construya aquí dentro es alcanzable hasta que el flag se encienda a mano.
 */
export const dynamic = 'force-dynamic';

export default function SaasLayout({ children }: { children: React.ReactNode }) {
  if (!isSaasEnabled()) notFound();
  return <>{children}</>;
}
