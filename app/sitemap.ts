import type { MetadataRoute } from 'next';
import { GUIAS } from '@/app/(marketing)/guias/guias-data';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/demo`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Guías públicas: es el contenido indexable que trae tráfico orgánico.
    {
      url: `${siteUrl}/guias`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // La lista viene de guias-data: añadir una guía allí la mete aquí sola.
    ...GUIAS.map((g) => ({
      url: `${siteUrl}/guias/${g.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/public/reglas`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/public/inscripcion`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/acerca`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/soporte`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];
}
