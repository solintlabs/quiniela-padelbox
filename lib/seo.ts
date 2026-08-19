const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.quinielabox.com';

/**
 * Datos estructurados (schema.org) para las páginas públicas.
 *
 * Google los usa para entender de qué va cada página y para los resultados
 * enriquecidos (migas de pan, desplegables de preguntas). Vive aquí para que
 * todas las guías emitan lo mismo y no se olvide ninguna.
 */

export interface FaqItem {
  q: string;
  a: string;
}

/** Preguntas frecuentes → desplegables en el resultado de búsqueda. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/** Artículo: le dice a Google que esto es contenido editorial, no una landing. */
export function articleJsonLd({
  slug,
  title,
  description,
  published,
}: {
  slug: string;
  title: string;
  description: string;
  /** ISO. Sin fecha, Google la infiere (peor). */
  published: string;
}) {
  const url = `${SITE}/guias/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    inLanguage: 'es',
    datePublished: published,
    dateModified: published,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'QuinielaBOX', url: SITE },
    publisher: {
      '@type': 'Organization',
      name: 'QuinielaBOX',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/icon.svg` },
    },
  };
}

/** Migas de pan: Google las pinta en vez de la URL cruda. */
export function breadcrumbJsonLd(slug: string, title: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Guías', item: `${SITE}/guias` },
      { '@type': 'ListItem', position: 3, name: title, item: `${SITE}/guias/${slug}` },
    ],
  };
}
