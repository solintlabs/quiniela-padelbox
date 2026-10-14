import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from './GuiaShell';
import { GUIAS } from './guias-data';
import './guias.css';

export const metadata: Metadata = {
  title: 'Guías para organizar tu quiniela de fútbol',
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
