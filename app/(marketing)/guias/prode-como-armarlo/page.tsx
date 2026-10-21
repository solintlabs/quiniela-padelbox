import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo de “prode” — como se llama la quiniela en Argentina.
 * Español rioplatense a propósito (vos, armar, fecha) para que suene local.
 * Se diferencia de /guias/penca-de-futbol centrándose en lo argentino: la
 * columna de 13 partidos, el doble y el triple, torneos de AFA y el prode de
 * oficina. Los consejos genéricos viven en la guía de penca.
 */
const SLUG = 'prode-como-armarlo';
const DESCRIPTION =
  'Cómo armar un prode entre amigos o en el laburo: la columna de 13 partidos, el prode de marcadores, doble y triple, desempates, partidos postergados y cómo cobrar sin quilombos.';

export const metadata: Metadata = {
  title: 'Prode: cómo armarlo con tus amigos (guía + app gratis)',
  description: DESCRIPTION,
  keywords: [
    'prode', 'como armar un prode', 'prode entre amigos', 'app para prode',
    'prode del mundial', 'armar prode con amigos', 'prode online',
    'prode 13 partidos', 'doble y triple prode',
  ],
  alternates: { canonical: `/guias/${SLUG}` },
  openGraph: {
    title: 'Prode: cómo armarlo con tus amigos',
    description: DESCRIPTION,
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Qué es un prode?',
    a: 'Es un juego de pronósticos deportivos entre amigos, compañeros de trabajo o socios de un club: cada uno predice los resultados de los partidos y suma puntos según acierte. Gana quien más puntos junta. En otros países le dicen quiniela, polla, penca o porra.',
  },
  {
    q: '¿Cuántos partidos tiene que tener un prode?',
    a: 'El prode clásico de agencia usaba una columna de 13 partidos, y por eso mucha gente arma el suyo con ese número. No es obligatorio: si vas a jugar por fecha de un torneo local, lo natural es tomar los partidos de esa fecha, sean 7, 13 o 15. Lo que importa es que el número sea siempre el mismo y que todos sepan de antemano qué partidos entran.',
  },
  {
    q: '¿Qué es el doble y el triple en el prode?',
    a: 'Vienen del prode de agencia, donde jugabas una columna sola: el doble es marcar dos resultados posibles en un partido y el triple, los tres. Te cubrís, pero el cartón sale más caro porque equivale a jugar varias columnas. En un prode entre amigos con tabla acumulada no hacen falta, y si los permitís tenés que cobrarlos aparte o el que los usa juega con ventaja gratis.',
  },
  {
    q: '¿Cómo se arma un prode paso a paso?',
    a: 'Elegí el torneo y qué partidos entran en cada fecha, definí quiénes juegan y cuánto pone cada uno, dejá el puntaje y el reglamento por escrito antes de la primera fecha, cobrá antes de arrancar y cerrá los pronósticos cuando empieza cada partido. Después solo mantené la tabla al día; con una app los resultados y los puntos se cargan solos.',
  },
  {
    q: '¿Qué pasa si se posterga un partido?',
    a: 'Hay que decidirlo antes de que ocurra, porque en los torneos de AFA pasa seguido. Las dos salidas razonables son anular ese partido para todos (nadie suma, nadie pierde) o dejarlo pendiente y puntuarlo cuando se juegue, en la fecha en la que se jugó. Lo que no funciona es improvisar después, cuando ya hay gente a la que le convendría una opción y no la otra.',
  },
  {
    q: '¿Cuál es el puntaje habitual de un prode?',
    a: 'El más usado es 3 puntos por acertar el resultado exacto, 1 punto por acertar solo el ganador y 0 si errás. Si en cambio jugás a la vieja usanza, con 1-X-2, es 1 punto por acierto y nada más. Se le puede sumar un bonus por acertar al campeón del torneo, que mantiene la tabla abierta hasta la última fecha.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Prode: cómo armarlo con tus amigos"
      lede="Armar el prode lleva cinco minutos. Que llegue vivo hasta la última fecha, sin quilombos y sin que el que organiza termine odiando la planilla, es otra historia."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Qué es un prode</h2>
      <p>
        El <strong>prode</strong> es un juego de pronósticos: cada participante
        predice los resultados de los partidos y suma puntos según lo que
        acierte. Al final, el que más puntos juntó se lleva el pozo.
      </p>
      <p>
        Es lo mismo que en otros lados llaman <strong>quiniela</strong> (México,
        España), <strong>polla</strong> (Venezuela, Colombia),{' '}
        <strong>penca</strong> (Uruguay) o <strong>porra</strong> (España).
      </p>
      <p>
        En Argentina la palabra arrastra una herencia muy concreta: el PRODE de
        agencia, el cartón que se llenaba con lápiz marcando{' '}
        <strong>1</strong> (gana local), <strong>X</strong> (empate) o{' '}
        <strong>2</strong> (gana visitante) en una columna de trece partidos.
        Ese formato dejó dos cosas en el imaginario: el número 13 y la idea del{' '}
        <em>doble</em> y el <em>triple</em>. Las dos siguen apareciendo cuando
        alguien arma un prode entre amigos, y vale la pena saber qué conviene
        heredar y qué no.
      </p>

      <h2>Prode de 13 partidos o prode de marcadores</h2>
      <p>
        Es la primera decisión y la que más cambia todo lo demás. No son dos
        versiones de lo mismo: son dos juegos distintos.
      </p>
      <p>
        El <strong>prode clásico</strong> se juega marcando 1, X o 2. Acertás o
        no acertás. Es rapidísimo de completar —&nbsp;trece cruces y listo&nbsp;—
        y cualquiera puede jugarlo sin saber nada de fútbol. El problema es que
        con solo tres opciones por partido los empates en la tabla son
        constantes: con trece partidos es muy normal que cinco personas terminen
        la fecha con nueve aciertos cada una.
      </p>
      <p>
        El <strong>prode de marcadores</strong> pide el resultado exacto (2-1,
        0-0) y reparte puntos por nivel de acierto: más por el marcador justo,
        menos por acertar solo quién ganó. Lleva más tiempo cargarlo y premia a
        quien sigue el torneo, pero genera una tabla con diferencias reales y
        permite remontadas. Es el formato que se usa hoy en casi todos los
        prodes largos.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Qué mirás</th>
              <th>Prode clásico (1-X-2)</th>
              <th>Prode de marcadores</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Qué carga el jugador</td>
              <td>Local, empate o visitante</td>
              <td>El marcador exacto</td>
            </tr>
            <tr>
              <td>Tiempo por fecha</td>
              <td>Un minuto</td>
              <td>Tres o cuatro minutos</td>
            </tr>
            <tr>
              <td>Empates en la tabla</td>
              <td>Muchos</td>
              <td>Pocos</td>
            </tr>
            <tr>
              <td>Peso de la suerte</td>
              <td>Alto</td>
              <td>Medio</td>
            </tr>
            <tr>
              <td>Para quién va bien</td>
              <td>Oficinas, grupos grandes, gente que no sigue el fútbol</td>
              <td>Grupos de amigos futboleros, torneos largos</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Una salida intermedia que funciona bien en oficinas: jugar 1-X-2 pero
        pedir además el marcador de <strong>un solo partido</strong>, el más
        visible de la fecha, y usarlo nada más que para desempatar. Conservás la
        simpleza del cartón y te sacás de encima el problema de los empates. Si
        querés ver las variantes con números, están en la{' '}
        <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
      </p>

      <h2>Doble y triple: qué eran y si conviene permitirlos</h2>
      <p>
        En el prode de agencia jugabas una sola columna y cobraba el que la
        tenía entera. Para no quedar afuera por un partido jugado al azar
        existían el <strong>doble</strong> (marcar dos resultados posibles en un
        partido) y el <strong>triple</strong> (marcar los tres). Matemáticamente
        no era un favor: un doble multiplica por dos la cantidad de columnas que
        estás jugando, un triple por tres, y dos dobles más un triple ya son
        doce columnas. Por eso el cartón salía más caro en proporción exacta a
        cuánto te cubrías.
      </p>
      <p>
        Si en tu prode querés permitirlos, la regla no negociable es que{' '}
        <strong>se paguen</strong>. El doble cuesta como dos apuestas; el triple,
        como tres. Si los dejás gratis, el que los use tiene ventaja matemática
        sobre el que arriesgó, y el prode se vuelve una competencia de quién
        marca más casilleros.
      </p>
      <div className="gu__note">
        <p>
          <strong>Lo más simple:</strong> en un prode con tabla acumulada el
          doble y el triple no hacen falta. Tienen sentido cuando se juega una
          sola columna y todo se define en una fecha. Si vas a sumar puntos
          durante un torneo entero, prohibilos y ahorrate la contabilidad.
        </p>
      </div>

      <h2>1. Elegí el torneo antes de elegir las reglas</h2>
      <p>
        Un prode de Mundial y un prode de Liga Profesional son dos animales
        distintos. El Mundial dura un mes, tiene fixture cerrado y todo el
        grupo mira los mismos partidos: es el prode más fácil de organizar y el
        que más gente engancha.
      </p>
      <p>
        Un torneo local de AFA dura meses y tiene tres complicaciones propias
        que conviene anticipar:
      </p>
      <ul>
        <li>
          <strong>Las fechas se mueven.</strong> Partidos que se reprograman por
          copas internacionales, por televisación o por cuestiones de seguridad.
          Tu reglamento tiene que decir qué pasa cuando un partido se corre de
          fecha, no después.
        </li>
        <li>
          <strong>Son demasiados partidos.</strong> Una fecha completa puede ser
          pesada de cargar todas las semanas. Muchos prodes toman solo los seis u
          ocho partidos más convocantes de cada fecha, y se nota en la
          participación.
        </li>
        <li>
          <strong>El hincha vota con el corazón.</strong> En un torneo local
          todos le ponen que gana su equipo. Es parte de la gracia, pero explica
          por qué las tablas de prodes locales son más parejas que las de un
          Mundial.
        </li>
      </ul>
      <p>
        Definí también cuántas fechas dura el prode. “Hasta que termine el
        torneo” suena bien en marzo y es eterno en septiembre. Un prode de ocho
        o diez fechas, con cierre y premiación, se sostiene mucho mejor que uno
        abierto; y si funcionó, armás el siguiente.
      </p>

      <h2>2. Definí el grupo y cuánto pone cada uno</h2>
      <p>
        Dos números antes que nada: cuántos juegan y cuánto aporta cada uno.
        Entre amigos anda bien con 8–15; en un club o una oficina, 30–100.
      </p>
      <p>
        El tipo de grupo cambia el diseño del prode más de lo que parece. El{' '}
        <strong>prode de oficina</strong> junta mucha gente que no sigue el
        fútbol: conviene formato simple, cierre semanal claro y un pozo chico
        porque hay que cobrarle a compañeros de trabajo, y eso incomoda. El{' '}
        <strong>prode del grupo de amigos</strong> es lo contrario: pocos,
        futboleros, con confianza para cobrar y con ganas de un formato más
        exigente. Y el <strong>prode de barrio o de club</strong> es el que más
        crece de golpe: empieza con veinte y termina con setenta porque cada uno
        trae a alguien, así que necesitás reglas de incorporación tardía desde
        el día uno.
      </p>
      <div className="gu__note">
        <p>
          <strong>Consejo:</strong> poné un monto que tu grupo pague sin pensarlo.
          Si es caro, la gente lo duda y no entra. Con monto bajo y mucha gente el
          pozo termina igual de grande y hay más ambiente.
        </p>
      </div>

      <h2>3. Dejá el puntaje por escrito antes de la primera fecha</h2>
      <p>
        Casi todas las discusiones salen de reglas que nadie escribió. Dejá claro:
      </p>
      <ul>
        <li>
          <strong>Cuánto vale cada acierto.</strong> El clásico: 3 por resultado
          exacto, 1 por el ganador, 0 si errás. Otras variantes, en la{' '}
          <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
        </li>
        <li>
          <strong>Hasta cuándo se carga</strong> cada pronóstico: lo normal es
          cerrar cuando arranca el partido. Si cargás a mano, cerrá toda la fecha
          antes del primer partido; es menos justo pero es lo único que podés
          controlar sin volverte loco.
        </li>
        <li>
          <strong>Qué pasa con el que no carga.</strong> Lo más usado es cero
          puntos en los partidos que no completó. La otra opción, para prodes de
          oficina, es asignarle el resultado más votado por el grupo: suma menos
          pero no lo deja afuera de la competencia a la primera distracción.
        </li>
        <li>
          <strong>Qué resultado cuenta</strong> si hay alargue o penales:
          habitualmente el de los 90 minutos. Dejalo escrito igual, porque en las
          copas aparece sin aviso.
        </li>
        <li>
          <strong>Cómo se desempata</strong> y <strong>cómo se reparte el pozo</strong>.
        </li>
      </ul>
      <p>
        Escribilo en un solo lugar fijo —&nbsp;un mensaje fijado en el grupo, un
        documento, la pantalla de reglas de la app&nbsp;— y no lo cambies una vez
        empezado. Si tenés que corregir algo a mitad de camino, avisalo antes de
        la fecha siguiente y que aplique desde ahí, nunca retroactivo.
      </p>

      <h2>4. El reglamento de desempates</h2>
      <p>
        Esto es lo que más se olvida y lo que más caro sale, porque se descubre
        justo cuando hay plata sobre la mesa. Necesitás un orden de criterios,
        no uno solo. El que funciona:
      </p>
      <ol>
        <li>
          <strong>Más resultados exactos</strong> en todo el prode. Premia al que
          arriesgó marcadores en vez de jugar a la segura.
        </li>
        <li>
          <strong>Más fechas ganadas</strong> individualmente.
        </li>
        <li>
          <strong>Mejor puntaje en la última fecha</strong>, que además le da
          tensión al cierre.
        </li>
        <li>
          Si siguen iguales, <strong>se divide el premio</strong>. Dejalo escrito
          así, tal cual: es la única salida que nadie puede discutir.
        </li>
      </ol>
      <p>
        Lo que no sirve como desempate: el orden alfabético, quién se anotó
        primero, o un partido sorteado después. Cualquier criterio que el jugador
        no podía influir con su juego se vive como arbitrario.
      </p>

      <h2>5. Partidos suspendidos, postergados o anulados</h2>
      <p>
        En un prode de torneo local esto no es un caso raro, es rutina. Decidí de
        antemano entre estas tres, y escribí la que elegiste:
      </p>
      <ul>
        <li>
          <strong>Anular el partido.</strong> No existe para nadie, la fecha vale
          menos puntos. Es la más simple y la más fácil de explicar.
        </li>
        <li>
          <strong>Dejarlo pendiente.</strong> Se puntúa cuando se juegue, con los
          pronósticos ya cargados y congelados. Es lo más justo, pero te obliga a
          volver sobre una fecha ya cerrada.
        </li>
        <li>
          <strong>Reabrir el pronóstico.</strong> Si el partido se corre varias
          semanas, los equipos ya no son los mismos; permitir recargar ese
          partido solo tiene sentido si avisás a todos y das el mismo plazo.
        </li>
      </ul>
      <p>
        Casos relacionados que vale cubrir en dos líneas: partido suspendido una
        vez empezado (lo habitual es tomar el resultado final del partido
        completado, no el del momento de la suspensión) y resultado modificado
        después por el tribunal de disciplina (lo habitual es que el prode se
        quede con lo que pasó en la cancha).
      </p>

      <h2>6. El que se suma tarde</h2>
      <p>
        Siempre aparece en la fecha tres, invitado por alguien. Si lo dejás
        entrar con cero puntos, no tiene ninguna chance y se baja a la semana. Si
        lo dejás entrar con el promedio de la tabla, los que vienen últimos se
        sienten estafados. Las dos opciones que no generan ruido:
      </p>
      <ul>
        <li>
          <strong>Entra, paga completo y compite solo por los premios por
          fecha.</strong> Juega todas las fechas que quedan, puede ganar varias,
          pero no entra en la tabla general.
        </li>
        <li>
          <strong>Cierre de inscripción duro.</strong> Se anota hasta la segunda
          fecha y después no entra nadie. Es menos simpático y es lo que menos
          discusiones trae.
        </li>
      </ul>
      <p>
        Lo mismo aplica al revés: si alguien se baja a mitad de torneo, el reparto
        no se recalcula. El pozo ya está formado y su aporte se queda ahí. Dejalo
        escrito, porque alguien va a pedir que le devuelvas la parte.
      </p>

      <h2>7. Cobrá antes de que empiece y anotá quién pagó</h2>
      <p>
        El que paga después de ver cómo viene la tabla, no paga. Cobrá todo antes
        de la primera fecha y dejá los datos de pago por escrito en un solo lugar.
      </p>
      <p>
        Y llevá un registro visible de los pagos, que es la mitad del trabajo del
        organizador. Lo que evita el malentendido típico:
      </p>
      <ul>
        <li>
          Una <strong>lista pública</strong> con los nombres y un sí o un no al
          lado. Que cada uno pueda controlar su propio estado sin preguntarte.
        </li>
        <li>
          <strong>Un solo medio de cobro.</strong> Si entra plata por tres vías
          distintas, el día del reparto no vas a poder reconstruir nada.
        </li>
        <li>
          <strong>Comprobante o fecha anotada</strong> para cada pago, aunque sea
          una captura. Con treinta personas, la memoria no alcanza.
        </li>
        <li>
          Una regla explícita de <strong>qué pasa si no pagó</strong>: lo más
          usado es que puede cargar pronósticos pero no cobra premio hasta estar
          al día. Si usás una app, muchas permiten marcar quién pagó y mostrarlo
          en la tabla, y eso te saca el tema de encima.
        </li>
      </ul>
      <p>
        El dinero es siempre cosa del organizador, por fuera de cualquier
        plataforma. Si querés el procedimiento completo de cobro y reparto, está
        desarrollado en la{' '}
        <Link href="/guias/como-organizar-una-quiniela">
          guía de cómo organizar una quiniela
        </Link>
        .
      </p>

      <h2>8. Repartí para que nadie se baje</h2>
      <p>
        Si solo premiás al primero, a mitad de torneo la mitad deja de cargar
        porque ya no llega. Un reparto que funciona:
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Puesto</th>
              <th>Del pozo</th>
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
        Guardá algo para <strong>premio por fecha</strong>: le da a todos algo que
        ganar cada semana, aunque estén últimos. Con un diez o quince por ciento
        del pozo reservado para eso alcanza, y es la medida que más cambia la
        participación en las últimas fechas.
      </p>

      <h2>9. Mantener el prode vivo hasta la última fecha</h2>
      <p>
        Un prode no muere porque la gente se aburra del fútbol: muere cuando
        cargar el pronóstico deja de ser automático. Lo que lo sostiene:
      </p>
      <ul>
        <li>
          <strong>Un recordatorio antes del cierre.</strong> Un mensaje el día
          anterior sube la carga de pronósticos más que cualquier premio.
        </li>
        <li>
          <strong>La tabla publicada siempre el mismo día.</strong> Si aparece
          cuando el organizador se acuerda, el grupo pierde el ritmo.
        </li>
        <li>
          <strong>Un bonus al campeón del torneo</strong>, cargado al principio y
          congelado. Mantiene matemáticamente vivo al que viene décimo.
        </li>
        <li>
          <strong>Premios por tramos</strong>: mejor de la primera mitad, mejor de
          la segunda. Le reinicia la competencia al que arrancó mal.
        </li>
        <li>
          <strong>Contar la fecha.</strong> Dos líneas en el grupo sobre quién
          clavó el 3-1 que nadie vio venir valen más que la tabla sola.
        </li>
      </ul>

      <h2>10. No lo lleves en una planilla</h2>
      <p>
        Ahí mueren casi todos los prodes: el que organiza termina copiando
        resultados a mano, sumando puntos y contestando “¿cómo voy?” veinte veces
        por WhatsApp. A la tercera fecha lo abandona.
      </p>
      <p>
        Y además es donde se cuelan los errores que rompen la confianza: un
        marcador mal tipeado, una fórmula que no se arrastró hasta la última fila,
        un pronóstico que llegó por mensaje privado y nunca se cargó. Cuando un
        jugador descubre que la tabla estaba mal, el prode ya está roto, aunque lo
        corrijas.
      </p>
      <p>
        Con una <Link href="/guias/aplicacion-para-quinielas">app para quinielas</Link>{' '}
        los resultados entran solos, el puntaje se calcula solo, los pronósticos
        se cierran a la hora exacta y la tabla está siempre al día. Vos solo
        repartís el pozo al final.
      </p>

      <h2>Errores típicos del organizador</h2>
      <ul>
        <li>Arrancar sin reglas escritas y escribirlas cuando aparece el conflicto.</li>
        <li>No tener reglamento de desempate hasta que hay dos primeros.</li>
        <li>Aceptar pronósticos con el partido ya empezado, aunque sea “uno solo”.</li>
        <li>Cambiar el puntaje a mitad de torneo y aplicarlo hacia atrás.</li>
        <li>Permitir dobles y triples sin cobrarlos.</li>
        <li>Cobrar a mitad de torneo, o no anotar quién pagó.</li>
        <li>Premiar solo al primero.</li>
        <li>Recibir pronósticos por cuatro canales distintos.</li>
        <li>Elegir un torneo tan largo que el prode no llega al final.</li>
        <li>Llevar la tabla en Excel o por chat.</li>
      </ul>
    </GuiaShell>
  );
}
