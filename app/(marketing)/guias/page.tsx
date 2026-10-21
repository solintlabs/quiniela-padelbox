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
        <p>
          Montar una quiniela es fácil. Que llegue viva a la última jornada, no.
          La mayoría no mueren por falta de interés: mueren porque nadie escribió
          las reglas antes de empezar, porque el organizador se cansó de copiar
          resultados a mano, o porque a mitad de torneo el primero se escapó y el
          resto dejó de tener algo por lo que jugar.
        </p>
        <p>
          Estas guías son lo que hemos aprendido organizando quinielas reales
          durante torneos completos. Están escritas para quien organiza —que es
          quien carga con el trabajo— y cada una se puede leer suelta.
        </p>

        <div className="gu__list">
          {GUIAS.map((g) => (
            <Link key={g.slug} href={`/guias/${g.slug}`} className="gu__card">
              <h2>{g.title}</h2>
              <p>{g.excerpt}</p>
            </Link>
          ))}
        </div>

        <h2>Por dónde empezar</h2>
        <p>
          Si es tu primera vez, lee{' '}
          <Link href="/guias/como-organizar-una-quiniela">
            cómo organizar una quiniela paso a paso
          </Link>
          : es la guía tronco y enlaza al resto cuando toca profundizar. Justo
          después, la de{' '}
          <Link href="/guias/sistemas-de-puntos">sistemas de puntos</Link>, porque
          esa decisión define qué tipo de torneo vas a tener.
        </p>
        <p>
          Si ya sabes lo que haces y lo que buscas es resolver un caso concreto:
        </p>
        <ul>
          <li>
            <strong>Un torneo largo.</strong> Una liga son muchas jornadas y el
            enemigo es el abandono:{' '}
            <Link href="/guias/quiniela-de-laliga">
              quiniela de LaLiga para toda la temporada
            </Link>
            .
          </li>
          <li>
            <strong>Un torneo corto y con formato raro.</strong> Fase de grupos
            más eliminatorias cambia cómo hay que repartir los puntos:{' '}
            <Link href="/guias/quiniela-mundial-2026">
              quiniela del Mundial 2026
            </Link>
            .
          </li>
          <li>
            <strong>En el trabajo.</strong> Tiene sus propias reglas no escritas:{' '}
            <Link href="/guias/porra-de-futbol-oficina">
              la porra de la oficina
            </Link>
            .
          </li>
          <li>
            <strong>Se te va de las manos la hoja de cálculo.</strong> Qué tiene
            que hacer por ti una herramienta, y cuándo no hace falta ninguna:{' '}
            <Link href="/guias/aplicacion-para-quinielas">
              aplicación para quinielas
            </Link>
            .
          </li>
        </ul>

        <h2>El mismo juego, distintos nombres</h2>
        <p>
          Es el mismo juego en todas partes, pero cada país lo llama a su manera
          y lo juega con sus costumbres. Por eso hay una guía por cada versión,
          escrita en el habla de su sitio:{' '}
          <Link href="/guias/penca-de-futbol">penca</Link> en Uruguay,{' '}
          <Link href="/guias/prode-como-armarlo">prode</Link> en Argentina,{' '}
          <Link href="/guias/polla-futbolera">polla</Link> en Venezuela y
          Colombia, y <Link href="/guias/porra-de-futbol-oficina">porra</Link> en
          España. Si organizas para un grupo de varios países, elige un nombre y
          unas reglas desde el principio: media discusión de las quinielas
          mixtas es gente dando por supuesto lo que se hace en su casa.
        </p>

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
