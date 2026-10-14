import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import '../guias.css';

export const metadata: Metadata = {
  title: 'Cómo organizar una quiniela de fútbol paso a paso',
  description:
    'Guía práctica para organizar una quiniela de fútbol: cuánta gente, qué cuota poner, cómo cobrar el bote, qué reglas fijar y cómo repartir los premios sin discusiones.',
  alternates: { canonical: '/guias/como-organizar-una-quiniela' },
  openGraph: {
    title: 'Cómo organizar una quiniela de fútbol paso a paso',
    description:
      'Cuota, reglas, cierre de pronósticos y reparto del bote. El guion completo para que tu quiniela no se caiga a medio torneo.',
    type: 'article',
  },
};

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Cómo organizar una quiniela de fútbol paso a paso"
      lede="Organizar una quiniela es fácil; que aguante hasta la final, no tanto. Esto es lo que marca la diferencia."
      slug="como-organizar-una-quiniela"
      description="Guía paso a paso para organizar una quiniela de fútbol: cuota, reglas, cierre de pronósticos, cobro del bote y reparto de premios."
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>1. Decide quién juega y cuánto se paga</h2>
      <p>
        Antes de nada, dos números: <strong>cuánta gente</strong> y{' '}
        <strong>cuánto pone cada uno</strong>. Una quiniela de amigos funciona con
        8–15 personas; la de un club, con 30–100.
      </p>
      <p>
        Sobre la cuota, el error típico es ponerla alta pensando en el premio. Si la
        cuota duele, la gente se lo piensa y no entra. Es mejor una cuota baja con
        mucha gente: el bote sale igual de grande y hay más ambiente.
      </p>
      <div className="gu__note">
        <p>
          <strong>Regla práctica:</strong> la cuota debe ser lo que tus participantes
          gastarían en un café o dos sin pensarlo. Ahí es donde entra todo el mundo.
        </p>
      </div>

      <h2>2. Fija las reglas ANTES de que empiece</h2>
      <p>
        Casi todas las discusiones de una quiniela vienen de reglas que no se
        escribieron. Deja por escrito, antes del primer partido:
      </p>
      <ul>
        <li>
          <strong>Cuánto vale cada acierto</strong> (ver la{' '}
          <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>).
        </li>
        <li>
          <strong>Cuándo cierran los pronósticos.</strong> Lo normal: al empezar el
          partido, o unos minutos antes. Sin cierre automático, siempre aparece
          alguien que “ya lo tenía pensado”.
        </li>
        <li>
          <strong>Qué marcador cuenta</strong> en eliminatorias: lo habitual es el
          resultado a los 90 minutos, sin prórroga ni penales.
        </li>
        <li>
          <strong>Cómo se desempata</strong> la clasificación final.
        </li>
        <li>
          <strong>Cómo se reparte el bote.</strong>
        </li>
      </ul>

      <h2>3. Elige cómo desempatar (esto se olvida siempre)</h2>
      <p>
        Dos personas empatadas a puntos en la última jornada es más común de lo que
        parece. El criterio más aceptado es:
      </p>
      <ol>
        <li>Más puntos.</li>
        <li>Más marcadores exactos acertados.</li>
        <li>Quien se apuntó antes (o un partido de desempate acordado).</li>
      </ol>
      <p>
        Lo importante no es cuál elijas, sino que esté decidido antes de que haya
        dinero de por medio.
      </p>

      <h2>4. Cobra el bote de forma ordenada</h2>
      <p>
        Aquí es donde se pierde más tiempo. Recomendaciones:
      </p>
      <ul>
        <li>
          <strong>Cobra antes del primer partido.</strong> Quien paga después de ver
          cómo va, no paga.
        </li>
        <li>
          <strong>Una sola forma de pago clara</strong> (transferencia, PayPal, Bizum,
          efectivo…) con los datos escritos, no dictados por chat.
        </li>
        <li>
          <strong>Lleva una lista de quién pagó.</strong> Y que sea visible: evita el
          “yo ya te pagué”.
        </li>
      </ul>
      <div className="gu__note">
        <p>
          En QuinielaBOX el organizador marca quién ha pagado y solo esos pueden
          pronosticar. El dinero lo sigues manejando tú, fuera de la app.
        </p>
      </div>

      <h2>5. Reparte los premios de forma que la gente siga jugando</h2>
      <p>
        Si solo premias al primero, a media temporada la mitad se desengancha porque
        ya no puede ganar. Reparte en varios tramos:
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Puesto</th>
              <th>Reparto habitual</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1º</td>
              <td>60%</td>
            </tr>
            <tr>
              <td>2º</td>
              <td>30%</td>
            </tr>
            <tr>
              <td>3º</td>
              <td>10%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Un truco que funciona muy bien: guarda una parte para{' '}
        <strong>premios por jornada</strong> (mejor pronóstico de la semana). Da a
        todos algo que ganar aunque vayan últimos.
      </p>

      <h2>6. Recuérdales que jueguen</h2>
      <p>
        Esta es la razón número uno por la que una quiniela muere: la gente se olvida
        de pronosticar, deja de sumar puntos y abandona. Manda un aviso antes de que
        cierren los partidos, o usa una herramienta que lo haga sola.
      </p>

      <h2>Errores que se repiten</h2>
      <ul>
        <li>Empezar sin las reglas escritas.</li>
        <li>Llevar los pronósticos a mano en una hoja de cálculo o por chat.</li>
        <li>No cerrar los pronósticos a tiempo.</li>
        <li>Premiar solo al ganador.</li>
        <li>Cobrar el bote a mitad del torneo.</li>
      </ul>
    </GuiaShell>
  );
}
