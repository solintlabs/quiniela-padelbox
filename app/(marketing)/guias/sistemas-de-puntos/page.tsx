import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import '../guias.css';

export const metadata: Metadata = {
  title: 'Sistemas de puntos para una quiniela: cuál elegir | QuinielaBOX',
  description:
    'Comparativa de sistemas de puntuación para quinielas de fútbol: 3/1/0, diferencia de goles, bonus por empate y pick de campeón. Cuál usar según tu grupo.',
  alternates: { canonical: '/guias/sistemas-de-puntos' },
  openGraph: {
    title: 'Sistemas de puntos para una quiniela: cuál elegir',
    description:
      'El 3/1/0 clásico y sus variantes. Qué premia cada sistema y cómo evitar que el torneo se decida demasiado pronto.',
    type: 'article',
  },
};

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Sistemas de puntos: cuál elegir para tu quiniela"
      lede="El sistema de puntos decide qué tipo de juego tendrás: uno conservador, uno arriesgado, o uno que se decide en el último partido."
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>El clásico: 3 / 1 / 0</h2>
      <p>
        Es el más usado y el que todo el mundo entiende sin explicaciones:
      </p>
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
              <td>Solo el ganador (o el empate)</td>
              <td>1</td>
            </tr>
            <tr>
              <td>Fallo</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>Cuándo usarlo:</strong> siempre que sea tu primera quiniela, o si el
        grupo es grande y variado. Es imposible de discutir.
      </p>

      <h2>Variante: puntos por diferencia de goles</h2>
      <p>
        Suma puntos si aciertas por cuántos goles gana un equipo, aunque falles el
        marcador. Pones 2-0 y acaba 3-1: fallaste el resultado, pero acertaste que
        ganaba por dos.
      </p>
      <p>
        <strong>Qué cambia:</strong> premia a quien piensa el partido en vez de poner
        1-0 a todo. Hace la clasificación más apretada.
      </p>

      <h2>Variante: bonus por acertar un empate</h2>
      <p>
        Los empates son lo más difícil de predecir, así que casi nadie los arriesga.
        Un punto extra por clavar un empate hace que la gente se atreva.
      </p>

      <h2>El pick de campeón (el que cambia el final)</h2>
      <p>
        Cada jugador elige al principio quién ganará el torneo, y ese pick se congela
        cuando arranca. Si acierta, se lleva un bonus grande (por ejemplo{' '}
        <strong>+25 puntos</strong>).
      </p>
      <div className="gu__note">
        <p>
          <strong>Por qué merece la pena:</strong> mantiene viva la quiniela hasta el
          último día. Aunque alguien vaya 15 puntos por delante, el bonus del campeón
          puede darle la vuelta a todo en la final.
        </p>
      </div>

      <h2>Cómo elegir según tu grupo</h2>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Si tu grupo…</th>
              <th>Usa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Es la primera vez / muy variado</td>
              <td>3 / 1 / 0</td>
            </tr>
            <tr>
              <td>Sabe mucho de fútbol</td>
              <td>3/1/0 + diferencia de goles</td>
            </tr>
            <tr>
              <td>Es un torneo largo (liga)</td>
              <td>3/1/0 + bonus de empate</td>
            </tr>
            <tr>
              <td>Es un torneo corto (Mundial, Euro)</td>
              <td>3/1/0 + pick de campeón</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Dos avisos</h2>
      <ul>
        <li>
          <strong>El marcador exacto nunca debe valer menos que acertar el
          ganador.</strong> Suena obvio, pero se ve: si acumulas parciales sin
          cuidado, clavar el resultado puede pagar menos que fallar “con estilo”.
        </li>
        <li>
          <strong>No cambies los puntos a mitad de torneo</strong> sin recalcular
          todo. Si lo haces, recalcula desde el principio para que nadie salga
          perjudicado.
        </li>
      </ul>
      <p>
        En QuinielaBOX puedes ajustar cuánto vale cada acierto y recalcular la
        clasificación entera con un botón.
      </p>
    </GuiaShell>
  );
}
