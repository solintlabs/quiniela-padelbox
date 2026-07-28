import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from './GuiaShell';
import './guias.css';

export const metadata: Metadata = {
  title: 'Guías para organizar tu quiniela de fútbol | QuinielaBOX',
  description:
    'Cómo organizar una quiniela de fútbol: sistemas de puntos, reglas, cómo cobrar el bote y repartir premios. Guías prácticas para clubes, peñas y grupos de amigos.',
  alternates: { canonical: '/guias' },
  openGraph: {
    title: 'Guías para organizar tu quiniela de fútbol',
    description:
      'Sistemas de puntos, reglas, bote y premios. Todo lo que necesitas para montar una quiniela que funcione.',
    type: 'website',
  },
};

/** Artículos publicados. Añadir uno aquí lo mete en el índice y el sitemap. */
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

export default function GuiasPage() {
  return (
    <>
      <GuiaShell
        eyebrow="Guías"
        title="Cómo montar una quiniela que funcione"
        lede="Lo que hemos aprendido organizando quinielas de verdad: reglas claras, puntos justos y un bote que nadie discute."
        cta={false}
      >
        <div className="gu__list">
          {GUIAS.map((g) => (
            <Link key={g.slug} href={`/guias/${g.slug}`} className="gu__card">
              <h2>{g.title}</h2>
              <p>{g.excerpt}</p>
            </Link>
          ))}
        </div>

        <section className="gu__cta">
          <h2>¿Prefieres que lo haga la app?</h2>
          <p>
            QuinielaBOX se encarga de los resultados, los puntos y el ranking. Tú
            solo repartes el bote.
          </p>
          <Link href="/saas/nueva" className="gu__btn">
            Crear mi quiniela gratis
          </Link>
          <Link href="/demo" className="gu__alt">
            o prueba la demo sin registrarte →
          </Link>
        </section>
      </GuiaShell>
    </>
  );
}
