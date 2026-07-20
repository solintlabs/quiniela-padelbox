/**
 * Slugs de tenant. Puro, sin DB.
 *
 * El slug es el identificador público del comercio y viaja en la URL
 * (/saas/[tenant]/...). Cuando en el futuro pasemos a subdominios será
 * además el subdominio, así que ya lo restringimos a lo que un DNS acepta.
 */

/**
 * Slugs que no puede registrar nadie. Dos motivos:
 *  - Colisión de rutas: /saas/nueva es el onboarding, no un tenant llamado
 *    "nueva". Si alguien registrase ese slug, secuestraría la ruta.
 *  - Suplantación: "admin", "soporte" o "billing" invitan al phishing.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // rutas hermanas dentro de /saas
  'nueva', 'new', 'onboarding', 'signup', 'registro',
  // infraestructura
  'api', 'admin', 'saas', 'www', 'app', 'cron', 'static', 'public', 'assets',
  '_next', 'webhook', 'webhooks', 'stripe', 'billing', 'checkout',
  // auth y legales
  'login', 'logout', 'auth', 'account', 'cuenta', 'privacy', 'terms', 'soporte',
  'support', 'help', 'ayuda',
  // marca
  'quinielabox', 'solint', 'padelbox',
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

/**
 * Convierte texto libre ("Club Padelista del Este!") en un slug candidato
 * ("club-padelista-del-este"). Quita acentos, colapsa separadores y recorta
 * guiones sobrantes. NO garantiza que el resultado sea válido — para eso
 * está isValidSlug.
 */
export function normalizeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // marcas diacríticas (acentos, tildes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, ''); // el slice puede dejar un guion colgando
}

export function isValidSlug(slug: string): boolean {
  if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) return false;
  if (!SLUG_RE.test(slug)) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return true;
}
