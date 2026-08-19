import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo de “porra de fútbol” (España) con el ángulo de oficina:
 * es una intención muy concreta y con poca competencia, y las empresas son
 * el cliente que más rápido pasa a Pro (grupos grandes).
 */
const SLUG = 'porra-de-futbol-oficina';
const DESCRIPTION =
  'Cómo montar la porra de fútbol de la oficina: reglas, puntos, cuánto poner y cómo repartir. Guía práctica y app gratis para llevarla sin hojas de cálculo.';

export const metadata: Metadata = {
  title: 'Porra de fútbol de la oficina: cómo montarla (guía + app gratis)',
  description: DESCRIPTION,
  keywords: [
    'porra de futbol', 'porra oficina', 'porra entre amigos', 'como hacer una porra de futbol',
    'app para porras', 'porra futbol trabajo', 'organizar porra',
  ],
  alternates: { canonical: `/guias/${SLUG}` },
  openGraph: {
    title: 'Porra de fútbol de la oficina: cómo montarla',
    description: DESCRIPTION,
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Cómo se hace una porra de fútbol?',
    a: 'Reúne a los participantes, fija una cuota, escribe las reglas y los puntos antes del primer partido, recoge los pronósticos antes de cada encuentro y lleva la clasificación al día. Gana quien más puntos suma al final. Una app como QuinielaBOX automatiza resultados, puntos y clasificación.',
  },
  {
    q: '¿Cuánto se suele poner en una porra de oficina?',
    a: 'Lo habitual son cantidades pequeñas, entre 5 y 20 euros por persona, para que entre todo el mundo. Con muchos participantes el bote sale grande igualmente y el ambiente es mejor que con cuotas altas.',
  },
  {
    q: '¿Cómo se reparte el bote de la porra?',
    a: 'El reparto más común es 60% para el primero, 30% para el segundo y 10% para el tercero. Reservar una parte para premios semanales mantiene enganchada a la gente que va por detrás.',
  },
  {
    q: '¿Hay una app gratis para llevar la porra de la oficina?',
    a: 'Sí. QuinielaBOX es gratis hasta 15 jugadores: los resultados se actualizan solos, los puntos se calculan automáticamente y cada compañero ve la clasificación desde su móvil. El dinero lo gestiona el organizador fuera de la app.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="La porra de fútbol de la oficina: cómo montarla"
      lede="La porra del trabajo es el mejor invento para una temporada larga. También la que peor acaba cuando alguien la lleva en un Excel compartido."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Por qué la porra de oficina funciona tan bien</h2>
      <p>
        Da conversación todas las semanas, mezcla a gente de departamentos que no
        se hablan y no exige saber de fútbol: cualquiera puede acertar un 1-0. Por
        eso funciona mejor que casi cualquier actividad de equipo.
      </p>
      <p>
        Lo que la mata no es el interés, es la <strong>gestión</strong>: alguien
        acaba copiando resultados a mano y respondiendo “¿cómo voy?” cada lunes.
      </p>

      <h2>1. Cuánto se pone</h2>
      <p>
        En una oficina lo que importa es que <strong>entre todo el mundo</strong>,
        no que el bote sea enorme. Una cuota de 5–20 € por persona es lo típico.
        Con 40 compañeros a 10 €, el bote son 400 € — de sobra.
      </p>
      <div className="gu__note">
        <p>
          <strong>Importante:</strong> mantén el dinero fuera de cualquier
          aplicación. Lo recoge y reparte una persona, como siempre. Así es una
          porra entre compañeros y nada más.
        </p>
      </div>

      <h2>2. Reglas en un sitio donde todos las vean</h2>
      <ul>
        <li>
          <strong>Puntos.</strong> El estándar: 3 por marcador exacto, 1 por
          acertar el ganador, 0 si fallas. Variantes en la{' '}
          <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
        </li>
        <li>
          <strong>Cierre:</strong> al empezar cada partido. Sin excepciones, o
          alguien siempre llega tarde “pero ya lo tenía pensado”.
        </li>
        <li>
          <strong>Prórroga y penaltis:</strong> normalmente cuenta el resultado a
          los 90 minutos.
        </li>
        <li>
          <strong>Desempate</strong> y <strong>reparto del bote</strong>.
        </li>
      </ul>

      <h2>3. Cobra antes del primer partido</h2>
      <p>
        Es la regla que más disgustos ahorra. Quien paga después de ver la
        clasificación, no paga. Deja la lista de pagados a la vista.
      </p>

      <h2>4. Reparte en varios tramos</h2>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Puesto</th>
              <th>Del bote</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1º</td><td>60%</td></tr>
            <tr><td>2º</td><td>30%</td></tr>
            <tr><td>3º</td><td>10%</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        En una temporada larga, guarda una parte para{' '}
        <strong>premios por jornada</strong>. Es lo que evita que en noviembre ya
        solo jueguen cuatro.
      </p>

      <h2>5. Que la gestión no recaiga en una persona</h2>
      <p>
        Una temporada de liga son 38 jornadas. Si cada semana hay que copiar
        marcadores, sumar puntos y actualizar una hoja, la porra no llega a
        Navidad.
      </p>
      <p>
        Con una <Link href="/guias/aplicacion-para-quinielas">app para porras y quinielas</Link>{' '}
        cada compañero mete sus pronósticos desde el móvil, los resultados entran
        solos y la clasificación se actualiza sin que nadie toque nada.
      </p>

      <h2>Errores típicos</h2>
      <ul>
        <li>Que las reglas vivan en la cabeza del organizador.</li>
        <li>Aceptar pronósticos tarde “por esta vez”.</li>
        <li>Perseguir a la gente para cobrar a mitad de temporada.</li>
        <li>Premiar solo al ganador en un torneo de 38 jornadas.</li>
      </ul>
    </GuiaShell>
  );
}
