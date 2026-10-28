import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo de “penca” — como se llama la quiniela en Uruguay (y parte
 * de Bolivia/Paraguay). Sinónimo regional con búsqueda constante y muy poca
 * competencia editorial.
 */
const SLUG = 'penca-de-futbol';
const DESCRIPTION =
  'Cómo organizar una penca de fútbol de principio a fin: reglamento, puntaje, desempates, partidos aplazados, cobro del pozo y reparto de premios. Guía práctica y app gratis para llevarla sin planilla.';

export const metadata: Metadata = {
  title: 'Penca de fútbol: cómo organizarla (guía + app gratis)',
  description: DESCRIPTION,
  keywords: [
    'penca de futbol', 'penca mundial', 'como organizar una penca',
    'app para penca', 'penca entre amigos', 'penca online',
    'reglamento de penca', 'desempate penca',
  ],
  alternates: { canonical: `/guias/${SLUG}` },
  openGraph: {
    title: 'Penca de fútbol: cómo organizarla',
    description: DESCRIPTION,
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Qué es una penca de fútbol?',
    a: 'Es un juego de pronósticos entre amigos, compañeros de trabajo o socios de un club: cada uno predice los resultados de los partidos y suma puntos según acierte. Gana quien más puntos junta. En otros países se llama quiniela, prode, polla o porra.',
  },
  {
    q: '¿Cómo se organiza una penca paso a paso?',
    a: 'Definí quiénes juegan y cuánto pone cada uno, dejá el puntaje y las reglas por escrito antes del primer partido, cobrá el pozo por adelantado, cerrá los pronósticos al empezar cada partido y mantené la tabla al día. Una app hace lo último por vos.',
  },
  {
    q: '¿Qué puntaje se usa en una penca?',
    a: 'El más común es 3 puntos por el resultado exacto, 1 punto por acertar el ganador y 0 si errás. Podés sumar un bonus por acertar al campeón del torneo para que la tabla siga abierta hasta la última fecha.',
  },
  {
    q: '¿Qué pasa si alguien se olvida de pronosticar una fecha?',
    a: 'Tiene que estar escrito antes de que pase. Las dos opciones sanas son 0 puntos en los partidos que no cargó, o un pronóstico por defecto igual para todos (por ejemplo 1-1 o 0-0). Lo que nunca funciona es dejarlo cargar después del partido, aunque jure que se le cortó internet.',
  },
  {
    q: '¿Qué hago si un partido se aplaza o se suspende?',
    a: 'Si se juega más tarde dentro del torneo, lo normal es mantener los pronósticos cargados y puntuar con el resultado final. Si se suspende a mitad y se retoma otro día desde el minuto en que quedó, puntuá el marcador final acumulado. Si no se juega nunca, el partido se anula para todos y no suma a nadie.',
  },
  {
    q: '¿Cómo se desempata en una penca?',
    a: 'Fijá un orden de criterios antes de arrancar: primero cantidad de resultados exactos, después menor diferencia acumulada entre goles pronosticados y reales, y como último recurso un sorteo o dividir el premio. Dos o tres criterios alcanzan; más que eso nadie los recuerda.',
  },
  {
    q: '¿Hay una app gratis para llevar la penca?',
    a: 'Sí. QuinielaBOX es gratis hasta 15 jugadores: los resultados se cargan solos, el puntaje se calcula automáticamente y la tabla se actualiza en vivo. El pozo lo maneja el organizador por fuera; la app no toca dinero.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Penca de fútbol: cómo organizarla"
      lede="Organizar la penca lleva un rato. Mantenerla viva hasta la última fecha, sin discusiones y sin que el organizador termine peleado con una planilla, es lo difícil."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Qué es una penca</h2>
      <p>
        Una <strong>penca</strong> es un juego de pronósticos: cada participante
        predice los resultados de los partidos y suma puntos según lo que
        acierte. Al final, quien más puntos juntó se lleva el pozo.
      </p>
      <p>
        Es lo mismo que en otros países llaman <strong>quiniela</strong>,{' '}
        <strong>prode</strong> (Argentina), <strong>polla</strong> (Venezuela,
        Colombia) o <strong>porra</strong> (España). El nombre cambia; el
        problema del organizador es idéntico en todas partes.
      </p>
      <p>
        “Penca” abarca formatos bastante distintos, y elegir mal el formato es el
        primer error. Un Mundial son cinco semanas con partidos todos los días;
        una liga local son nueve meses pidiéndole a la gente que cargue
        pronósticos. No se organizan igual.
      </p>

      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Formato</th>
              <th>Cómo se juega</th>
              <th>Carga para el organizador</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Torneo corto (Mundial, Copa América)</td>
              <td>Pronóstico de todos los partidos, tabla acumulada</td>
              <td>Alta pero breve</td>
            </tr>
            <tr>
              <td>Liga completa, fecha a fecha</td>
              <td>Se pronostica cada jornada; tabla general y premio por fecha</td>
              <td>Constante, meses</td>
            </tr>
            <tr>
              <td>Solo fase final / eliminatorias</td>
              <td>Arranca en octavos o cuartos, pocos partidos</td>
              <td>Baja</td>
            </tr>
            <tr>
              <td>Fecha suelta (un clásico, una final)</td>
              <td>Un partido, marcador exacto, premio único</td>
              <td>Mínima</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Si es tu primera penca, empezá por un torneo corto o una fase final:
        descubrís qué reglas te faltaban sin quedar atrapado nueve meses con un
        reglamento que no funciona.
      </p>

      <h2>1. El grupo y el pozo</h2>
      <p>
        Definí cuántos juegan y cuánto pone cada uno. Entre amigos funciona con
        8–15; en un club o una oficina, 30–100. Poné un monto que todos paguen
        sin pensarlo: con monto bajo y mucha gente el pozo sale igual de grande y
        hay más ambiente.
      </p>
      <p>
        El tamaño cambia el juego. Con menos de ocho, dos fechas malas te dejan
        sin pelea. Con más de cincuenta, el que va decimoquinto siente que no
        juega a nada y ahí hace falta el premio por fecha. Si tenés que
        insistirle a alguien para que ponga, el monto está alto para ese grupo:
        la palanca para un pozo más grande es sumar gente, no subir la cuota.
      </p>
      <p>
        Decidí también si el organizador juega. Puede, pero entonces los
        pronósticos tienen que ser secretos hasta el cierre y los resultados no
        los debería cargar él a mano: si juega y controla la planilla, cualquier
        error de tipeo suyo se va a leer como trampa.
      </p>

      <h2>2. Las reglas, antes del primer partido</h2>
      <ul>
        <li>
          <strong>Puntaje.</strong> El clásico: 3 por resultado exacto, 1 por el
          ganador, 0 si errás. Variantes en la{' '}
          <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
        </li>
        <li>
          <strong>Cierre de pronósticos:</strong> al empezar cada partido.
        </li>
        <li>
          <strong>Alargue y penales:</strong> normalmente cuenta el resultado de
          los 90 minutos.
        </li>
        <li>
          <strong>Desempate</strong> y <strong>reparto del pozo</strong>.
        </li>
      </ul>
      <div className="gu__note">
        <p>
          Escribilas donde todos las vean. Casi todas las discusiones de una penca
          salen de una regla que nadie dejó por escrito.
        </p>
      </div>

      <h3>El cierre, con margen</h3>
      <p>
        “Al empezar el partido” suena claro hasta que alguien manda el pronóstico
        por mensaje dos minutos antes del pitazo. Si anotás a mano, cerrá{' '}
        <strong>una hora antes</strong> del primer partido de la fecha: te da
        tiempo a cargar todo y elimina la discusión de si el mensaje llegó antes
        o después. Con una app el cierre puede ser exacto al pitazo, porque lo
        hace el reloj y no vos.
      </p>
      <p>
        Fijá también qué pasa con el que no carga nada: o 0 puntos en esos
        partidos, o un pronóstico por defecto idéntico para todos (1-1 suele ser
        el menos arbitrario). Lo que no funciona nunca es aceptarlo después del
        partido; la primera vez que lo permitís, perdiste el reglamento para todo
        el torneo.
      </p>

      <h3>Alargue y penales</h3>
      <p>
        La regla que menos problemas trae es que{' '}
        <strong>cuenta el resultado de los 90 minutos</strong> (más descuento).
        Un partido que termina 1-1 y se define por penales es un 1-1 para la
        penca: el que puso 1-1 cobra sus 3 puntos y nadie acertó “ganador”,
        porque en los 90 no hubo. Aclaralo o vas a tener a alguien sosteniendo
        que su 2-1 era correcto “porque igual pasó”.
      </p>
      <p>
        Si querés premiar el alargue, hacelo como pregunta aparte (“¿quién pasa
        de ronda?” por 1 punto extra) en vez de cambiar cómo se puntúa el
        marcador.
      </p>

      <h3>Partidos aplazados, suspendidos y anulados</h3>
      <p>En ligas largas pasa siempre. Tenelo resuelto de antemano:</p>
      <ul>
        <li>
          <strong>Aplazado y reprogramado:</strong> los pronósticos ya cargados
          siguen valiendo y se puntúa con el resultado del día que se juegue. No
          reabras la carga, o el que pronosticó hace tres semanas queda en
          desventaja frente al que corrige ahora.
        </li>
        <li>
          <strong>Suspendido y retomado desde el minuto en que quedó:</strong>{' '}
          vale el marcador final acumulado, no el parcial del día de la
          suspensión.
        </li>
        <li>
          <strong>Suspendido y repetido desde 0-0:</strong> lo más limpio es
          puntuar el que se jugó completo. Decidilo una vez y aplicalo igual todo
          el torneo.
        </li>
        <li>
          <strong>Anulado o resuelto por tribunal:</strong> no suma a nadie. No
          inventes un resultado de escritorio; un 3-0 administrativo no es algo
          que nadie pudiera pronosticar.
        </li>
      </ul>
      <p>
        Si el aplazado se corre más allá de la última jornada de la penca, cerrá
        sin él y repartí. Arrastrar la penca tres semanas por un partido suelto
        mata el entusiasmo acumulado.
      </p>

      <h2>3. Los desempates, decididos antes de necesitarlos</h2>
      <p>
        Dos empatados en la última fecha es más común de lo que parece, sobre
        todo en pencas cortas con puntaje 3/1/0, y el peor momento para decidir
        cómo desempatar es cuando ya sabés quiénes son. Escribí un orden de
        criterios y aplicalos de arriba hacia abajo hasta que uno separe:
      </p>
      <ol>
        <li>
          <strong>Más resultados exactos.</strong> El más justo y el más fácil de
          explicar: premia a quien arriesgó marcadores en vez de ir a lo seguro.
        </li>
        <li>
          <strong>Menor diferencia total de goles.</strong> Sumá, partido por
          partido, la diferencia entre los goles pronosticados y los reales; gana
          el número más bajo. Mide qué tan cerca estuvo incluso cuando falló.
        </li>
        <li>
          <strong>Un partido designado de antemano</strong> (la final, el
          clásico): gana quien estuvo más cerca en ese.
        </li>
        <li>
          <strong>Sorteo, o dividir el premio.</strong> Último recurso. Dividir es
          lo más pacífico; el sorteo necesita hacerse delante de todos.
        </li>
      </ol>
      <div className="gu__note">
        <p>
          Dos o tres criterios alcanzan. Un reglamento con seis niveles de
          desempate no lo lee nadie, y cuando hace falta aplicarlo terminás
          explicándolo por mensaje a las once de la noche.
        </p>
      </div>

      <h2>4. Cobrá antes de arrancar</h2>
      <p>
        El que paga después de ver la tabla, no paga. Cobrá todo antes del primer
        partido y llevá una lista visible de quién ya puso.
      </p>
      <p>
        “Visible” es la palabra importante. La lista pública de pagados hace el
        trabajo de cobranza por vos: nadie quiere ser el único nombre sin tilde
        en una lista que ven veinte personas. Funciona mejor que los
        recordatorios privados y te saca el papel de cobrador. Tres detalles más
        que evitan casi todos los líos de plata:
      </p>
      <ul>
        <li>
          <strong>Un solo canal de cobro.</strong> Si te entra plata por tres apps
          distintas más efectivo, perdés la cuenta en la segunda semana.
        </li>
        <li>
          <strong>Que el concepto de la transferencia sea el nombre con el que
          juega.</strong> Si en la penca es “Tincho” y la transferencia llega con
          otro nombre y sin concepto, no sabés de quién es.
        </li>
        <li>
          <strong>Regla explícita del impago.</strong> Lo más sano: el que no pagó
          antes del cierre puede jugar y aparecer en la tabla, pero no cobra
          premios. Nadie queda afuera por plata y nadie gana sin haber puesto.
        </li>
      </ul>

      <h3>El que se suma tarde</h3>
      <p>
        Siempre aparece alguien en la tercera fecha pidiendo entrar. Entra, pero
        con una regla fija, nunca negociada caso por caso:
      </p>
      <ul>
        <li>
          <strong>Entra con 0 puntos y paga completo.</strong> Lo más simple:
          sabe que viene de atrás y lo acepta.
        </li>
        <li>
          <strong>Entra con los puntos del último de la tabla.</strong> Más
          generoso y lo mantiene con ilusión. Decidilo antes del primer caso: si
          lo decidís después, parece un favor.
        </li>
        <li>
          <strong>Entra solo al premio por fecha</strong>, con cuota reducida y
          sin pelear la tabla general. Útil en ligas largas.
        </li>
      </ul>
      <p>
        Lo que no se hace: dejarlo cargar fechas ya jugadas, ni aceptarlo en la
        tabla general pasada la mitad del torneo.
      </p>

      <h3>El que se quiere borrar a mitad de torneo</h3>
      <p>
        La respuesta corta es que la plata no se devuelve. No por mezquindad:
        el pozo ya está repartido en premios que el resto calculó, y si devolvés
        una cuota en la fecha diez, el que abandona termina decidiendo cuánto
        cobran los demás. Dejalo escrito en una línea desde el principio: “la
        cuota no se devuelve; el que abandona queda en la tabla con los puntos
        que tenga”. Si el motivo es serio y el grupo quiere devolverle, que sea
        una decisión del grupo, no un derecho del reglamento.
      </p>

      <h2>5. Repartí en varios puestos</h2>
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
        Guardá algo para <strong>premio por fecha</strong>: mantiene jugando a los
        que ya no pelean el primer puesto.
      </p>
      <p>
        Cuánto guardar depende del largo del torneo: en un Mundial alcanza un
        10–15% del pozo; en una liga de nueve meses, hasta un 30%, porque son
        muchas más jornadas y es lo único que sostiene a la mitad de abajo de la
        tabla. Hacé esa cuenta antes de anunciar los premios: si prometés
        60/30/10 y además premio por fecha, los porcentajes ya no cierran.
      </p>
      <p>
        Con menos de diez jugadores, tres puestos dejan al tercero cobrando casi
        la cuota que puso: mejor 70/30. Con grupos grandes, agregá premios
        laterales que no dependen de ir primero —mejor fecha, más resultados
        exactos, o el último de la tabla, que suele ser el premio del que más se
        habla.
      </p>

      <h3>Que la penca siga viva en las últimas fechas</h3>
      <p>
        El riesgo de toda penca larga es el mismo: a dos fechas del final el
        líder saca doce puntos y nadie más tiene motivo para cargar pronósticos.
        Qué lo evita:
      </p>
      <ul>
        <li>
          <strong>Bonus al campeón del torneo</strong>, con el pick congelado
          antes del primer partido. Un bonus grande (20–25 puntos) mantiene la
          tabla matemáticamente abierta hasta la final.
        </li>
        <li>
          <strong>Premio por fecha en las últimas jornadas:</strong> aunque la
          tabla general esté resuelta, cada fecha sigue teniendo algo en juego.
        </li>
        <li>
          <strong>Mandá la tabla después de cada jornada</strong>, no cuando te
          acordás. Ese mensaje es lo que hace que la gente cargue la próxima.
        </li>
        <li>
          <strong>Nombrá a los que suben.</strong> “Fulano pasó del 14 al 8” hace
          más por la participación que el ranking pegado sin comentario.
        </li>
      </ul>

      <h2>6. Errores típicos del organizador novato</h2>
      <ul>
        <li>
          <strong>Arrancar sin reglamento escrito</strong> y resolver cada caso
          cuando aparece. Lo que decidas con el torneo empezado se va a leer como
          que favorece a alguien.
        </li>
        <li>
          <strong>Dejar los pronósticos a la vista antes del cierre.</strong> En
          un grupo de mensajería, el último en escribir ve lo que pusieron los
          demás. O van por privado al organizador, o van a una herramienta que
          los oculte hasta el cierre.
        </li>
        <li>
          <strong>Cambiar el puntaje a mitad de torneo</strong> porque “así es más
          justo”. Los puntos ya repartidos no se recalculan sin que alguien
          pierda posiciones que ya tenía.
        </li>
        <li>
          <strong>No fijar un desempate</strong> y descubrirlo el día de la final.
        </li>
        <li>
          <strong>Confiar en una sola planilla sin copia.</strong> Un archivo
          compartido que alguien edita por error te borra tres fechas de trabajo.
        </li>
        <li>
          <strong>Cobrar sobre la marcha.</strong> A mitad de torneo ya no sabés
          quién puso, y preguntarlo entonces es incómodo para todos.
        </li>
        <li>
          <strong>Sumar partidos de más.</strong> Veinte por fecha suena mejor y
          hace que la gente cargue cualquier cosa, o no cargue. Menos partidos,
          mejor pronosticados.
        </li>
      </ul>

      <h2>7. Que la planilla no te coma</h2>
      <p>
        Copiar resultados, sumar puntos y contestar “¿cómo voy?” cada semana es lo
        que hace que las pencas se abandonen a mitad de torneo. El organizador no
        se aburre del fútbol: se aburre de ser el administrador, y cuando se
        cansa la penca termina dos fechas después aunque el grupo siguiera
        enganchado.
      </p>
      <p>
        Hacé la cuenta antes de elegir cómo llevarla: partidos por fecha ×
        jugadores son las celdas que alguien escribe y revisa cada jornada. Diez
        partidos y veinte jugadores son doscientos pronósticos por fecha; a mano
        eso no se sostiene tres meses y cada error de tipeo es una discusión.
      </p>
      <p>
        Con una{' '}
        <Link href="/guias/aplicacion-para-quinielas">app para quinielas</Link> eso
        pasa solo: los resultados entran automáticos, el puntaje se calcula con la
        regla que configuraste, los pronósticos quedan ocultos hasta el cierre y
        la tabla se actualiza en vivo. Te quedás con la única parte que no se
        puede automatizar: cobrar el pozo y repartirlo.
      </p>
      <p>
        Para seguir, está el{' '}
        <Link href="/guias/como-organizar-una-quiniela">
          paso a paso general para organizar una quiniela
        </Link>
        , la{' '}
        <Link href="/guias/sistemas-de-puntos">comparación de sistemas de puntos</Link>{' '}
        si todavía dudás del 3/1/0, y la{' '}
        <Link href="/guias/prode-como-armarlo">guía del prode argentino</Link>, con
        el formato de doble chance y las variantes que se usan allá.
      </p>
    </GuiaShell>
  );
}
