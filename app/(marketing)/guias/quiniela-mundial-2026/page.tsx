import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

export const metadata: Metadata = {
  title: 'Quiniela del Mundial 2026: cómo montarla',
  description:
    'Cómo montar la quiniela del Mundial 2026 con 48 selecciones: puntos por ronda, pick de campeón, cierre en partidos de madrugada, prórroga y penales, y premios por fase.',
  alternates: { canonical: '/guias/quiniela-mundial-2026' },
  openGraph: {
    title: 'Quiniela del Mundial 2026: cómo montarla',
    description:
      'El formato de 48 equipos cambia las reglas del juego. Cómo adaptar tu quiniela para que se decida en la final.',
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Cuántos puntos debería valer un acierto en la fase de grupos del Mundial 2026?',
    a: 'Lo razonable es mantener el sistema base (3 por marcador exacto, 1 por acertar el ganador) y multiplicarlo en las rondas posteriores. En la fase de grupos hay muchos partidos y mucha diferencia de nivel, así que casi todo el mundo acierta lo mismo. Si esos partidos pesan igual que una semifinal, el torneo lo decide el volumen y no el criterio.',
  },
  {
    q: '¿En eliminatorias se puntúa el resultado de los 90 minutos o con prórroga y penales?',
    a: 'Lo habitual es puntuar el resultado al final de los 90 minutos reglamentarios, sin contar prórroga ni penales. Así un 1-1 pronosticado sigue siendo acierto aunque el partido se resuelva después en la tanda. Lo importante no es qué opción elijas, sino dejarla escrita antes del primer partido que se vaya a la prórroga.',
  },
  {
    q: '¿Cuándo hay que cerrar el pick de campeón?',
    a: 'Antes del primer partido del torneo y sin posibilidad de cambiarlo después. Si se permite modificarlo durante la fase de grupos, el pick deja de ser una apuesta a ciegas y se convierte en información: quien lo cambie en el último momento tiene ventaja sobre quien se arriesgó desde el principio.',
  },
  {
    q: '¿Qué hago con los partidos que se juegan de madrugada en Europa?',
    a: 'El Mundial 2026 se juega en Estados Unidos, México y Canadá, así que parte de los horarios caerán de madrugada o a primera hora en Europa. Lo práctico es permitir pronosticar toda la jornada con antelación y fijar el cierre automático al pitido inicial de cada partido, no a una hora global, para que nadie pierda puntos por dormir.',
  },
  {
    q: '¿Cómo se pronostica en eliminatorias si no se sabe quién juega hasta el final de la fase anterior?',
    a: 'Con pronóstico por partido y no por cuadro completo: en cuanto se conocen los dos equipos de un cruce se abre ese partido y se cierra al empezar. Si quieres que la gente rellene un cuadro entero por adelantado, púntualo como un concurso aparte (aciertos de clasificados) y no lo mezcles con los marcadores.',
  },
  {
    q: '¿Hasta cuándo se pueden admitir nuevos participantes?',
    a: 'Lo limpio es cerrar inscripciones antes del primer partido. Quien entra con la fase de grupos empezada no ha arriesgado en los mismos partidos que el resto, y el pick de campeón ya se ha congelado para los demás. Si quieres dejar entrar a alguien más tarde, que sea sin acceso al bote principal.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Quiniela del Mundial 2026: cómo montarla"
      lede="El Mundial de 2026 trae 48 selecciones y más partidos que nunca. Eso cambia cómo hay que plantear la quiniela."
      slug="quiniela-mundial-2026"
      description="Cómo montar la quiniela del Mundial 2026: reglas para 48 selecciones, puntos recomendados y cómo evitar que se decida demasiado pronto."
      faq={FAQ}
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
      <p>
        Hay un tercer efecto, menos evidente, que es el que de verdad rompe las
        quinielas mal diseñadas: la <strong>forma</strong> del torneo. Una liga
        reparte sus partidos en jornadas parecidas durante meses. Un Mundial de 48
        selecciones hace lo contrario: concentra una avalancha de partidos en los
        primeros días y luego los va racionando hasta quedarse en uno solo. La
        primera fase es un maratón de volumen con poca información; la eliminatoria
        es una serie corta de partidos muy caros a partido único.
      </p>
      <p>
        Si todos los partidos valen lo mismo, esa asimetría decide el torneo
        demasiado pronto: agotada la fase de grupos, quedan tan pocos puntos sobre la
        mesa que la clasificación está cerrada de hecho. Quien lleve ventaja ya no
        puede ser alcanzado y el resto desconecta justo cuando empiezan los partidos
        buenos.
      </p>

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

      <h3>Multiplicadores por ronda, en concreto</h3>
      <p>
        La forma más simple de aplicar la tercera idea es dejar el baremo base
        intacto y multiplicarlo según la ronda. El acierto sigue siendo el mismo
        (marcador exacto o ganador), solo cambia cuánto pesa, así que nadie tiene que
        aprenderse dos sistemas distintos.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Ronda</th>
              <th>Multiplicador</th>
              <th>Exacto / Ganador</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fase de grupos</td>
              <td>x1</td>
              <td>3 / 1</td>
            </tr>
            <tr>
              <td>Primera ronda eliminatoria</td>
              <td>x2</td>
              <td>6 / 2</td>
            </tr>
            <tr>
              <td>Cuartos de final</td>
              <td>x3</td>
              <td>9 / 3</td>
            </tr>
            <tr>
              <td>Semifinales</td>
              <td>x4</td>
              <td>12 / 4</td>
            </tr>
            <tr>
              <td>Final</td>
              <td>x5</td>
              <td>15 / 5</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        El criterio para elegir los multiplicadores no es estético: haz la cuenta.
        Suma los puntos máximos que reparte la fase de grupos y compáralos con los
        que reparte todo lo que viene después, incluido el bonus de campeón. Si la
        eliminatoria no llega a un tercio del total, sube multiplicadores o bonus. Si
        pasa de la mitad, estás en el extremo contrario: la fase de grupos se vuelve
        irrelevante y la gente la rellenará sin pensar. Si quieres comparar baremos
        completos antes de decidir, mira la{' '}
        <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
      </p>

      <h3>El pick de campeón: cuánto vale y cuándo se congela</h3>
      <p>
        Es la herramienta más barata para mantener la clasificación abierta: cuesta
        un campo en el formulario de inscripción y es lo único que garantiza que el
        último partido pueda cambiar al ganador de la quiniela. Pero solo funciona
        con dos condiciones. La primera, que el bonus sea{' '}
        <strong>grande de verdad</strong>: si vale como dos marcadores exactos, nadie
        cambia su comportamiento. Un valor razonable es el equivalente a una ronda
        eliminatoria completa de aciertos. La segunda, que se congele{' '}
        <strong>antes del primer partido</strong> y no se pueda tocar después: un
        pick modificable a mitad de torneo no es una apuesta, es una corrección con
        información que los demás no tuvieron.
      </p>
      <div className="gu__note">
        <p>
          <strong>Avisa del congelado por escrito y con antelación.</strong> Es la
          regla que más discusiones genera, porque quien se olvida de rellenarlo
          descubre tarde que ha perdido el bonus más grande del torneo. Dilo al abrir
          inscripciones, recuérdalo el día antes del primer partido y deja claro qué
          pasa si alguien no lo rellena: lo normal es que se quede sin bonus, no que
          se le asigne uno por defecto.
        </p>
      </div>

      <h2>Horarios: el problema del cierre de pronósticos</h2>
      <p>
        El Mundial 2026 se juega en Estados Unidos, México y Canadá. Para quien lo
        sigue desde Europa, parte de los partidos caerá de madrugada o a primera hora
        de la mañana. El error típico es fijar un cierre global por jornada
        (&laquo;todos los pronósticos, antes de las 20:00&raquo;): con horarios
        repartidos a lo largo de la madrugada, ese cierre único o llega demasiado
        temprano o llega cuando algún partido ya ha empezado.
      </p>
      <p>
        La regla que funciona es la contraria: <strong>apertura amplia y cierre
        individual</strong>. Deja pronosticar todos los partidos conocidos con días
        de antelación y cierra cada uno automáticamente al pitido inicial de ese
        partido concreto. Quien quiera dejarlo rellenado el domingo puede; quien
        prefiera esperar a las alineaciones también, asumiendo el riesgo.
      </p>
      <ul>
        <li>
          <strong>Publica los horarios en la zona horaria de tu grupo</strong>, no en
          la de la sede. Es la fuente número uno de malentendidos en torneos
          intercontinentales.
        </li>
        <li>
          <strong>Decide qué pasa con los pronósticos sin rellenar.</strong> Lo más
          simple y lo más justo es que valgan cero. Asignar un marcador por defecto
          reparte puntos a quien no jugó y siempre acaba discutido.
        </li>
        <li>
          <strong>En una hoja de cálculo el cierre no existe.</strong> Nada impide
          editar una celda después del pitido inicial, y tarde o temprano alguien
          sospechará que ha pasado.
        </li>
      </ul>

      <h2>Reglas específicas que debes dejar claras</h2>
      <div className="gu__note">
        <p>
          <strong>La más importante:</strong> en eliminatorias, ¿cuenta el resultado
          a los 90 minutos o el que incluye prórroga y penales? Lo estándar es{' '}
          <strong>a los 90 minutos</strong>. Déjalo escrito antes de que haya un
          partido decidido en penales.
        </p>
      </div>
      <p>
        Merece la pena entender por qué ese es el estándar. En una eliminatoria a
        partido único no hay empates en la clasificación, pero sí en el marcador:
        muchos cruces terminan igualados a los 90 minutos y se resuelven después. Si
        puntúas el resultado con prórroga incluida, el empate desaparece como
        pronóstico válido y obligas a todo el mundo a elegir un ganador en partidos
        que, futbolísticamente, son empates. Si quieres además recompensar a quien
        adivina quién pasa de ronda, no cambies la regla del marcador: añade un punto
        extra por acertar el clasificado. Dos conceptos separados, ninguna ambigüedad
        cuando se lancen los penales.
      </p>

      <h3>Emparejamientos que no se conocen hasta última hora</h3>
      <p>
        En la fase de grupos sabes desde el principio quién juega contra quién. En
        eliminatorias no: cada cruce depende del anterior y a veces el rival se
        conoce con muy poco margen. Eso descarta el modelo de &laquo;rellena el
        cuadro completo el primer día&raquo; como base de la puntuación.
      </p>
      <ul>
        <li>
          <strong>Pronóstico por partido, no por cuadro.</strong> El partido se abre
          cuando se conocen los dos equipos y se cierra al empezar. Es la única forma
          de que todos pronostiquen con la misma información.
        </li>
        <li>
          <strong>Avisa en cuanto se abra una ronda.</strong> La ventana entre que se
          conoce el cruce y que empieza el partido puede ser corta; sin aviso, media
          quiniela se entera tarde.
        </li>
        <li>
          <strong>Si quieres el cuadro, hazlo concurso aparte.</strong> Un bracket
          rellenado antes de empezar se puede puntuar por clasificados acertados por
          ronda, pero con su propio marcador y su propio premio.
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
        aguantó el interés hasta el último partido. Sobre esta base, los
        multiplicadores por ronda son la única modificación que de verdad
        recomendamos para 48 selecciones. Todo lo demás —bonus por goleada, puntos
        por diferencia de goles, aciertos parciales— añade reglas que hay que
        explicar y resta la ventaja principal de un baremo 3/1/0: que cualquiera
        entiende su posición sin preguntar.
      </p>

      <h2>Premios por fase para que nadie desconecte</h2>
      <p>
        Los multiplicadores arreglan el reparto de puntos, pero no el problema
        emocional: a mitad de torneo, quien va decimoquinto sabe que no gana el bote.
        La solución es que el bote no sea un único premio al final. Reserva una parte
        para premios parciales y anúncialos desde el primer día: la mayor parte para
        la clasificación final, una porción para el mejor de la fase de grupos y otra
        repartida entre los mejores de cada ronda eliminatoria.
      </p>
      <ul>
        <li>
          <strong>Mejor de la fase de grupos.</strong> Premia el volumen de aciertos
          en la parte que, por diseño, pesa menos en la general.
        </li>
        <li>
          <strong>Mejor de cada ronda eliminatoria.</strong> Son pocos partidos, así
          que habrá empates: define el desempate por adelantado (más marcadores
          exactos y, si siguen iguales, mejor posición en la general).
        </li>
        <li>
          <strong>Premios que no son dinero.</strong> En quinielas de oficina o de
          club funcionan igual: la invitación de la semana, un detalle del
          patrocinador o simplemente aparecer destacado.
        </li>
      </ul>
      <div className="gu__note">
        <p>
          <strong>Cierra las cuentas antes de empezar, no después.</strong> Deja
          escrito el porcentaje exacto de cada premio y quién custodia el dinero. Un
          torneo que dura semanas da tiempo de sobra a que se olvide lo que se dijo
          de palabra el primer día.
        </p>
      </div>

      <h2>Cuándo abrir la quiniela y cuándo cerrar inscripciones</h2>
      <p>
        Un torneo corto se improvisa; uno de este tamaño, no. La fase de grupos
        empieza con una avalancha de partidos, y si llegas ahí con media gente sin
        registrar y las reglas a medio escribir, ya no se recupera.
      </p>
      <ol>
        <li>
          <strong>Semanas antes: escribe reglas y reparto.</strong> Puntos,
          multiplicadores, bonus de campeón, qué pasa con los pronósticos vacíos,
          premios por fase y desempates. Es el documento que vas a enlazar cada vez
          que alguien pregunte.
        </li>
        <li>
          <strong>Después: abre inscripciones y cobra.</strong> Cobrar por adelantado
          no es desconfianza, es evitar la única discusión que de verdad rompe
          grupos.
        </li>
        <li>
          <strong>Días antes del inicio: recuerda el pick de campeón.</strong> Es lo
          que más gente olvida rellenar.
        </li>
        <li>
          <strong>Antes del primer partido: cierra inscripciones y congela picks.</strong>{' '}
          A partir de aquí la lista de participantes no cambia.
        </li>
        <li>
          <strong>Durante el torneo: publica clasificación sin que te lo pidan.</strong>{' '}
          Si la gente tiene que preguntar cómo va, ya la has perdido.
        </li>
      </ol>

      <h2>Lo que no deberías hacer a mano</h2>
      <p>
        Multiplica participantes por partidos pronosticados y salen miles de celdas
        que hay que comparar con el marcador real: no solo es lento, es que introduce
        errores, y un error de puntuación en una quiniela con dinero de por medio es
        la clase de problema que nadie quiere mediar. A eso se añaden las tres cosas
        que una hoja de cálculo no sabe hacer: cerrar un partido al pitido inicial,
        aplicar un multiplicador distinto por ronda y recalcular la clasificación
        sola cuando entra un resultado de madrugada.
      </p>
      <p>
        Si es tu primera vez organizando, empieza por la{' '}
        <Link href="/guias/como-organizar-una-quiniela">guía paso a paso</Link>. Y si
        ya tienes claras las reglas y lo que buscas es con qué llevarlas, compara
        opciones en la{' '}
        <Link href="/guias/aplicacion-para-quinielas">
          guía de aplicaciones para quinielas
        </Link>
        .
      </p>
    </GuiaShell>
  );
}
