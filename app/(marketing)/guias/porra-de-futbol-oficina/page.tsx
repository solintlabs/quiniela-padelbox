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
  'Cómo montar la porra de fútbol de la oficina sin que se convierta en un problema: cómo proponerla, qué cuota poner con sueldos distintos, reglamento, desempates, partidos aplazados y quién organiza. Guía práctica y app gratis.';

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
    a: 'Lo habitual son cantidades pequeñas, entre 5 y 20 euros por persona, para que entre todo el mundo. Con muchos participantes el bote sale grande igualmente y el ambiente es mejor que con cuotas altas. Si en el grupo hay sueldos muy distintos, baja la cuota antes que subirla: el objetivo es que nadie tenga que pensárselo.',
  },
  {
    q: '¿Cómo se reparte el bote de la porra?',
    a: 'El reparto más común es 60% para el primero, 30% para el segundo y 10% para el tercero. En torneos largos conviene reservar una parte para premios por jornada, porque es lo que mantiene jugando a quien ya no puede ganar la general. Lo importante es que el reparto esté escrito antes del primer partido y no se cambie a mitad.',
  },
  {
    q: '¿Cómo propongo la porra sin que nadie se sienta obligado a participar?',
    a: 'Propónla en un canal donde la gente pueda ignorarla sin dar explicaciones, nunca en una reunión ni preguntando uno por uno. Dilo una vez, deja claro que apuntarse es opcional y no vuelvas a insistir individualmente. Si quien la propone es jefe de alguien, mejor que organice otra persona del equipo.',
  },
  {
    q: '¿Y si alguien se apunta cuando el torneo ya ha empezado?',
    a: 'Decídelo antes de empezar y escríbelo. Lo más limpio es admitir incorporaciones hasta una fecha concreta pagando la cuota completa y empezando con los puntos de las jornadas ya jugadas en cero. Pasada esa fecha no se admite a nadie más, porque un participante que entra sin opciones reales acaba abandonando igual.',
  },
  {
    q: '¿Se puede jugar con compañeros de otras sedes o en teletrabajo?',
    a: 'Sí, y es uno de los mejores usos de la porra: es una de las pocas cosas que une a gente que no coincide físicamente. La clave es que el pronóstico se pueda meter desde el móvil y que la clasificación esté siempre visible, sin depender de que alguien reenvíe una hoja de cálculo cada lunes.',
  },
  {
    q: '¿Hay una app gratis para llevar la porra de la oficina?',
    a: 'Sí. QuinielaBOX es gratis hasta 15 jugadores: los resultados se actualizan solos, los puntos se calculan automáticamente y cada compañero ve la clasificación desde su móvil. El dinero lo gestiona el organizador fuera de la app, como siempre.',
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
        El segundo motivo, menos evidente, es social: una porra mal planteada
        incomoda a quien no quiere jugar y pasa a ser una cosa más de la que estar
        pendiente en el trabajo. Esta guía va sobre las dos cosas.
      </p>

      <h2>1. Cómo proponerla sin que nadie se sienta obligado</h2>
      <p>
        Esta es la parte que casi nadie piensa y la que más determina si la porra
        sale bien. En un grupo de amigos apuntarse o no es irrelevante; en el
        trabajo, decir “no” cuesta más de lo que parece, sobre todo si lo propone
        alguien con galones.
      </p>
      <ul>
        <li>
          <strong>Propónla por escrito, no en persona.</strong> Un mensaje en un
          canal se puede ignorar sin dar explicaciones. Una pregunta directa en
          una reunión, no.
        </li>
        <li>
          <strong>Dilo una vez.</strong> Un anuncio y un recordatorio antes de
          cerrar inscripciones. Nada de insistir en privado: quien quiere jugar se
          apunta solo.
        </li>
        <li>
          <strong>Que no organice un jefe directo.</strong> Si el que recoge el
          dinero es quien firma tus vacaciones, participar deja de ser una
          decisión libre. Mejor que organice alguien del equipo, aunque el jefe
          juegue.
        </li>
        <li>
          <strong>Sin lista pública de quien no juega.</strong> La clasificación
          es pública; quién decidió no entrar, no es asunto de nadie.
        </li>
      </ul>
      <div className="gu__note">
        <p>
          <strong>Señal de alarma:</strong> si tienes que convencer a alguien más
          de una vez, ese alguien no quiere jugar. Una porra con quince personas
          enganchadas funciona mucho mejor que una con treinta de las que diez
          están por no quedar mal.
        </p>
      </div>

      <h2>2. Cuánto se pone cuando los sueldos son distintos</h2>
      <p>
        En una oficina lo que importa es que <strong>entre todo el mundo</strong>,
        no que el bote sea enorme. Una cuota de 5–20 € por persona es lo típico.
        Con 40 compañeros a 10 €, el bote son 400 € — de sobra.
      </p>
      <p>
        El error clásico es fijar la cuota entre los cuatro que más fútbol ven.
        Para ellos 30 € no es nada; para alguien que acaba de entrar en prácticas,
        sí. Y nadie va a decir en voz alta que le parece caro. La regla práctica:{' '}
        <strong>
          elige la cantidad que la persona que cobra menos del grupo pueda poner
          sin pensarlo
        </strong>
        , y no la subas de ahí. Si a los veteranos les parece poco, que compitan
        por ganar, no por el importe.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Tamaño del grupo</th>
              <th>Cuota razonable</th>
              <th>Bote</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>6–12 personas</td><td>10–15 €</td><td>60–180 €</td></tr>
            <tr><td>13–25 personas</td><td>10 €</td><td>130–250 €</td></tr>
            <tr><td>26–50 personas</td><td>5–10 €</td><td>130–500 €</td></tr>
            <tr><td>Más de 50</td><td>5 €</td><td>250 € o más</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        A partir de cierto tamaño conviene <em>bajar</em> la cuota: el bote crece
        solo con la gente, y una cuota baja es lo que hace que se apunte el
        departamento entero en lugar de media plantilla.
      </p>
      <div className="gu__note">
        <p>
          <strong>Importante:</strong> mantén el dinero fuera de cualquier
          aplicación. Lo recoge y reparte una persona, como siempre. Y plantéalo
          siempre como lo que es: un juego entre compañeros con un bote simbólico.
          Si las cantidades empiezan a ser serias, deja de ser eso. Sé prudente y
          mantén las cifras pequeñas; es sentido común, y además es lo que hace
          que la porra dure años.
        </p>
      </div>

      <h2>3. Elige el torneo según el calendario laboral</h2>
      <p>
        No todos los torneos encajan igual en una oficina, y elegir mal apaga la
        porra a las tres semanas.
      </p>
      <ul>
        <li>
          <strong>Mundial o Europeo (un mes).</strong> La mejor para empezar:
          partidos casi a diario, formato corto y en verano, cuando la carga de
          trabajo suele bajar.
        </li>
        <li>
          <strong>Champions por eliminatorias.</strong> Pocas jornadas, muy
          espaciadas y de noche. La de menos mantenimiento.
        </li>
        <li>
          <strong>Una temporada de liga completa.</strong> Da nueve meses de
          conversación, pero exige constancia y un parón previsto en Navidad.
          Detalles en la{' '}
          <Link href="/guias/quiniela-de-laliga">guía de la quiniela de LaLiga</Link>
          .
        </li>
      </ul>
      <p>
        Y un detalle que solo aplica al trabajo: evita arrancar en la semana del
        cierre trimestral o justo antes de las vacaciones de agosto. La porra
        necesita dos o tres jornadas para coger inercia, y si caen en el peor
        momento del año, no la coge nunca.
      </p>

      <h2>4. Un canal aparte, siempre</h2>
      <p>
        La porra genera muchísimos mensajes: pique, capturas de la clasificación,
        lamentos del domingo por la noche. En el canal general del equipo eso es
        ruido para quien no juega y para quien está intentando trabajar.
      </p>
      <ul>
        <li>
          <strong>Canal o grupo dedicado</strong>, al que se entra por decisión
          propia y del que se puede salir sin que sea un gesto.
        </li>
        <li>
          <strong>Nunca en el canal de trabajo</strong>, ni “solo para avisar del
          cierre”. El aviso del cierre lo da la app, no una persona.
        </li>
        <li>
          <strong>Nada de menciones a todo el canal</strong> para recordar que
          falta meter pronósticos.
        </li>
        <li>
          <strong>Respeta el horario.</strong> El pique del domingo por la noche
          es parte de la diversión, pero no en el móvil del trabajo de quien ya ha
          cerrado el portátil.
        </li>
      </ul>

      <h2>5. Reglas en un sitio donde todos las vean</h2>
      <p>
        Las reglas tienen que estar escritas <em>antes</em> del primer partido. No
        porque alguien vaya a hacer trampas, sino porque sin texto cualquier caso
        raro se resuelve a criterio del organizador — y entonces el organizador
        parece parcial, haga lo que haga.
      </p>
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
          los 90 minutos. Escríbelo igual: en la primera eliminatoria que se vaya
          a la prórroga, alguien lo va a preguntar.
        </li>
        <li>
          <strong>Quien no pronostica</strong> suma cero en ese partido. La
          alternativa (repetir el último pronóstico, poner 0-0 automático) tiene
          que estar escrita, nunca improvisada.
        </li>
        <li>
          <strong>Desempate</strong> y <strong>reparto del bote</strong>, los dos
          detallados más abajo.
        </li>
      </ul>

      <h3>Reglamento de desempates</h3>
      <p>
        Con treinta personas y veinte jornadas, el empate en lo alto de la tabla
        pasa. Y resolverlo <em>después</em> es imposible sin que alguien sienta
        que se le ha quitado algo. Define una cadena de criterios en orden:
      </p>
      <ol>
        <li>Más marcadores exactos acertados en todo el torneo.</li>
        <li>Más puntos en la última jornada disputada.</li>
        <li>Más jornadas en las que se pronosticó completo.</li>
        <li>Si sigue el empate, se reparte el premio a partes iguales.</li>
      </ol>
      <p>
        El cuarto punto es el importante: cierra la cadena y evita inventar un
        criterio nuevo en el último momento. Los sorteos entre los empatados
        suenan divertidos, pero generan más discusión que el reparto.
      </p>

      <h3>Partidos aplazados y suspendidos</h3>
      <p>
        Pasa en todas las ligas: niebla, una final de copa que mueve una jornada,
        un partido que se juega un miércoles tres semanas después. La regla
        sencilla y que no falla:{' '}
        <strong>
          el partido puntúa cuando se juega, con los pronósticos que ya estaban
          enviados
        </strong>
        . Si se reabre el pronóstico, quien ya había acertado se siente
        estafado; si se anula el partido, se pierden puntos que la gente ya daba
        por suyos. Y si uno se suspende a mitad y se da por terminado, cuenta el
        marcador de ese momento.
      </p>

      <h2>6. Cobra antes del primer partido</h2>
      <p>
        Es la regla que más disgustos ahorra. Quien paga después de ver la
        clasificación, no paga. Pero en el trabajo hay que hacerlo sin que parezca
        que estás reclamando una deuda a un compañero.
      </p>
      <ul>
        <li>
          <strong>Una lista de pagados, no de deudores.</strong> Un visto al lado
          del nombre de quien ya ha pagado basta. No hace falta señalar lo
          contrario.
        </li>
        <li>
          <strong>Un único recordatorio general</strong> dos días antes del
          cierre, en el canal de la porra, sin nombres.
        </li>
        <li>
          <strong>Si alguien no paga, no entra.</strong> Y punto: así no hay que
          perseguir a nadie después. Lo que no se puede hacer es dejarle jugar y
          luego recordárselo cada semana.
        </li>
        <li>
          <strong>Que cobre y pague la misma persona</strong>, y que diga el bote
          total cuando se cierre. Transparencia sin ceremonia.
        </li>
      </ul>

      <h2>7. Quién organiza y cómo no quemarlo</h2>
      <p>
        La porra de oficina casi siempre muere por agotamiento de una persona. Las
        tres tareas son: montar el torneo y escribir las reglas, llevar el dinero
        y mantener la clasificación al día. Conviene separar las dos primeras
        entre dos personas, mejor de departamentos distintos: así nadie lleva solo
        la parte incómoda y, si uno se va de vacaciones o cambia de empresa, la
        porra no se queda huérfana a mitad de temporada.
      </p>
      <p>
        La tercera es la que consume tiempo todas las semanas, y es justo la que
        no debería hacer ningún humano. Una temporada de liga son 38 jornadas: si
        cada semana hay que copiar marcadores, sumar puntos y actualizar una hoja,
        la porra no llega a Navidad. Con una{' '}
        <Link href="/guias/aplicacion-para-quinielas">app para porras y quinielas</Link>{' '}
        cada compañero mete sus pronósticos desde el móvil, los resultados entran
        solos y la clasificación se actualiza sin que nadie toque nada. Eso
        elimina la tarea semanal y los errores de suma, que son la otra fuente
        clásica de discusión. El montaje paso a paso está en la{' '}
        <Link href="/guias/como-organizar-una-quiniela">
          guía de cómo organizar una quiniela
        </Link>
        .
      </p>

      <h2>8. Gente en otras sedes y en teletrabajo</h2>
      <p>
        Aquí la porra tiene valor real: es una de las pocas cosas que hace que
        alguien de otra sede, o que trabaja desde casa, aparezca en una
        conversación informal sin que nadie organice nada. Para que funcione en
        un grupo repartido:
      </p>
      <ul>
        <li>
          <strong>Todo desde el móvil.</strong> Si hay que pedirle la hoja a
          alguien, los de fuera no juegan.
        </li>
        <li>
          <strong>Clasificación visible 24/7</strong>, no un pantallazo que se
          publica los lunes a media mañana.
        </li>
        <li>
          <strong>Horarios y husos.</strong> Si hay compañeros en América, el
          cierre al pitido inicial es la única regla que no genera agravios.
        </li>
        <li>
          <strong>El cobro, resuelto a distancia.</strong> Decide antes cómo paga
          quien no pasa por la oficina, para que no sea el eterno pendiente.
        </li>
      </ul>

      <h2>9. Reparte en varios tramos</h2>
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
        <strong>premios por jornada</strong>: es lo que evita que en noviembre ya
        solo jueguen cuatro.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Reparto en torneo largo</th>
              <th>Del bote</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1º de la general</td><td>45%</td></tr>
            <tr><td>2º de la general</td><td>20%</td></tr>
            <tr><td>3º de la general</td><td>10%</td></tr>
            <tr><td>Mejor de cada jornada</td><td>25%</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Los premios por jornada no tienen que ser dinero: un café invitado,
        elegir el sitio de la comida del viernes o simplemente salir nombrado en
        el canal funcionan igual. Engancha el reconocimiento, no el importe.
      </p>

      <h2>10. Mantener la participación en la recta final</h2>
      <p>
        A partir de la mitad del torneo, la mayoría ya sabe que no puede ganar.
        Ahí es donde se pierde la gente, y una porra con cuatro jugadores activos
        ya no da conversación. Lo que funciona:
      </p>
      <ul>
        <li>
          <strong>Premio por jornada</strong>, que da a cualquiera algo que ganar
          esta semana aunque vaya último.
        </li>
        <li>
          <strong>Mini-clasificación del último mes</strong>, un torneo dentro del
          torneo que vuelve a poner a todos a cero.
        </li>
        <li>
          <strong>Premio al farolillo rojo</strong>, pequeño y con gracia: quita
          el estigma de ir último.
        </li>
        <li>
          <strong>Un resumen corto los lunes</strong>: líder, mejor de la jornada
          y el fallo más llamativo. Dos líneas; si parece una newsletter, nadie la
          lee.
        </li>
      </ul>

      <h2>Errores típicos</h2>
      <ul>
        <li>Que las reglas vivan en la cabeza del organizador.</li>
        <li>Proponerla preguntando uno por uno, o en una reunión de equipo.</li>
        <li>Fijar la cuota entre los cuatro a los que el dinero les da igual.</li>
        <li>Usar el canal de trabajo para el pique y los avisos.</li>
        <li>Aceptar pronósticos tarde “por esta vez”.</li>
        <li>No tener escrito el desempate hasta que ya hay dos empatados.</li>
        <li>Improvisar qué pasa con un partido aplazado.</li>
        <li>Perseguir a la gente para cobrar a mitad de temporada.</li>
        <li>Premiar solo al ganador en un torneo de 38 jornadas.</li>
        <li>Dejar toda la gestión semanal en manos de una sola persona.</li>
      </ul>
      <p>
        Resumido en una frase: la porra de la oficina sale bien cuando apuntarse
        es fácil, salirse no cuesta nada y nadie tiene que sumar puntos a mano.
      </p>
    </GuiaShell>
  );
}
