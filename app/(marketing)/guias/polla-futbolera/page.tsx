import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo de “polla futbolera” / “polla mundialista” — como se llama
 * la quiniela en Venezuela y Colombia. Sinónimo regional con mucha búsqueda y
 * poca competencia: cada uno es una puerta de entrada distinta al producto.
 */
const SLUG = 'polla-futbolera';
const DESCRIPTION =
  'Cómo armar una polla futbolera con tu grupo: reglas, puntos, desempates, partidos aplazados y cómo cobrar y repartir cuando el grupo está en varios países.';

export const metadata: Metadata = {
  title: 'Polla futbolera: cómo armarla con tu grupo (guía + app gratis)',
  description: DESCRIPTION,
  keywords: [
    'polla futbolera', 'polla mundialista', 'como hacer una polla futbolera',
    'app para polla futbolera', 'polla de futbol', 'armar polla futbolera',
  ],
  alternates: { canonical: `/guias/${SLUG}` },
  openGraph: {
    title: 'Polla futbolera: cómo armarla con tu grupo',
    description: DESCRIPTION,
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Qué es una polla futbolera?',
    a: 'Es un juego de pronósticos entre amigos, compañeros de trabajo o socios de un club: cada participante predice los marcadores de los partidos y suma puntos según acierte. Gana quien más puntos acumula. En otros países se llama quiniela, prode, penca o porra.',
  },
  {
    q: '¿Cómo se arma una polla futbolera paso a paso?',
    a: 'Define quién juega y cuánto aporta cada uno, fija las reglas y los puntos antes del primer partido, cobra el bote por adelantado, recoge los pronósticos antes de que empiece cada juego y lleva la tabla actualizada. Con una app como QuinielaBOX los resultados, los puntos y la tabla se actualizan solos.',
  },
  {
    q: '¿Cuánto se cobra por participar en una polla?',
    a: 'Lo que tu grupo pague sin pensarlo. Es preferible una cuota baja con mucha gente que una alta con pocos: el bote termina siendo parecido y hay más ambiente. Lo importante es cobrar antes del primer partido.',
  },
  {
    q: '¿Cómo se cobra y se reparte si los participantes están en varios países?',
    a: 'Fija una sola moneda de referencia para la cuota y para los premios, y deja escrito que cada uno aporta su equivalente el día que paga. Deja dicho también quién asume la comisión de enviar dinero de un país a otro. Lo que no funciona es formar el bote en varias monedas sin referencia y repartirlo meses después.',
  },
  {
    q: '¿Qué pasa si un partido se aplaza o se suspende?',
    a: 'Si se reprograma dentro de la misma fase del torneo, lo normal es mantener los pronósticos tal cual. Si se juega mucho después, conviene reabrirlos, porque entre tanto cambió el contexto. Y si no se juega nunca, se anula para todos y nadie suma. Escribe cuál de las tres aplica antes de que pase.',
  },
  {
    q: '¿Hay una app gratis para llevar la polla?',
    a: 'Sí. QuinielaBOX es gratis para grupos de hasta 15 jugadores: trae los resultados automáticamente, calcula los puntos y mantiene la tabla en vivo. El dinero del bote lo maneja el organizador por fuera, la app no toca pagos.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Polla futbolera: cómo armarla con tu grupo"
      lede="Armar la polla es fácil. Que llegue viva hasta la última fecha, sin discusiones y sin que el organizador termine harto de un Excel, es otra cosa."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Qué es una polla futbolera</h2>
      <p>
        Una <strong>polla futbolera</strong> es un juego de pronósticos: cada
        participante predice los marcadores de los partidos y suma puntos según
        lo que acierte. Al final, quien más puntos tiene se lleva el bote.
      </p>
      <p>
        Es lo mismo que en otros países llaman <strong>quiniela</strong> (México,
        España), <strong>prode</strong> (Argentina), <strong>penca</strong>{' '}
        (Uruguay) o <strong>porra</strong> (España). Cambia el nombre, no el
        juego.
      </p>
      <p>
        En Venezuela y Colombia la polla casi siempre nace en dos sitios: la
        oficina y la familia. Conviene saber cuál estás armando antes de
        escribir la primera regla.
      </p>
      <ul>
        <li>
          <strong>La polla de oficina</strong> es grande (20, 40, 80 personas),
          la gente se conoce poco y buena parte no ve fútbol. Necesita reglas
          simples, cuota baja y un sitio público donde ver la tabla.
        </li>
        <li>
          <strong>La polla de familia o del grupo de pana</strong> es pequeña
          (8 a 15) y lo más probable es que la mitad viva fuera del país.
          Aguanta reglas más finas, pero el problema se traslada al dinero:
          cobrar y repartir entre gente que está en tres países distintos.
        </li>
      </ul>

      <h2>Elige el torneo antes de elegir las reglas</h2>
      <p>
        El torneo manda: uno que se juega casi a diario y otro con parones de
        meses no se organizan igual, aunque los puntos sean los mismos.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Torneo</th>
              <th>Ritmo</th>
              <th>Lo que se complica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Liga BetPlay (Apertura y Clausura)</td>
              <td>Fecha cada semana, con cuadrangulares y final al cierre</td>
              <td>Sostener el interés tantas semanas, y los cambios de horario sobre la marcha</td>
            </tr>
            <tr>
              <td>Eliminatorias de Conmebol</td>
              <td>Fechas dobles separadas por meses</td>
              <td>El parón enfría el grupo: hay que reactivarlo cada vez</td>
            </tr>
            <tr>
              <td>Copa América</td>
              <td>Casi a diario durante unas semanas</td>
              <td>Los alargues y penales de la fase final: la regla de los 90 minutos tiene que estar clarísima</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Si es tu primera polla, empieza por un torneo corto: en unas
        eliminatorias o en una Copa América el grupo no tiene tiempo de
        aburrirse y tú no tienes tiempo de arrepentirte de una regla mal puesta.
        Para una liga completa conviene armarla con más cuidado, y ahí ayuda la{' '}
        <Link href="/guias/como-organizar-una-quiniela">guía general de cómo organizar una quiniela</Link>.
      </p>

      <h2>1. Define el grupo y la cuota</h2>
      <p>
        Dos números antes que nada: cuánta gente juega y cuánto pone cada uno.
        Una polla entre amigos funciona con 8–15 personas; la de un club o una
        empresa, con 30–100.
      </p>
      <div className="gu__note">
        <p>
          <strong>Consejo:</strong> pon una cuota que tu grupo pague sin pensarlo.
          Si duele, la gente lo piensa y no entra. Con cuota baja y mucha gente el
          bote sale igual de grande y hay más ambiente.
        </p>
      </div>
      <p>
        Dos detalles que no suelen preverse. Uno:{' '}
        <strong>el grupo crece solo</strong>. Si lo anuncias en el chat de la
        oficina, el mensaje se reenvía y aparecen primos y cuñados. Eso es
        bueno, pero pon un tope de participantes y una fecha de cierre de
        inscripciones. Dos: la <strong>moneda</strong>. Si parte del grupo está
        fuera del país, fija la cuota en una sola moneda de referencia y que
        cada uno pague su equivalente el día que paga; si la fijas en bolívares
        o en pesos y la gente paga en semanas distintas, el bote no cuadra.
      </p>

      <h2>2. Escribe las reglas antes del primer partido</h2>
      <p>
        Casi todas las peleas de una polla vienen de reglas que nadie escribió.
        Deja claro desde el principio:
      </p>
      <ul>
        <li>
          <strong>Cuánto vale cada acierto.</strong> Lo estándar: 3 puntos por
          marcador exacto, 1 por acertar el ganador, 0 si fallas. Más opciones en
          la <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
        </li>
        <li>
          <strong>Hasta cuándo se puede pronosticar.</strong> Lo normal es cerrar
          al pitazo inicial de cada partido, no al inicio de la fecha. Dilo con
          esas palabras: si un partido de la fecha se juega el viernes y otro el
          domingo, alguien va a asumir que la fecha entera cerró el viernes y va
          a reclamar.
        </li>
        <li>
          <strong>Qué marcador cuenta</strong> si hay alargue o penales: casi
          siempre el de los 90 minutos. Un 1-1 que se va a penales se puntúa
          como 1-1, aunque el tablero diga 4-2. Parece obvio hasta la primera
          semifinal.
        </li>
        <li>
          <strong>Cómo se desempata</strong> si dos terminan con los mismos
          puntos.
        </li>
        <li>
          <strong>Cómo se reparte el bote.</strong>
        </li>
        <li>
          <strong>Quién decide</strong> cuando pasa algo que las reglas no
          cubren. Suena autoritario darle la última palabra al organizador, pero
          la alternativa es un juicio de tres días en el chat del grupo.
        </li>
      </ul>

      <h2>El reglamento de desempates</h2>
      <p>
        En una polla de 40 personas con 3/1/0, los empates en lo alto de la tabla
        no son raros: son lo esperable. Un orden de criterios que funciona:
      </p>
      <ol>
        <li>Quien tenga más marcadores exactos.</li>
        <li>Quien tenga más ganadores acertados.</li>
        <li>
          Quien acertó el campeón del torneo, si pusiste pronóstico de campeón.
        </li>
        <li>
          Si siguen iguales, el premio se divide en partes iguales. No es una
          derrota: es la salida más limpia.
        </li>
      </ol>
      <div className="gu__note">
        <p>
          <strong>Importante:</strong> no importa tanto qué criterio eliges como
          que esté escrito antes de empezar. Un desempate decidido cuando ya sabes
          quiénes están empatados siempre parece hecho a la medida de alguien, y
          con razón.
        </p>
      </div>
      <p>
        Un <strong>pronóstico de campeón</strong> que valga bastantes puntos (25,
        por ejemplo) y que se congele al empezar el torneo hace dos cosas a la
        vez: reduce los empates y mantiene la tabla abierta hasta la última
        fecha.
      </p>

      <h2>Partidos suspendidos, aplazados o cambiados de horario</h2>
      <p>
        Pasa más de lo que uno espera: lluvia, problemas de estadio, un cambio de
        calendario. Hay tres salidas y conviene elegir una antes de necesitarla:
      </p>
      <ul>
        <li>
          <strong>Se anula para todos</strong> y nadie suma. Simple, aunque el
          que tenía ese marcador clavado se va a quejar.
        </li>
        <li>
          <strong>Se mantiene el pronóstico</strong> para la nueva fecha. Es lo
          razonable cuando el partido se reprograma pocos días o semanas después.
        </li>
        <li>
          <strong>Se reabren los pronósticos</strong> si se juega mucho más
          tarde. Un juego recuperado dos meses después se juega en otro contexto
          —lesiones distintas, equipos ya clasificados—, y mantener el pronóstico
          viejo premia la suerte, no el criterio.
        </li>
      </ul>
      <p>
        Regla práctica que cubre casi todo: si se reprograma dentro de la misma
        fase, se mantiene el pronóstico; si se juega después de que esa fase
        terminó, se reabre; si no se juega nunca, se anula. Un cambio de horario
        no cambia nada: el cierre sigue siendo el pitazo inicial.
      </p>

      <h2>El que se suma tarde</h2>
      <p>
        Siempre hay alguien que se entera en la tercera fecha. Déjalo entrar
        —más gente es más bote y más ambiente—, pero no a una tabla que ya lleva
        puntos corriendo. Las tres formas que se usan:
      </p>
      <ul>
        <li>
          <strong>Cuota completa y 0 puntos</strong> en las fechas que se perdió.
          Lo más limpio y lo más común. Dile de frente que empieza en
          desventaja, para que no lo descubra en la tabla.
        </li>
        <li>
          <strong>Cuota prorrateada y 0 puntos.</strong> Más justo con su
          bolsillo, menos con el bote; sirve en grupos pequeños y de confianza.
        </li>
        <li>
          <strong>Solo al premio por fecha</strong>, fuera de la general. Es la
          mejor opción en torneos cortos, donde perderse dos fechas ya es
          irrecuperable.
        </li>
      </ul>
      <p>
        Y pon un límite: pasada la mitad del torneo, no entra nadie más a la
        general. Si no, terminas con gente apuntada que ya no puede ganar y que
        deja de jugar a la semana.
      </p>

      <h2>3. Cobra el bote antes de empezar</h2>
      <p>
        Quien paga después de ver cómo va la tabla, no paga. Cobra todo antes del
        primer partido, deja los datos de pago escritos (transferencia, pago
        móvil, Zelle, Nequi, efectivo… lo que uses en tu país) y lleva una lista
        visible de quién ya puso.
      </p>

      <h3>Cómo llevar el registro de quién pagó sin discusiones</h3>
      <p>
        Esto desgasta al organizador más que los puntos. Tres cosas que evitan
        casi todas las discusiones:
      </p>
      <ul>
        <li>
          <strong>Una lista pública</strong> con cada participante y si pagó o
          no, fijada en el chat del grupo o en la app que uses. Lo que no puede
          es vivir en tu cabeza ni en las notas de tu teléfono.
        </li>
        <li>
          <strong>Anota fecha, monto, método y moneda</strong> de cada pago.
          &ldquo;Juan pagó&rdquo; no te sirve en diciembre, cuando Juan dice que
          pagó dos veces.
        </li>
        <li>
          <strong>Guarda los comprobantes aparte.</strong> Con uno pagando por
          Zelle, otro por pago móvil, otro por Nequi y otro en efectivo, las
          capturas son tu única defensa. Pídeselas al que paga.
        </li>
      </ul>
      <div className="gu__note">
        <p>
          <strong>El dinero va siempre por fuera de cualquier aplicación.</strong>{' '}
          Lo recoge y lo reparte una persona, como siempre se ha hecho. La app
          lleva los puntos y la tabla; el bote es cosa del grupo.
        </p>
      </div>

      <h2>Cuando el grupo está repartido entre varios países</h2>
      <p>
        Es lo normal en una polla venezolana o colombiana: parte del grupo en el
        país y el resto en Panamá, España, Estados Unidos o Chile. Tres
        problemas, y los tres se resuelven con una frase escrita a tiempo.
      </p>
      <p>
        <strong>La moneda.</strong> Una sola moneda de referencia para el bote y
        para los premios, y cada uno aporta su equivalente el día que paga. Un
        bote formado en tres monedas, en semanas distintas y sin referencia no se
        puede repartir bien cuatro meses después: solo se puede discutir.
      </p>
      <p>
        <strong>Las comisiones.</strong> Mandar dinero de un país a otro cuesta
        algo. Dilo antes de cobrar: lo habitual es que cada uno asuma el costo de
        enviar su cuota, y que el premio se entregue por el medio más barato para
        el ganador, no para el organizador. Si nadie lo dice, la comisión se la
        come el bote y el ganador recibe menos de lo anunciado.
      </p>
      <p>
        <strong>Los horarios.</strong> Un partido a las 3 de la tarde en Bogotá
        es a las 9 de la noche en Madrid. Si el cierre es el pitazo inicial no
        hay problema: es el mismo instante para todos. El lío aparece cuando el
        cierre es una hora del día —&ldquo;me los mandan antes del
        mediodía&rdquo;—, porque el mediodía de quién. Cierra siempre por el
        inicio del partido, nunca por una hora.
      </p>

      <h2>4. Reparte para que nadie se desenganche</h2>
      <p>
        Si solo premias al primero, a mitad de torneo la mitad del grupo deja de
        jugar porque ya no puede ganar. Un reparto que funciona:
      </p>
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
        Y guarda algo para <strong>premios por fecha</strong> (el mejor de la
        jornada): así todos tienen algo que ganar cada semana.
      </p>
      <p>
        En una polla de oficina de 40 personas o más, estira el reparto a cuatro
        o cinco puestos: quedar cuarto después de cuatro meses es un logro. Si el
        grupo es de ocho, al contrario: reparte entre dos, porque un tercer
        premio sería calderilla.
      </p>

      <h2>Mantener viva la polla en la recta final</h2>
      <p>
        El problema real de toda polla larga: llega un punto en que media tabla
        ya no puede ganar y deja de meter pronósticos. Lo que funciona:
      </p>
      <ul>
        <li>
          <strong>Mini-tabla de la segunda mitad.</strong> Una clasificación
          aparte que solo cuenta de una fecha en adelante, con su propio premio.
          Resucita al grupo cuando el líder ya saca mucha ventaja.
        </li>
        <li>
          <strong>Manda la tabla al chat después de cada fecha.</strong> Suena
          tonto y es lo que más engancha: si nadie ve la tabla, nadie juega.
        </li>
        <li>
          <strong>No castigues al que falla.</strong> Los puntos negativos
          espantan a la gente que entró por el ambiente y no por el fútbol, que
          es justo la que sostiene la polla de oficina.
        </li>
      </ul>

      <h2>5. No la lleves a mano</h2>
      <p>
        Aquí es donde mueren casi todas las pollas: el organizador termina
        copiando marcadores en una hoja, sumando puntos a mano y respondiendo
        “¿cómo voy?” por WhatsApp veinte veces. A la tercera fecha lo deja.
      </p>
      <p>
        Y con la hoja de cálculo pasan siempre tres cosas. Un error de dedo en un
        marcador que nadie detecta hasta tres fechas después y obliga a
        recalcular todo. El organizador también juega, así que ve los pronósticos
        de los demás antes del partido: no hace falta que haga nada raro, basta
        con que alguien lo insinúe. Y la tabla solo existe cuando el organizador
        tiene tiempo de actualizarla, que es cuando el grupo ya preguntó tres
        veces.
      </p>
      <p>
        Con una <Link href="/guias/aplicacion-para-quinielas">aplicación para quinielas</Link>{' '}
        los resultados entran solos, los puntos se calculan solos, los
        pronósticos quedan ocultos hasta el cierre y la tabla está siempre
        actualizada. Tú solo repartes el bote al final.
      </p>

      <h2>Errores típicos del organizador</h2>
      <ul>
        <li>Empezar sin reglas escritas.</li>
        <li>Aceptar pronósticos después de que empiece el partido, aunque sea una sola vez: ya es jurisprudencia.</li>
        <li>Cobrar el bote a mitad del torneo, o no anotar quién pagó y cuánto.</li>
        <li>Dejar el desempate sin escribir y decidirlo cuando ya hay empate.</li>
        <li>No fijar moneda de referencia con el grupo repartido en varios países.</li>
        <li>Premiar solo al primer lugar en un torneo de meses.</li>
        <li>Dejar de publicar la tabla justo en la recta final.</li>
        <li>Llevar la tabla en Excel o por chat.</li>
      </ul>
    </GuiaShell>
  );
}
