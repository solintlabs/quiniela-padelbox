/**
 * Artículos publicados. Vive fuera de page.tsx porque Next solo permite
 * exports concretos en una página (metadata, default…): exportar la lista
 * desde allí rompía el build.
 *
 * Añadir una guía aquí la mete en el índice; recuerda sumarla al sitemap.
 */
export const GUIAS = [
  {
    slug: 'como-organizar-una-quiniela',
    title: 'Cómo organizar una quiniela de fútbol paso a paso',
    excerpt:
      'Desde juntar a los participantes hasta repartir el bote: el guion completo para que no se te caiga a medio torneo.',
  },
  {
    slug: 'sistemas-de-puntos',
    title: 'Sistemas de puntos: cuál elegir para tu quiniela',
    excerpt:
      'El 3/1/0 de toda la vida, la diferencia de goles, el bonus por empate y el pick de campeón. Ventajas y trampas de cada uno.',
  },
  {
    slug: 'quiniela-mundial-2026',
    title: 'Quiniela del Mundial 2026: cómo montarla',
    excerpt:
      '48 selecciones, fase de grupos y eliminatorias. Cómo adaptar las reglas para que el torneo se decida al final y no en la primera semana.',
  },
] as const;
