import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo estacional: la quiniela de una liga larga (LaLiga, Premier,
 * Liga MX…). Se publica al arranque de temporada, que es cuando la gente busca
 * cómo montarla. Una liga son 38 jornadas: el ángulo es la permanencia.
 */
const SLUG = 'quiniela-de-laliga';
const DESCRIPTION =
  'Cómo montar la quiniela de LaLiga con tus amigos para toda la temporada: reglas, puntos, premios por jornada y cómo evitar que se muera en noviembre.';

export const metadata: Metadata = {
  title: 'Quiniela de LaLiga entre amigos: cómo montarla para toda la temporada',
  description: DESCRIPTION,
  keywords: [
    'quiniela de laliga', 'quiniela liga entre amigos', 'porra de laliga',
    'quiniela temporada futbol', 'app quiniela liga', 'quiniela jornada a jornada',
  ],
  alternates: { canonical: `/guias/${SLUG}` },
  openGraph: {
    title: 'Quiniela de LaLiga entre amigos: cómo montarla',
    description: DESCRIPTION,
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Cómo se hace una quiniela de LaLiga entre amigos?',
    a: 'Reúne al grupo, fija una cuota por temporada, define los puntos antes de la primera jornada y recoge los pronósticos antes de cada partido. Con una app los resultados y la clasificación se actualizan solos durante las 38 jornadas.',
  },
  {
    q: '¿Hay que pronosticar los 380 partidos de la temporada?',
    a: 'No. Lo habitual es pronosticar jornada a jornada: cada semana pones tus marcadores de los partidos de esa jornada y los que no rellenes simplemente no puntúan. Así nadie tiene que sentarse a rellenar la temporada entera de golpe.',
  },
  {
    q: '¿Cómo evito que la quiniela se muera a mitad de temporada?',
    a: 'Reparte premios por jornada además del premio final y manda recordatorios antes de cada cierre. Lo que mata una quiniela larga es que quien va por detrás deje de tener algo que ganar y que la gente olvide pronosticar.',
  },
  {
    q: '¿Se puede llevar la quiniela de la liga gratis?',
    a: 'Sí. QuinielaBOX es gratis hasta 15 jugadores, con resultados automáticos de LaLiga y del resto de ligas, clasificación en vivo y recordatorios. El bote lo gestiona el organizador fuera de la app.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="La quiniela de LaLiga entre amigos, para toda la temporada"
      lede="Una liga son 38 jornadas. Montarla es fácil; lo difícil es que en noviembre siga jugando alguien más que tú."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Liga o torneo: no es lo mismo</h2>
      <p>
        Una quiniela de Mundial dura un mes y se sostiene sola por la emoción del
        torneo. Una de <strong>liga</strong> dura nueve meses. Eso cambia dos
        cosas:
      </p>
      <ul>
        <li>
          <strong>Nadie va a rellenar 380 partidos de golpe.</strong> Se juega
          jornada a jornada.
        </li>
        <li>
          <strong>El que se descuelga, abandona.</strong> Si a la jornada 15 ya
          no puede ganar, deja de pronosticar.
        </li>
      </ul>

      <h2>1. Cuota por temporada, cobrada al principio</h2>
      <p>
        En una liga se cobra una vez, al empezar. Una cantidad pequeña por
        persona: lo que importa es que entren todos, no que el bote sea enorme.
        Persigue el cobro antes de la jornada 1 y no volverás a hablar de dinero
        hasta mayo.
      </p>

      <h2>2. Puntos: el clásico funciona</h2>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Acierto</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Marcador exacto</td><td>3</td></tr>
            <tr><td>Acertar el ganador</td><td>1</td></tr>
            <tr><td>Fallo</td><td>0</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        En una liga larga viene bien añadir un{' '}
        <strong>extra por clavar un empate</strong>: son los más difíciles y
        premiarlos evita que todo el mundo ponga 1-0 a los favoritos. Más
        opciones en la{' '}
        <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
      </p>

      <h2>3. Premios por jornada: lo que la mantiene viva</h2>
      <div className="gu__note">
        <p>
          <strong>Este es el consejo que más cambia una quiniela de liga.</strong>{' '}
          Guarda una parte del bote para el mejor de cada jornada. Quien va
          decimoquinto sigue teniendo algo que ganar el domingo, y por eso sigue
          jugando.
        </p>
      </div>
      <p>Un reparto que funciona en temporada larga:</p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Del bote</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1º de la temporada</td><td>45%</td></tr>
            <tr><td>2º</td><td>20%</td></tr>
            <tr><td>3º</td><td>10%</td></tr>
            <tr><td>Premios por jornada</td><td>25%</td></tr>
          </tbody>
        </table>
      </div>

      <h2>4. Recordatorios: la diferencia entre 20 y 6 jugadores</h2>
      <p>
        La razón número uno por la que alguien deja una quiniela de liga no es
        que vaya perdiendo: es que <strong>se le olvidó pronosticar</strong> dos
        jornadas seguidas, se descolgó y ya no volvió. Un aviso antes de cada
        cierre lo evita.
      </p>

      <h2>5. No la lleves a mano</h2>
      <p>
        38 jornadas × 10 partidos × 20 personas son miles de datos. Con una{' '}
        <Link href="/guias/aplicacion-para-quinielas">app para quinielas</Link>{' '}
        los resultados de LaLiga entran solos, los puntos se calculan solos y la
        clasificación está siempre al día.
      </p>
      <p>
        Si es tu primera vez organizando, empieza por la{' '}
        <Link href="/guias/como-organizar-una-quiniela">guía paso a paso</Link>.
      </p>
    </GuiaShell>
  );
}
