import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // El rastreador de AdSense va primero y sin restricciones: necesita ver
      // las páginas donde se sirven anuncios para aprobarlas y para elegir
      // anuncios relevantes. Las reglas de abajo son para los buscadores.
      { userAgent: 'Mediapartners-Google', allow: '/' },
      { userAgent: 'AdsBot-Google', allow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/onboarding',
          '/account/',
          '/cuadro',
          '/mis-pronosticos',
          '/partidos',
          '/perfil',
          '/predecir-grupos',
          '/ranking',
          '/reglas',
          '/usuarios',
          '/inscripcion',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
