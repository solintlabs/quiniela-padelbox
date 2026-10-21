import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

export const metadata: Metadata = {
  title: 'Cómo organizar una quiniela de fútbol paso a paso',
  description:
    'Guía completa para organizar una quiniela de fútbol: qué torneo elegir, cuánta gente, qué cuota poner, cómo redactar el reglamento, el cierre de pronósticos, desempates, partidos aplazados, cobro del bote y reparto de premios.',
  alternates: { canonical: '/guias/como-organizar-una-quiniela' },
  openGraph: {
    title: 'Cómo organizar una quiniela de fútbol paso a paso',
    description:
      'Cuota, reglas, cierre de pronósticos y reparto del bote. El guion completo para que tu quiniela no se caiga a medio torneo.',
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Cuántas personas hacen falta para montar una quiniela?',
    a: 'Con 5 ya se puede jugar, pero por debajo de 8 la clasificación se decide muy pronto. El rango más cómodo entre amigos es 10–20 personas: hay movimiento en la tabla y todo el mundo se conoce. Por encima de 40 conviene repartir premios en más tramos y dejar de llevar las cuentas a mano.',
  },
  {
    q: '¿Cuándo deben cerrar los pronósticos?',
    a: 'Lo habitual es al pitido inicial de cada partido, y lo más seguro es unos minutos antes. El cierre tiene que ser automático o verificable: si depende de que el organizador recoja mensajes, siempre aparece alguien que jura haber enviado el pronóstico a tiempo. Es la regla que más discusiones evita.',
  },
  {
    q: '¿Qué pasa si un partido se aplaza o se suspende?',
    a: 'Decídelo por escrito antes de empezar. La opción más limpia: si se juega en otra fecha, los pronósticos siguen válidos y se puntúa cuando se dispute; si se suspende y se reanuda, cuenta el resultado oficial final; si no se juega nunca, se anula y no suma a nadie. Lo que no funciona es improvisarlo cuando ya hay alguien beneficiado.',
  },
  {
    q: '¿Cómo cobro el bote sin quedarme con el marrón?',
    a: 'Cobra todo antes del primer partido, usa un solo método de pago con los datos escritos y mantén visible la lista de quién ha pagado. Quien no ha pagado, no pronostica: aplicado desde el minuto uno nadie lo discute, aplicado en la jornada cinco es un conflicto.',
  },
  {
    q: '¿Cómo se reparte el premio si hay empate a puntos?',
    a: 'Primero aplica los criterios de desempate que fijaste, normalmente más marcadores exactos acertados y después otro criterio objetivo. Si agotados todos el empate persiste, lo razonable es dividir a partes iguales los premios de los puestos implicados. Ese orden debe estar escrito antes de que haya dinero en juego.',
  },
  {
    q: '¿Puede entrar alguien cuando la quiniela ya ha empezado?',
    a: 'Sí, si lo decides de antemano. Lo habitual es permitir entrar hasta una fecha límite pagando la cuota completa y con 0 puntos en los partidos ya jugados. Pasada esa fecha, lo sano es apuntarlo a la siguiente: quien entra tarde con la cuota rebajada molesta a todos los que pagaron a tiempo.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Cómo organizar una quiniela de fútbol paso a paso"
      lede="Organizar una quiniela es fácil; que aguante hasta la final, no tanto. Esto es lo que marca la diferencia."
      slug="como-organizar-una-quiniela"
      description="Guía paso a paso para organizar una quiniela de fútbol: torneo, grupo, cuota, reglamento, cierre de pronósticos, desempates, cobro del bote y reparto de premios."
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <p>
        Una quiniela se monta en diez minutos y se abandona en tres semanas. Casi
        nunca falla por el fútbol: falla porque nadie decidió qué pasa cuando dos
        van empatados, porque el organizador se cansó de copiar resultados a mano o
        porque a la tercera jornada la mitad del grupo ya no podía ganar. Estas son
        todas las decisiones, en el orden en que conviene tomarlas.
      </p>

      <h2>1. Elige el torneo según cuánto quieres que dure</h2>
      <p>
        Es la primera decisión y la que condiciona todo lo demás: marca cuántos
        partidos hay que pronosticar y cuánto tiempo aguanta la atención del grupo.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Torneo</th>
              <th>Cuánto dura</th>
              <th>Partidos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Una jornada suelta de liga</td>
              <td>Un fin de semana</td>
              <td>10</td>
            </tr>
            <tr>
              <td>Fase final de copa (de cuartos a la final)</td>
              <td>3–4 semanas</td>
              <td>7</td>
            </tr>
            <tr>
              <td>Mundial 2026</td>
              <td>Un mes</td>
              <td>104</td>
            </tr>
            <tr>
              <td>Una liga completa</td>
              <td>De agosto a mayo</td>
              <td>38 jornadas</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>Si es tu primera quiniela, empieza corta.</strong> Una jornada
        suelta o una fase final te deja ver cómo responde el grupo y qué reglas se
        te han quedado cojas, sin comprometer a nadie nueve meses.
      </p>
      <p>
        En un torneo corto e intenso todo el mundo está pendiente del fútbol
        igualmente y casi nadie se olvida de jugar; lo complicado es el ritmo de
        cierres encadenados (la{' '}
        <Link href="/guias/quiniela-mundial-2026">
          guía del Mundial 2026
        </Link>{' '}
        entra en las reglas del formato de 48 selecciones). En una liga completa
        nadie se emociona en la jornada 14: lo que sostiene el grupo son los premios
        intermedios y los recordatorios, como detalla la{' '}
        <Link href="/guias/quiniela-de-laliga">guía de la quiniela de LaLiga</Link>.
      </p>
      <div className="gu__note">
        <p>
          <strong>Error frecuente:</strong> mezclar liga, copa y Champions para
          tener más partidos. Acaba en calendarios solapados, partidos que cambian
          de fecha y participantes que no siguen la mitad de los equipos. Una
          competición por quiniela.
        </p>
      </div>

      <h2>2. Decide quién juega y cuánto se paga</h2>
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

      <h3>Qué cambia según el tamaño del grupo</h3>
      <ul>
        <li>
          <strong>Menos de 8.</strong> El ganador se ve venir a media competición.
          Si no puedes juntar más gente, acorta el torneo: en siete partidos
          cualquiera gana.
        </li>
        <li>
          <strong>10 a 20.</strong> El punto dulce. Basta premiar dos o tres puestos
          y la comunicación cabe en un grupo de mensajería.
        </li>
        <li>
          <strong>20 a 50.</strong> Ya no todos se conocen y la clasificación pública
          pasa a ser el motor. Aquí hacen falta premios por jornada: con 40 personas,
          treinta y cinco saben en diciembre que no van a ganar el bote.
        </li>
        <li>
          <strong>Más de 50.</strong> Llevarlo a mano deja de ser viable, y necesitas
          a alguien más que pueda cobrar y responder dudas o todo se para cuando te
          vas de vacaciones.
        </li>
      </ul>
      <p>
        Cuanta más gente, además, más empates a puntos: con 60 participantes y un
        sistema de 3/1/0 es normal acabar con tres o cuatro personas empatadas
        arriba. Si vas a ser grande, el desempate deja de ser un formalismo.
      </p>

      <h2>3. Fija las reglas ANTES de que empiece</h2>
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

      <h3>El reglamento: lo que no puede faltar</h3>
      <p>
        No hace falta un documento legal. Un mensaje fijado en el grupo con estos
        nueve puntos resueltos cubre casi todo lo discutible:
      </p>
      <ol>
        <li>
          <strong>Qué se pronostica:</strong> marcador exacto (2-1) o solo el signo.
          El marcador da más matices; el signo es más fácil para grupos poco
          futboleros.
        </li>
        <li>
          <strong>Puntuación exacta, con un ejemplo numérico al lado.</strong> Un
          ejemplo evita más dudas que tres párrafos.
        </li>
        <li>
          <strong>Hora de cierre</strong> y qué pasa si no envías pronóstico (lo
          habitual: 0 puntos en ese partido).
        </li>
        <li>
          <strong>Prórroga y penales:</strong> a los 90 minutos salvo que digas lo
          contrario.
        </li>
        <li>
          <strong>Partidos aplazados o suspendidos.</strong>
        </li>
        <li>
          <strong>Criterios de desempate, en orden.</strong>
        </li>
        <li>
          <strong>Reparto del bote</strong> con porcentajes.
        </li>
        <li>
          <strong>Fecha límite para apuntarse</strong> y condiciones de quien entra
          tarde.
        </li>
        <li>
          <strong>Quién decide</strong> si pasa algo no previsto. El grupo tiene que
          saber de antemano quién tiene la última palabra.
        </li>
      </ol>
      <div className="gu__note">
        <p>
          El reglamento no se cambia con el torneo empezado, y nunca a mitad de
          jornada. Si detectas un agujero, anótalo y arréglalo en la siguiente
          edición: cambiar una regla cuando ya se sabe a quién beneficia es la forma
          más rápida de reventar el grupo.
        </p>
      </div>

      <h2>4. El cierre de pronósticos: la regla que más discusiones evita</h2>
      <p>
        Si solo te vas a tomar en serio una regla, que sea esta. Un pronóstico
        enviado después del pitido inicial no es un pronóstico, y uno enviado
        después de un gol es directamente otro juego. Tres opciones, de peor a
        mejor:
      </p>
      <ul>
        <li>
          <strong>Por confianza</strong> (“mándame el tuyo antes de que empiece”).
          Depende de que nadie mienta y de que tú recuerdes a qué hora llegó cada
          mensaje.
        </li>
        <li>
          <strong>Manual, cerrado por ti.</strong> Te obliga a estar disponible a la
          hora exacta de cada partido. Con tres partidos un sábado, eso es la tarde
          entera pendiente del móvil; y una sola vez que se te pase es una
          discusión.
        </li>
        <li>
          <strong>Automático.</strong> Los pronósticos se bloquean solos y nadie
          arbitra nada. Es lo que hace cualquier{' '}
          <Link href="/guias/aplicacion-para-quinielas">
            aplicación para quinielas
          </Link>{' '}
          y la razón principal para usar una.
        </li>
      </ul>
      <p>
        Sobre el margen: cerrar justo al pitido inicial es lo intuitivo, pero un
        cierre 5–15 minutos antes es más limpio y evita el caso del que envía el
        pronóstico con el partido rodando porque su móvil iba atrasado.
      </p>
      <p>
        Caso límite que conviene tener resuelto: <strong>el partido que se
        adelanta</strong>. Si una hora de inicio cambia, el cierre cambia con ella y
        alguien se queda sin pronosticar. Avisa en cuanto lo sepas; si no te diste
        cuenta a tiempo, es más justo anular ese partido para todos que puntuarlo
        con la mitad del grupo fuera.
      </p>

      <h2>5. Elige cómo desempatar (esto se olvida siempre)</h2>
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
      <p>
        Si quieres un tercer criterio con más gracia que el orden de inscripción,
        funcionan bien los que son objetivos y comprobables: menos jornadas sin
        pronosticar, mejor puntuación en la última jornada, o un pronóstico de
        desempate pedido al principio y guardado cerrado (el total de goles de la
        final, por ejemplo). Lo que hay que evitar son criterios interpretables:
        “quien lo haya hecho mejor en los partidos importantes” no es un criterio,
        es una discusión con otro nombre. Y ten un plan para el empate que sobrevive
        a todo: reparto a partes iguales entre los implicados. Poco épico, pero
        indiscutible.
      </p>

      <h2>6. Partidos aplazados, suspendidos y resultados cambiados</h2>
      <p>
        En una liga completa va a pasar seguro. Decide ahora, no cuando ocurra:
      </p>
      <ul>
        <li>
          <strong>Aplazado a otra fecha.</strong> Lo más aceptado: los pronósticos
          se mantienen tal cual y se puntúa el día que se juegue. Reabrirlos es más
          justo en teoría, pero obliga a avisar a todos otra vez.
        </li>
        <li>
          <strong>Suspendido y reanudado.</strong> Cuenta el resultado oficial final,
          no el que había cuando se paró.
        </li>
        <li>
          <strong>No se juega nunca.</strong> Se anula: no suma ni resta a nadie.
          Dejarlo como 0-0 sería regalar puntos por un resultado que no existió.
        </li>
        <li>
          <strong>Resultado cambiado por la federación</strong> (alineación
          indebida, sanción). Cuenta lo que pasó en el campo: es lo que todo el
          mundo vio.
        </li>
      </ul>
      <p>
        Comunica cualquiera de estos casos en el momento y en el mismo sitio donde
        publicas la clasificación. Que un cambio aparezca sin explicación en la
        tabla es peor que el cambio en sí.
      </p>

      <h2>7. El que se apunta tarde</h2>
      <p>
        Siempre hay alguien que se entera cuando ya han pasado dos jornadas. Es
        buena señal, pero mal gestionado molesta a los que pagaron a tiempo. Lo que
        funciona:
      </p>
      <ul>
        <li>
          <strong>Fecha límite anunciada desde el principio</strong> (“se puede
          entrar hasta la jornada 3”).
        </li>
        <li>
          <strong>Cuota completa, sin descuento.</strong> El bote es el mismo para
          todos.
        </li>
        <li>
          <strong>Cero puntos en los partidos ya jugados.</strong> Entra con
          desventaja y lo sabe; si gana desde ahí, mejor historia.
        </li>
      </ul>
      <p>
        Lo que no funciona: dejarle pronosticar partidos ya disputados, rebajarle la
        cuota o darle una “media de puntos” de las jornadas perdidas. Lo primero es
        tramposo y lo demás te lo recordarán hasta el final. Pasada la fecha límite
        la respuesta es sencilla: apuntado para la siguiente. Una quiniela a la que
        se puede entrar en la jornada 30 no tiene clasificación, tiene lista de
        asistentes.
      </p>

      <h2>8. Cobra el bote de forma ordenada</h2>
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
        <li>
          <strong>Pide un concepto</strong> con el nombre del participante. Una
          transferencia anónima en una lista de treinta personas cuesta media hora
          de mensajes.
        </li>
      </ul>
      <p>
        Y <strong>que quien no ha pagado no pueda pronosticar</strong>. Desde el
        primer día nadie lo discute, porque es la condición de entrada; en la
        jornada cinco, cuando ya lleva puntos, es un conflicto garantizado.
      </p>
      <p>
        Decisión de la que nadie habla: <strong>qué haces si al final falta
        dinero</strong>. Con premios en porcentaje del bote, el bote es menor y los
        porcentajes se aplican a lo que hay. Prometer cantidades fijas te obliga a
        poner la diferencia de tu bolsillo. Por eso los porcentajes son más seguros
        para el organizador que las cifras cerradas.
      </p>
      <div className="gu__note">
        <p>
          En QuinielaBOX el organizador marca quién ha pagado y solo esos pueden
          pronosticar. El dinero lo sigues manejando tú, fuera de la app.
        </p>
      </div>

      <h2>9. Reparte los premios de forma que la gente siga jugando</h2>
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
      <p>
        Cómo cuadrar las dos cosas: reserva entre el 10% y el 25% del bote para
        premios intermedios y reparte el resto entre los puestos finales. En un
        torneo corto ese porcentaje puede ser bajo; en una liga de nueve meses
        conviene subirlo, porque es lo único que mantiene vivo a quien ya no pelea
        el primer puesto. Si el grupo pasa de cuarenta personas, añade un cuarto y
        un quinto puesto.
      </p>
      <p>
        El premio por jornada tampoco tiene que ser dinero: en una oficina o un club
        funcionan igual las consumiciones o una camiseta, y además te ahorra mover
        dinero cada semana. La{' '}
        <Link href="/guias/porra-de-futbol-oficina">
          guía de la porra de oficina
        </Link>{' '}
        entra más a fondo en los premios no monetarios. Y hay uno que cuesta cero y
        vale mucho: el <strong>farolillo rojo</strong>. Nombrar al último da tanta
        conversación como nombrar al primero, y le da un motivo para seguir jugando
        a quien ya no tiene ninguno.
      </p>

      <h2>10. La comunicación del día a día</h2>
      <p>
        Esta es la razón número uno por la que una quiniela muere: la gente se olvida
        de pronosticar, deja de sumar puntos y abandona. Manda un aviso antes de que
        cierren los partidos, o usa una herramienta que lo haga sola. Hay tres
        preguntas que conviene contestar el primer día:
      </p>
      <ul>
        <li>
          <strong>¿Dónde se ve la clasificación?</strong> Un sitio y solo uno, con el
          enlace fijado. Si la tabla vive en una hoja que tú actualizas y envías como
          imagen, estás creando trabajo para ti y versiones antiguas circulando para
          los demás.
        </li>
        <li>
          <strong>¿Cada cuánto se actualiza?</strong> Di una regla y cúmplela: “el
          lunes” o “en cuanto termina la jornada”. La falta de puntualidad genera más
          mensajes de “¿cómo voy?” que la propia curiosidad.
        </li>
        <li>
          <strong>¿Quién avisa, y cuándo?</strong> Un recordatorio antes de cada
          cierre es suficiente. Dos al día y la gente silencia el grupo, que es lo
          contrario de lo que quieres.
        </li>
      </ul>
      <p>
        Formato que funciona para el mensaje semanal: top 3, mejor de la jornada, un
        dato con gracia y el recordatorio del siguiente cierre. Cuatro líneas. Las
        clasificaciones largas pegadas en el chat no las lee nadie.
      </p>
      <div className="gu__note">
        <p>
          <strong>Lo que no debes hacer:</strong> comentar los pronósticos de los
          demás antes del cierre. Si alguien ve lo que ha puesto el líder, la
          quiniela deja de ser de pronósticos y pasa a ser de copiar.
        </p>
      </div>

      <h2>11. Cerrar el torneo y repartir</h2>
      <p>
        El cierre se improvisa casi siempre, y es el momento del que la gente se
        acuerda cuando decide si se apunta a la siguiente.
      </p>
      <ol>
        <li>
          <strong>Publica la clasificación final como provisional</strong> y da 24 o
          48 horas para revisar errores. Si hay un partido mal puntuado, es ahora;
          después del reparto ya no se arregla.
        </li>
        <li>
          <strong>Confirma la tabla y paga rápido.</strong> Un organizador que tarda
          dos semanas en repartir pierde la mitad del grupo para la siguiente
          edición.
        </li>
        <li>
          <strong>Haz el repaso.</strong> Qué regla se quedó corta, qué partido dio
          problemas, cuánta gente dejó de jugar y cuándo. Cinco minutos de notas y
          tienes el reglamento de la próxima resuelto.
        </li>
      </ol>
      <p>
        Y el mejor momento para lanzar la siguiente es justo ahí, con el ganador
        recién anunciado y el grupo todavía hablando del tema.
      </p>

      <h2>Checklist del organizador</h2>
      <p>Antes del primer partido deberías poder marcar todo esto:</p>
      <ul>
        <li>Torneo elegido y fecha de inicio conocida por todos.</li>
        <li>Lista de participantes con fecha límite de inscripción.</li>
        <li>Cuota fijada y método de pago único, con los datos escritos.</li>
        <li>Reglamento publicado donde todos lo vean (los nueve puntos del paso 3).</li>
        <li>Sistema de puntos con un ejemplo numérico.</li>
        <li>Hora de cierre definida y, a ser posible, automática.</li>
        <li>Criterios de desempate en orden.</li>
        <li>Reparto del bote en porcentajes, con la parte de premios intermedios.</li>
        <li>Qué pasa con aplazados, suspendidos y partidos no jugados.</li>
        <li>Sitio donde vive la clasificación y día en que se actualiza.</li>
        <li>Lista de pagos visible y al día.</li>
        <li>Alguien designado para decidir lo imprevisto.</li>
      </ul>

      <h2>Errores que se repiten</h2>
      <ul>
        <li>Empezar sin las reglas escritas.</li>
        <li>Llevar los pronósticos a mano en una hoja de cálculo o por chat.</li>
        <li>No cerrar los pronósticos a tiempo.</li>
        <li>Premiar solo al ganador.</li>
        <li>Cobrar el bote a mitad del torneo.</li>
        <li>Cambiar una regla con el torneo empezado.</li>
        <li>Elegir un torneo de nueve meses para la primera quiniela del grupo.</li>
        <li>Tardar en repartir el premio final.</li>
      </ul>

      <h2>La misma quiniela, otros nombres</h2>
      <p>
        Todo lo anterior vale igual sea cual sea el nombre que le dé tu grupo. Si
        buscas la versión escrita con el vocabulario de tu país:{' '}
        <Link href="/guias/penca-de-futbol">penca</Link> en Uruguay,{' '}
        <Link href="/guias/polla-futbolera">polla futbolera</Link> en Venezuela y
        Colombia, <Link href="/guias/prode-como-armarlo">prode</Link> en Argentina y{' '}
        <Link href="/guias/porra-de-futbol-oficina">porra</Link> en España.
      </p>
      <p>
        Y si lo que te preocupa es el trabajo semanal (copiar resultados, sumar
        puntos, mantener la tabla y contestar “¿cómo voy?”), eso es exactamente lo
        que resuelve una{' '}
        <Link href="/guias/aplicacion-para-quinielas">
          aplicación para quinielas
        </Link>
        : tú decides las reglas y reparte el bote, el resto va solo.
      </p>
    </GuiaShell>
  );
}
