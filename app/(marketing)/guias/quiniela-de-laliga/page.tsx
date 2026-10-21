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
  'Cómo montar la quiniela de LaLiga entre amigos y que aguante las 38 jornadas: cuota, puntos, premios por jornada y por tramos, clasificaciones paralelas, parones, intersemanales, partidos aplazados y cierres de viernes a lunes.';

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
    a: 'Reparte premios por jornada y por tramos además del premio final, y añade clasificaciones paralelas (mes, segunda vuelta) para que quien va último siga teniendo algo abierto. Un recordatorio antes de cada cierre remata el trabajo: la mayoría de los abandonos empiezan con un olvido, no con una derrota.',
  },
  {
    q: '¿Qué pasa si una jornada se juega de viernes a lunes?',
    a: 'El cierre no debe ser de la jornada entera, sino partido a partido: cada pronóstico se bloquea cuando empieza su propio encuentro. Si cierras todo el viernes, castigas a quien aún no tenía información; si cierras todo el lunes, permites pronosticar partidos ya jugados.',
  },
  {
    q: '¿Y los partidos aplazados? En liga son habituales.',
    a: 'Deja escrito desde el principio que un partido aplazado se puntúa cuando se juegue, con el pronóstico que ya estaba guardado, y que la jornada no se cierra hasta entonces. La alternativa es anular el partido para todos, que es más simple pero desactiva el único encuentro que quizá decidía la jornada.',
  },
  {
    q: '¿Conviene cobrar toda la cuota de golpe o por tramos?',
    a: 'De golpe al principio es menos trabajo para el organizador y evita perseguir pagos en enero, cuando ya nadie quiere hablar de dinero. Cobrar por tramos baja la barrera de entrada y permite que alguien se sume más tarde, pero obliga a reabrir el cobro tres veces.',
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
        torneo: hay partidos casi todos los días, todo el mundo habla de lo
        mismo y nadie tiene tiempo de olvidarse. Una de <strong>liga</strong>{' '}
        dura nueve meses, con semanas sin nada que comentar y con parones de dos
        semanas en medio. Eso cambia tres cosas de raíz:
      </p>
      <ul>
        <li>
          <strong>Nadie va a rellenar 380 partidos de golpe.</strong> Se juega
          jornada a jornada, y el formato tiene que asumir que cada semana hay
          que volver a pedir pronósticos.
        </li>
        <li>
          <strong>El que se descuelga, abandona.</strong> Si a la jornada 15 ya
          no puede ganar nada, deja de pronosticar. Y cuando dos o tres dejan de
          jugar, el grupo pierde la gracia para el resto.
        </li>
        <li>
          <strong>El calendario es irregular.</strong> Jornadas repartidas de
          viernes a lunes, intersemanales, parones de selecciones, el de Navidad
          y partidos aplazados. Las reglas tienen que contemplarlo antes de que
          pase, no cuando ya ha pasado.
        </li>
      </ul>
      <p>
        El resto de esta guía orbita alrededor del problema número uno: el
        abandono a mitad de temporada. Todo lo demás (puntos, cuota, premios)
        existe para que en la jornada 30 sigan jugando los mismos que en la 1.
      </p>

      <h2>1. La cuota: de golpe o por tramos</h2>
      <h3>Cuota anual única, cobrada antes de la jornada 1</h3>
      <p>
        Es la opción por defecto y la más cómoda. Una cantidad pequeña por
        persona, cobrada entera al empezar: lo que importa es que entren todos,
        no que el bote sea enorme. Si persigues el cobro antes de la primera
        jornada, no vuelves a hablar de dinero hasta mayo. El inconveniente es
        que la barrera de entrada es más alta justo cuando nadie sabe todavía si
        la quiniela le va a gustar.
      </p>
      <h3>Cuota por tramos</h3>
      <p>
        Dividir la temporada en tres bloques y cobrar al inicio de cada uno.
        Baja la barrera de entrada, permite que alguien se sume más tarde sin
        sentir que paga de más y da un punto de reenganche natural: al empezar un
        tramo nuevo se vuelve a hablar de la quiniela. A cambio, el organizador
        tiene que reabrir el cobro tres veces y arriesga que alguien no pague el
        último tramo y se marche.
      </p>
      <div className="gu__note">
        <p>
          <strong>Regla práctica:</strong> grupo de amigos consolidado, cuota
          anual única. Grupo nuevo, de oficina o con gente que no se conoce
          entre sí, mejor por tramos: ahí el riesgo no es el dinero, es que la
          mitad no llegue a entrar.
        </p>
      </div>

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
      <p>
        Lo importante en una temporada larga no es qué sistema eliges, sino que
        no lo cambies a mitad. Un sistema de puntos retocado en la jornada 12
        obliga a recalcular todo o a convivir con una clasificación que mezcla
        dos reglas, y es la clase de discusión que vacía grupos. Si quieres
        probar algo (bonus, multiplicadores, partido estrella), déjalo escrito
        antes de la primera jornada o guárdalo para la temporada siguiente.
      </p>

      <h2>3. Premios: por jornada, por tramos y al final</h2>
      <div className="gu__note">
        <p>
          <strong>Este es el consejo que más cambia una quiniela de liga.</strong>{' '}
          Un único premio final convierte la temporada en una carrera que se
          decide en diciembre: a partir de ahí, la mitad del grupo ya sabe que
          no gana y deja de jugar. Reparte el bote en el tiempo y siempre habrá
          algo abierto el domingo.
        </p>
      </div>
      <p>
        El reparto tiene tres niveles y cada uno resuelve un problema distinto.
        El <strong>premio por jornada</strong> da un horizonte de una semana:
        quien va decimoquinto sigue teniendo algo que ganar el próximo domingo.
        El <strong>premio por tramo</strong> da un horizonte de dos o tres meses
        y permite recuperarse, porque una mala racha en octubre no arruina el
        tramo de primavera. Y el <strong>premio final</strong> es el que da
        prestigio y hace que valga la pena ser regular nueve meses. Un reparto
        que funciona en temporada larga:
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Del bote</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1º de la temporada</td><td>35%</td></tr>
            <tr><td>2º de la temporada</td><td>15%</td></tr>
            <tr><td>3º de la temporada</td><td>8%</td></tr>
            <tr><td>Ganador de cada tramo (3 tramos)</td><td>18%</td></tr>
            <tr><td>Mejor de cada jornada</td><td>20%</td></tr>
            <tr><td>Reserva para desempates y sorpresas</td><td>4%</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Dos avisos sobre el premio por jornada. Primero: con grupos pequeños la
        cantidad por jornada es casi simbólica, y no importa: lo que engancha es
        el nombre en el mensaje del lunes, no el dinero. Segundo: define desde el
        principio qué pasa si empatan varios en una jornada. Lo más limpio es
        repartir a partes iguales; lo más divertido es acumular al bote de la
        jornada siguiente, que genera jornadas con premio doble y recupera a gente
        que llevaba semanas desconectada.
      </p>

      <h2>4. Clasificaciones paralelas: algo que ganar para el último</h2>
      <p>
        La clasificación general acumula desde la jornada 1, así que a mitad de
        temporada ya es irreversible para la mayoría. La solución es que no sea
        la única tabla que se mira. Con los mismos pronósticos y sin pedir nada
        extra al grupo, puedes publicar:
      </p>
      <ul>
        <li>
          <strong>Clasificación del mes.</strong> Se reinicia cada mes natural.
          Es la más efectiva porque el horizonte es corto y cualquiera puede
          ganarla desde cero.
        </li>
        <li>
          <strong>Clasificación de la segunda vuelta.</strong> Contar solo desde
          la jornada 20 crea literalmente una temporada nueva a mitad de curso.
          Anúnciala en la jornada 19, no en la 25.
        </li>
        <li>
          <strong>Racha de participación.</strong> Quién lleva más jornadas
          seguidas sin dejarse ninguna. Premia el hábito en vez del acierto, y
          es lo único que un jugador flojo puede ganar sin saber de fútbol.
        </li>
        <li>
          <strong>Marcadores exactos.</strong> Quién lleva más resultados
          clavados. Recompensa al que arriesga en lugar de poner 1-0 a todos los
          favoritos.
        </li>
      </ul>
      <p>
        No hace falta que todas lleven premio en dinero. Que exista la tabla y
        que se publique cada semana ya cambia el comportamiento: la gente juega
        por aparecer en alguna lista.
      </p>

      <h2>5. El cierre de pronósticos cuando la jornada se reparte entre viernes y lunes</h2>
      <p>
        En una liga la jornada no se juega de golpe: se reparte a lo largo de
        varios días. Eso rompe la idea de un cierre único por jornada, y es una
        de las primeras discusiones que aparecen.
      </p>
      <p>
        La única regla que no genera agravios es{' '}
        <strong>cierre partido a partido</strong>: cada pronóstico se bloquea
        cuando empieza su propio encuentro (o unos minutos antes, para dar margen
        a las alineaciones). Si cierras la jornada completa el viernes, castigas
        a quien aún no tenía información de bajas y lesiones. Si la cierras el
        lunes, estás permitiendo pronosticar partidos ya jugados.
      </p>
      <div className="gu__note">
        <p>
          <strong>Si lo llevas a mano,</strong> el cierre partido a partido es
          inviable: tendrías que estar pendiente de varios horarios al día, tres
          o cuatro días por semana, durante nueve meses. Es justo el punto donde
          una{' '}
          <Link href="/guias/aplicacion-para-quinielas">app para quinielas</Link>{' '}
          deja de ser un lujo y pasa a ser la condición para que la regla
          correcta sea aplicable.
        </p>
      </div>

      <h2>6. Parones, intersemanales y partidos aplazados</h2>
      <p>
        Cualquier temporada de liga tiene estas tres cosas. No sabes las fechas
        exactas de antemano, pero sabes que van a pasar, y conviene tener la
        respuesta escrita antes.
      </p>
      <h3>Los parones de selecciones y el de Navidad</h3>
      <p>
        Dos semanas sin jornada es tiempo suficiente para que un grupo pierda la
        costumbre. El parón no es un problema de reglas, es un problema de
        atención: la gente no se enfada, simplemente se olvida y no vuelve. Dos
        cosas que funcionan:
      </p>
      <ul>
        <li>
          <strong>Cerrar el tramo justo antes del parón</strong> y pagar el
          premio durante el parón. El grupo habla de la quiniela precisamente
          cuando no hay fútbol.
        </li>
        <li>
          <strong>Avisar al volver, no antes.</strong> Un mensaje el día que se
          reanuda la jornada, con la clasificación y lo que queda en juego, vale
          más que tres mensajes durante el parón.
        </li>
      </ul>
      <p>
        El parón navideño tiene un agravante: cae justo cuando la clasificación
        general empieza a estar decidida. Es el mejor momento para anunciar la
        clasificación de la segunda vuelta.
      </p>
      <h3>Jornadas intersemanales</h3>
      <p>
        Una jornada a mitad de semana es la que más olvidos provoca, porque rompe
        el hábito del fin de semana. Además, suele venir con partidos en horarios
        raros y con equipos rotando por competición europea. Dos medidas: un
        recordatorio específico el día anterior (no el mismo día), y no colocar
        el cierre de un tramo en una jornada intersemanal, donde la
        participación siempre baja.
      </p>
      <h3>Partidos aplazados</h3>
      <p>
        En liga son habituales, y hay que decidir qué hacer antes de que ocurra.
        Las dos opciones defendibles:
      </p>
      <ul>
        <li>
          <strong>Se puntúa cuando se juegue,</strong> con el pronóstico que ya
          estaba guardado, y la jornada queda abierta hasta entonces. Es lo más
          justo, porque nadie pierde el partido que había acertado, pero obliga a
          retrasar el premio de esa jornada.
        </li>
        <li>
          <strong>El partido se anula para todos</strong> y la jornada se cierra
          sin él. Es más simple y permite pagar el premio semanal a tiempo, a
          costa de desactivar un encuentro que quizá era el que decidía la
          jornada.
        </li>
      </ul>
      <p>
        Cualquiera de las dos sirve. Lo que no sirve es improvisar, porque quien
        tenía ese partido clavado se va a sentir perjudicado por la decisión
        tomada después de conocer los resultados.
      </p>

      <h2>7. El que se suma en la jornada 10</h2>
      <p>
        Pasa siempre: alguien ve la clasificación en el grupo y quiere entrar con
        la temporada empezada. Decir no es perder un jugador; decir sí sin
        reglas es romper la clasificación. Tres formas de resolverlo:
      </p>
      <ul>
        <li>
          <strong>Entra con cero puntos</strong> y paga cuota reducida en
          proporción a lo que queda. No puede ganar la general, pero puede ganar
          jornadas, tramos y las clasificaciones paralelas. Es la opción
          recomendada y la razón de más para tener esas tablas.
        </li>
        <li>
          <strong>Entra con la media del grupo</strong> en el momento de
          incorporarse, pagando cuota completa. Mantiene su opción a la general y
          no perjudica a nadie por arriba, pero sí altera la foto de la zona
          media.
        </li>
        <li>
          <strong>Entra solo al tramo siguiente,</strong> si cobras por tramos.
          La más limpia de todas: el tramo es un torneo completo que empieza para
          todos a la vez.
        </li>
      </ul>
      <p>
        Lo que nunca conviene es dejarle pronosticar jornadas pasadas sabiendo
        los resultados, aunque jure que no los mira. Esa norma, escrita el primer
        día, ahorra una discusión cantada.
      </p>

      <h2>8. Recordatorios: la diferencia entre 20 y 6 jugadores</h2>
      <p>
        La razón número uno por la que alguien deja una quiniela de liga no es
        que vaya perdiendo: es que <strong>se le olvidó pronosticar</strong> dos
        jornadas seguidas, se descolgó y ya no volvió. El olvido es el principio
        de casi todos los abandonos, y es la parte más fácil de arreglar.
      </p>
      <p>Lo que mejor funciona a lo largo de una temporada:</p>
      <ul>
        <li>
          <strong>Un aviso antes de cada cierre,</strong> no una lista de todos
          los partidos. Un mensaje accionable por jornada; más de eso se ignora y
          acaba silenciado.
        </li>
        <li>
          <strong>El resumen del lunes.</strong> Clasificación, ganador de la
          jornada y qué se juega la semana que viene. Es el mensaje que mantiene
          la conversación viva y cuesta dos minutos.
        </li>
        <li>
          <strong>Un empujón privado al que lleva dos jornadas sin jugar,</strong>{' '}
          antes de que sean cuatro. Recuperar a alguien en la jornada 12 es
          posible; en la 25 ya no.
        </li>
      </ul>

      <h2>9. No la lleves a mano</h2>
      <p>
        38 jornadas × 10 partidos × 20 personas son miles de datos. Y no es solo
        el volumen: es que la carga llega todas las semanas durante nueve meses,
        siempre al mismo organizador. Las quinielas de liga en hoja de cálculo no
        suelen morir por falta de interés del grupo, mueren porque quien
        actualizaba la tabla se cansó en enero.
      </p>
      <p>
        Con una{' '}
        <Link href="/guias/aplicacion-para-quinielas">app para quinielas</Link>{' '}
        los resultados de LaLiga entran solos, los puntos se calculan solos, el
        cierre partido a partido se aplica solo y la clasificación está siempre
        al día. El organizador vuelve a ser un jugador más, que es justo lo que
        hace falta para que aguante la temporada entera.
      </p>
      <p>
        Si es tu primera vez organizando, empieza por la{' '}
        <Link href="/guias/como-organizar-una-quiniela">guía paso a paso</Link>.
        Y si el grupo es el de trabajo, la{' '}
        <Link href="/guias/porra-de-futbol-oficina">
          guía de porra de oficina
        </Link>{' '}
        cubre lo específico de ese contexto: quién no debe gestionar el dinero,
        cómo invitar sin presionar y cómo evitar que se convierta en un tema de
        recursos humanos.
      </p>

      <h2>10. Cerrar bien la temporada (y enganchar con la siguiente)</h2>
      <p>
        La última jornada de liga suele ser un anticlímax: la general ya está
        decidida y la participación cae. Tres formas de que no lo sea: que el{' '}
        <strong>último tramo acabe en la última jornada</strong> y tenga premio
        propio, para que haya algo en juego hasta el final;{' '}
        <strong>pagar rápido y en público</strong>, el mismo mes y con la lista
        final puesta en el grupo, que es la mitad del motivo por el que la gente
        repite; y hacer el <strong>resumen de la temporada</strong> (quién ganó
        más jornadas, quién clavó más marcadores, quién no se dejó ninguna, el
        peor pronóstico del año), que cuesta poco y es lo que se recuerda.
      </p>
      <p>
        El momento de proponer la temporada siguiente es la semana en la que
        pagas los premios, no agosto. Ahí el grupo está enganchado, se acuerda de
        lo que pasó y se apunta sin que tengas que perseguir a nadie. Recoge
        entonces lo que cambiarías: el sistema de puntos, el reparto del bote o
        el número de tramos. Las reglas de la temporada que viene se escriben
        mejor en mayo que en agosto.
      </p>
    </GuiaShell>
  );
}
