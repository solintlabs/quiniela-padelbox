import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import '../guias.css';

export const metadata: Metadata = {
  title: 'Quiniela del Mundial 2026: cómo montarla',
  description:
    'Cómo organizar la quiniela del Mundial 2026: 48 selecciones, fase de grupos y eliminatorias. Reglas, puntos, calendario y reparto del bote.',
  alternates: { canonical: '/guias/quiniela-mundial-2026' },
  openGraph: {
    title: 'Quiniela del Mundial 2026: cómo montarla',
    description:
      'El formato de 48 equipos cambia las reglas del juego. Cómo adaptar tu quiniela para que se decida en la final.',
    type: 'article',
  },
};

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Quiniela del Mundial 2026: cómo montarla"
      lede="El Mundial de 2026 trae 48 selecciones y más partidos que nunca. Eso cambia cómo hay que plantear la quiniela."
      slug="quiniela-mundial-2026"
      description="Cómo montar la quiniela del Mundial 2026: reglas para 48 selecciones, puntos recomendados y cómo evitar que se decida demasiado pronto."
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Qué cambia con 48 equipos</h2>
      <p>
        Más selecciones significa <strong>muchos más partidos</strong> y, sobre todo,
        más partidos desiguales en la primera fase. Dos consecuencias para tu
        quiniela:
      </p>
      <ul>
        <li>
          <strong>La fase de grupos separa poco.</strong> Casi todos aciertan los
          favoritos, así que las diferencias de puntos serán pequeñas al principio.
        </li>
        <li>
          <strong>Hay mucho que rellenar.</strong> Si tu grupo tiene que meter cada
          marcador a mano en una hoja, la gente abandona.
        </li>
      </ul>

      <h2>Cómo evitar que se decida demasiado pronto</h2>
      <p>
        El riesgo de un torneo largo es que alguien coja ventaja y el resto pierda
        interés. Tres formas de evitarlo:
      </p>
      <ol>
        <li>
          <strong>Pick de campeón con bonus alto.</strong> Cada uno elige quién
          levantará el trofeo antes del primer partido. Con un bonus grande (+25
          puntos), la final puede darle la vuelta a la clasificación.
        </li>
        <li>
          <strong>Premios por jornada.</strong> Guarda una parte del bote para el
          mejor de cada semana: da algo que ganar aunque vayas último.
        </li>
        <li>
          <strong>Más peso a las eliminatorias.</strong> Puedes doblar los puntos a
          partir de octavos, cuando los partidos son de verdad difíciles.
        </li>
      </ol>

      <h2>Reglas específicas que debes dejar claras</h2>
      <div className="gu__note">
        <p>
          <strong>La más importante:</strong> en eliminatorias, ¿cuenta el resultado
          a los 90 minutos o el que incluye prórroga y penales? Lo estándar es{' '}
          <strong>a los 90 minutos</strong>. Déjalo escrito antes de que haya un
          partido decidido en penales.
        </p>
      </div>
      <ul>
        <li>
          <strong>Cierre de pronósticos:</strong> al pitido inicial de cada partido.
        </li>
        <li>
          <strong>Pick de campeón:</strong> se congela cuando arranca el torneo, no
          se puede cambiar después.
        </li>
        <li>
          <strong>Partidos aplazados:</strong> qué pasa si uno se mueve de fecha.
        </li>
      </ul>

      <h2>Puntos recomendados para el Mundial</h2>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Acierto</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Marcador exacto</td>
              <td>3</td>
            </tr>
            <tr>
              <td>Acertar el ganador</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Acertar el campeón</td>
              <td>+25</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Es el sistema que usamos en la quiniela con la que nació QuinielaBOX, y
        aguantó el interés hasta el último partido. Si quieres afinar más, mira la{' '}
        <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
      </p>

      <h2>Lo que no deberías hacer a mano</h2>
      <p>
        Un Mundial son decenas de partidos por cada participante. Meter resultados,
        calcular puntos y actualizar la clasificación a mano es lo que hace que las
        quinielas se abandonen a mitad. Deja que eso lo haga una herramienta: los
        resultados entran solos y la clasificación se actualiza sin que toques nada.
      </p>
      <p>
        Si es tu primera vez organizando, empieza por la{' '}
        <Link href="/guias/como-organizar-una-quiniela">guía paso a paso</Link>.
      </p>
    </GuiaShell>
  );
}
