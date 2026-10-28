/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/**
 * Hosts alias del mismo proyecto Vercel. Servían el sitio ENTERO como espejo
 * (tres dominios con las mismas páginas), que es contenido duplicado a ojos
 * de Google y de la revisión de AdSense. Solo deben seguir sirviendo /api:
 * la app móvil y el cron llevan quiniela.solint.cloud en duro.
 */
const ALIAS_HOSTS = ['quiniela.solint.cloud', 'quiniela-padelbox.vercel.app'];
const CANONICAL_ORIGIN = 'https://www.quinielabox.com';

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Lo que quede accesible en los alias (/api) no se indexa.
      ...ALIAS_HOSTS.map((host) => ({
        source: '/:path*',
        has: [{ type: 'host', value: host }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ];
  },
  async redirects() {
    return [
      // La landing pasó de /lanza-tu-quiniela a la raíz. Redirige los enlaces
      // y SEO viejos para que no den 404.
      { source: '/lanza-tu-quiniela', destination: '/', permanent: true },
      // Páginas en los alias → dominio canónico. /api y /_next se excluyen.
      ...ALIAS_HOSTS.map((host) => ({
        source: '/:path((?!api/|_next/).*)',
        has: [{ type: 'host', value: host }],
        destination: `${CANONICAL_ORIGIN}/:path`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
