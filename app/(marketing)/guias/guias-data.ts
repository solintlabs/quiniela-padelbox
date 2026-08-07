/**
 * Artículos publicados. Vive fuera de page.tsx porque Next solo permite
 * exports concretos en una página (metadata, default…): exportar la lista
 * desde allí rompía el build.
 *
 * Añadir una guía aquí la mete en el índice; recuerda sumarla al sitemap.
 */
export const GUIAS = [
  {
    slug: 'polla-futbolera',
    title: 'Polla futbolera: cómo armarla con tu grupo',
    excerpt:
      'Así se llama la quiniela en Venezuela y Colombia. Reglas, cuota, reparto del bote y los errores que la matan a mitad de torneo.',
  },
  {
    slug: 'prode-como-armarlo',
    title: 'Prode: cómo armarlo con tus amigos',
    excerpt:
      'El prode argentino, paso a paso: puntaje, cierre de pronósticos, cobro del pozo y cómo evitar que muera en la planilla.',
  },
  {
    slug: 'porra-de-futbol-oficina',
    title: 'La porra de fútbol de la oficina: cómo montarla',
    excerpt:
      'Cuánto poner, qué reglas fijar y cómo repartir para que la porra del trabajo aguante las 38 jornadas.',
  },
  {
    slug: 'aplicacion-para-quinielas',
    title: 'Aplicación para quinielas: qué debe tener y cuál usar',
    excerpt:
      'Excel y WhatsApp se quedan cortos a la segunda jornada. Lo que tiene que hacer por ti una app de quinielas de verdad, y cómo elegirla.',
  },
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
