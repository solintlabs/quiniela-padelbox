import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
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
