/**
 * Flag maestro del SaaS multi-tenant.
 *
 * Mientras `SAAS_ENABLED` no valga exactamente "true", TODA la superficie
 * nueva (`/saas/*` y `/api/saas/*`) responde 404. La quiniela de PADELBOX y
 * los endpoints que consume la app móvil viven fuera de este flag y no lo
 * consultan nunca.
 *
 * Default deliberadamente cerrado: cualquier valor distinto de "true"
 * (incluido undefined, "1", "yes") deja el SaaS invisible.
 */
export function isSaasEnabled(): boolean {
  return process.env.SAAS_ENABLED === 'true';
}

/**
 * Guard para route handlers de `/api/saas/*`. Los layouts de React no cubren
 * las rutas API, así que cada handler llama a esto primero.
 *
 * Devuelve un 404 cuando el SaaS está apagado, o null cuando puede seguir.
 * Mismo contrato que `verifyCronSecret` en lib/permissions.ts.
 *
 *   const off = requireSaasEnabled();
 *   if (off) return off;
 */
export function requireSaasEnabled(): Response | null {
  if (isSaasEnabled()) return null;
  return new Response(JSON.stringify({ error: 'No encontrado' }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  });
}
