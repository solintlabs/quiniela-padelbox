import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

/**
 * Página objetivo del término de búsqueda "aplicación para quinielas" (y
 * variantes: app para quinielas, app para hacer una quiniela…). Es la que
 * debe posicionar para esa intención de compra; por eso lleva FAQPage.
 *
 * Es una guía de CRITERIOS, no un folleto: tiene que servir igual a quien
 * acabe eligiendo una hoja de cálculo o otra herramienta. El FAQPage se
 * emite desde GuiaShell con la prop `faq` (antes había un script inline
 * aquí; dos FAQPage en la misma página es un error de marcado).
 */
const SLUG = 'aplicacion-para-quinielas';
const DESCRIPTION =
  'Qué debe tener una aplicación para quinielas y cómo elegirla: cierre automático, resultados sin copiar a mano, recálculo de la clasificación, control de pagos, exportación y privacidad. Incluye cuándo te basta una hoja de cálculo.';

export const metadata: Metadata = {
  title: 'Aplicación para quinielas de fútbol: qué debe tener y cómo elegirla',
  description: DESCRIPTION,
  alternates: { canonical: '/guias/aplicacion-para-quinielas' },
  openGraph: {
    title: 'Aplicación para quinielas de fútbol: qué debe tener y cómo elegirla',
    description:
      'Los criterios que de verdad importan al elegir una app de quinielas, qué pasa cuando falta cada uno, y cuándo no necesitas ninguna.',
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Necesito una aplicación para hacer una quiniela?',
    a: 'No siempre. Con cinco o seis jugadores y un torneo corto —una Eurocopa, una fase final, un par de jornadas— una hoja de cálculo compartida te sobra y la montas en media hora. La app empieza a pagar su coste cuando hay muchos partidos, mucha gente o ambas cosas: ahí el trabajo manual crece más rápido que el grupo.',
  },
  {
    q: '¿Cuál es la mejor aplicación para quinielas con amigos?',
    a: 'La que automatiza justo las dos cosas que arruinan una quiniela: el cierre de pronósticos a la hora del partido y la entrada de resultados. Todo lo demás es secundario. Antes de decidir, prueba la herramienta con un torneo pequeño y comprueba que la clasificación se recalcula bien cuando corriges un marcador.',
  },
  {
    q: '¿Qué pasa si la app no cierra los pronósticos automáticamente?',
    a: 'Que la quiniela depende de que el organizador esté disponible a la hora exacta de cada partido, incluso si son tres a la vez o de madrugada. Un solo cierre tardío basta para que alguien pronostique con el partido empezado y para que el resto deje de confiar en el juego. Es el criterio más importante de todos.',
  },
  {
    q: '¿Puedo llevar una quiniela solo con un grupo de WhatsApp?',
    a: 'Sí, y de hecho muchas funcionan así. El problema no es recoger los pronósticos: es que el historial queda mezclado con la conversación, los mensajes se pueden editar o borrar, y cualquiera que lea el grupo antes de pronosticar ve lo que han puesto los demás. Para grupos pequeños y de mucha confianza es suficiente.',
  },
  {
    q: '¿Qué debo preguntar antes de meter a 30 personas en una herramienta?',
    a: 'Si puedes exportar los pronósticos y la clasificación, qué datos personales pide a cada participante, qué pasa con la quiniela si dejas de pagar, si hay un histórico visible de cada pronóstico y si se puede entrar desde el móvil sin instalar nada. Si alguna respuesta no está clara antes de invitar a la gente, lo estará demasiado tarde.',
  },
  {
    q: '¿Una app de quinielas debe gestionar el dinero del bote?',
    a: 'No es necesario y conviene que no lo haga: mover dinero de apuestas entre participantes cambia por completo el marco legal y fiscal de la herramienta. Lo útil es que lleve un registro de quién ha pagado su inscripción; el cobro en sí se hace entre vosotros como siempre.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Aplicación para quinielas: qué debe tener y cómo elegirla"
      lede="Una quiniela en Excel funciona… hasta la segunda jornada. Esta es una guía de criterios de compra: qué tiene que hacer una herramienta por ti, qué pasa cuando no lo hace, y cuándo no necesitas ninguna."
      slug={SLUG}
      description={DESCRIPTION}
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>Antes de elegir: ¿de verdad necesitas una app?</h2>
      <p>
        Conviene decirlo primero, aunque juegue en contra de cualquiera que venda
        una: <strong>hay quinielas que no necesitan una aplicación</strong>. Si sois
        cinco o seis, el torneo dura dos semanas y todos os conocéis, una hoja de
        cálculo compartida es la respuesta correcta. La montas en media hora, la
        entiende todo el mundo y no tienes que pedirle a nadie que se registre en
        ningún sitio.
      </p>
      <p>
        Lo que decide es la <strong>cantidad de trabajo manual</strong>, y ese
        trabajo crece con dos cosas a la vez: partidos y participantes. Con 6
        personas y 10 partidos son 60 pronósticos en todo el torneo. Con 30 personas
        y un Mundial de 104 partidos, más de 3.000. El segundo caso no es «más
        difícil»: es imposible de llevar a mano sin errores.
      </p>

      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Si tu quiniela es…</th>
              <th>Lo que de verdad te hace falta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>5–8 jugadores, torneo corto (una fase final, 10–20 partidos)</td>
              <td>Hoja de cálculo compartida</td>
            </tr>
            <tr>
              <td>5–8 jugadores, liga larga (una temporada entera)</td>
              <td>Automatizar resultados, aunque el grupo sea pequeño</td>
            </tr>
            <tr>
              <td>10–30 jugadores, cualquier torneo</td>
              <td>Cierre automático + clasificación automática</td>
            </tr>
            <tr>
              <td>Más de 30, club o empresa</td>
              <td>Todo lo anterior + control de pagos e histórico</td>
            </tr>
            <tr>
              <td>Varias quinielas a la vez</td>
              <td>Herramienta con competiciones independientes</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Dónde se rompen las quinielas llevadas a mano</h2>
      <p>
        Las quinielas no se abandonan por falta de interés. Se abandonan por tres
        fallos muy concretos, y vale la pena nombrarlos porque son exactamente los
        que tiene que resolver la herramienta que elijas:
      </p>
      <ul>
        <li>
          <strong>Un pronóstico que llegó tarde.</strong> Alguien manda su apuesta
          con el partido empezado y se le acepta «porque se entiende». A partir de
          ahí, cualquier decisión del organizador parece arbitraria.
        </li>
        <li>
          <strong>Un punto mal sumado.</strong> Se corrige, pero la clasificación ya
          circuló por el grupo. Nadie sabe cuál de las dos tablas es la buena.
        </li>
        <li>
          <strong>El organizador se cansa.</strong> Copiar marcadores, cuadrar quién
          ha pagado y contestar «¿cómo voy?» quince veces es trabajo real y no
          remunerado. Cuando se cae el organizador, se cae la quiniela.
        </li>
      </ul>

      <h2>Los criterios, uno a uno</h2>
      <p>
        Ordenados por importancia real, no por lo bonito que queda en una página de
        producto. Para cada uno: por qué importa y qué pasa cuando falta.
      </p>

      <h3>1. Cierre automático a la hora del partido</h3>
      <p>
        Los pronósticos se bloquean solos cuando empieza cada encuentro, sin que
        nadie tenga que hacer nada. Es el criterio número uno y el que más se pasa
        por alto.
      </p>
      <p>
        <strong>Si falta:</strong> la integridad del juego depende de que una persona
        esté disponible. Tres partidos simultáneos a las 21:00, o uno a las 2 de la
        madrugada en un Mundial al otro lado del mundo, y el cierre no ocurre.
        Comprueba también si puedes mover el margen: hay grupos que prefieren cerrar
        una hora antes para evitar discusiones con las alineaciones.
      </p>

      <h3>2. Pronósticos ocultos hasta el cierre</h3>
      <p>
        Nadie ve lo que han puesto los demás antes de que se cierre el partido. Suena
        obvio, y es justo lo que no puede garantizar un grupo de mensajería ni una
        hoja compartida.
      </p>
      <p>
        <strong>Si falta:</strong> el último en pronosticar juega con ventaja. No hace
        falta mala fe de nadie: basta con que exista la posibilidad para que el resto
        deje de considerarlo justo.
      </p>

      <h3>3. Resultados automáticos frente a meterlos a mano</h3>
      <p>
        Los marcadores entran solos al terminar el partido, desde una fuente de
        datos deportivos. Esta es la diferencia entre dedicarle minutos al crear la
        quiniela y dedicarle un rato cada jornada durante meses.
      </p>
      <p>
        <strong>Si falta:</strong> no es solo tiempo, son errores. Un dígito mal
        copiado altera la clasificación de todos. Y si una herramienta automatiza
        resultados, pregunta lo contrario: <strong>¿puedes corregir un marcador a
        mano cuando la fuente se equivoca o cuando el torneo es local y no está en
        ningún catálogo?</strong> Una app que solo sabe hacerlo automáticamente es
        tan inflexible como una que no lo hace nunca.
      </p>

      <h3>4. Cálculo y recálculo de la clasificación</h3>
      <p>
        Calcular puntos es lo fácil. Lo que separa una herramienta sólida de una
        frágil es el <strong>recálculo</strong>: qué pasa cuando cambias el sistema
        de puntos a mitad de torneo, cuando se corrige un resultado tres días
        después o cuando un partido se aplaza. Si cada corrección obliga a repasar
        la tabla a mano, no has automatizado nada.
      </p>
      <p>
        Mira también si el sistema de puntos es configurable y si entiendes cómo
        puntúa antes de empezar. Las variantes y sus consecuencias están en la{' '}
        <Link href="/guias/sistemas-de-puntos">guía de sistemas de puntos</Link>.
      </p>

      <h3>5. Histórico de pronósticos visible</h3>
      <p>
        Cada jugador debe poder ver qué pronosticó en cada partido, cuántos puntos le
        dio y cuándo lo guardó. No es un detalle estético: es lo que cierra las
        discusiones sin que el organizador tenga que hacer de árbitro.
      </p>
      <p>
        <strong>Si falta:</strong> toda reclamación acaba en la palabra de uno contra
        la del otro. Y el organizador siempre pierde esa discusión, porque es quien
        tenía que haber apuntado bien.
      </p>

      <h3>6. Control de quién ha pagado</h3>
      <p>
        Una lista dentro de la herramienta con quién ha puesto su inscripción y quién
        no. Nada más: un registro visible.
      </p>
      <p>
        <strong>Si falta:</strong> acabas cuadrando pagos en una nota del móvil
        mientras la quiniela va por otro lado. El caso incómodo llega siempre: el que
        va segundo y no pagó.
      </p>
      <div className="gu__note">
        <p>
          <strong>Que lleve el registro no significa que mueva el dinero.</strong> Que
          una herramienta de quinielas entre amigos cobre y reparta el bote la
          convierte en otra cosa, con obligaciones legales y fiscales distintas en
          casi todos los países. El cobro entre vosotros, por los medios de siempre;
          la app, para el registro y el juego.
        </p>
      </div>

      <h3>7. Avisos antes del cierre</h3>
      <p>
        Un recordatorio automático a quien no ha pronosticado todavía, unas horas
        antes del partido. Es la función que más participación salva, porque el
        abandono casi nunca es una decisión: es alguien que se olvidó una jornada,
        se descolgó de la tabla y ya no volvió.
      </p>
      <p>
        <strong>Si falta:</strong> el organizador se convierte en el pesado del
        grupo, persiguiendo a la gente por privado cada semana.
      </p>

      <h3>8. Entrar desde el móvil sin instalar nada</h3>
      <p>
        En cualquier grupo de más de diez personas hay alguien que no va a instalar
        una aplicación para esto, y es una postura razonable. Si la herramienta
        funciona en el navegador del móvil con todas sus funciones, ese jugador
        entra; si exige descarga obligatoria, pierdes gente antes de empezar.
      </p>
      <p>
        Lo ideal es que convivan las dos formas, y que el registro pida lo mínimo:
        si el formulario de entrada es largo, media docena de invitados se queda por
        el camino.
      </p>

      <h3>9. Varios torneos a la vez</h3>
      <p>
        Mucha gente llega buscando una app «para el Mundial» y acaba queriendo una
        liga paralela de LaLiga. Comprueba si puedes tener competiciones
        independientes, con participantes y clasificaciones separadas, o si hay que
        cerrar una para abrir otra: si el plan gratuito permite solo una activa,
        conviene saberlo antes.
      </p>

      <h3>10. Exportar tus datos si te quieres ir</h3>
      <p>
        ¿Puedes sacar los pronósticos y las clasificaciones en un formato que se abra
        en cualquier sitio? Importa poco mientras todo va bien y lo es todo cuando
        quieres cambiar de herramienta, cuando cierra el servicio o cuando quieres
        guardar el palmarés de cinco temporadas.
      </p>

      <h3>11. Qué pasa con tus datos y con los de tus participantes</h3>
      <p>
        Al invitar a 30 personas metes los datos de 30 personas en un servicio que
        has elegido tú. Mira qué pide a cada jugador (si basta el correo, mejor que
        si pide teléfono), si hay una página clara para borrar la cuenta y qué se
        muestra en público en la clasificación: nombre completo, apodo o correo
        enmascarado. Una herramienta que no explica esto en su propia web ya te ha
        contestado.
      </p>

      <h2>Los tres enfoques, con sus ventajas reales</h2>
      <p>
        Las comparativas honestas no tienen un ganador obvio en todas las filas.
        Estas son las ventajas de verdad de cada camino.
      </p>

      <h3>Hoja de cálculo</h3>
      <p>
        <strong>A favor:</strong> es gratis, no obliga a nadie a registrarse y es
        infinitamente flexible. Cualquier regla rara —puntos dobles en semifinales,
        bonus por el goleador, penalización por no pronosticar— es una fórmula.
        Ninguna app te da esa libertad, y los datos son tuyos, en un archivo.
      </p>
      <p>
        <strong>En contra:</strong> no cierra nada a ninguna hora, no oculta los
        pronósticos si la compartes para editar, y una fórmula mal arrastrada falsea
        la tabla sin avisar. El coste real es el tiempo del organizador, invisible
        hasta que se harta.
      </p>

      <h3>Grupo de mensajería a mano</h3>
      <p>
        <strong>A favor:</strong> cero fricción. La gente ya está ahí, no hay que
        aprender nada y el ambiente de la quiniela vive justo donde vive el grupo.
        Para seis amigos y un torneo corto es, de verdad, la mejor opción.
      </p>
      <p>
        <strong>En contra:</strong> los pronósticos se mezclan con cientos de
        mensajes que además se editan y se borran, y todos ven lo que han puesto los
        demás. Escala muy mal: con 30 personas es inmanejable.
      </p>

      <h3>Aplicación dedicada</h3>
      <p>
        <strong>A favor:</strong> cierres a la hora, resultados y puntos sin trabajo
        manual, histórico consultable y el organizador liberado. El valor crece con
        el tamaño del grupo y la duración del torneo.
      </p>
      <p>
        <strong>En contra:</strong> pides a tu gente que entre en un servicio ajeno,
        aceptas las reglas que esa herramienta tenga y tus datos están donde no
        controlas. Si es de pago, es un coste recurrente; si es gratuita, pregunta
        cómo se sostiene —normalmente anuncios o un plan superior— antes de invitar
        a nadie.
      </p>

      <h2>Qué hacen bien y qué no las opciones gratuitas</h2>
      <p>
        Sin exagerar, porque muchas quinielas se llevan perfectamente con una opción
        gratuita. El patrón habitual es que lo gratuito cubre bien el juego y pone el
        límite en otra parte: <strong>un tope de jugadores</strong> (que se nota justo
        cuando la quiniela se pone de moda y se quiere apuntar más gente), <strong>una
        sola competición activa</strong>, <strong>anuncios</strong> en el camino, o
        funciones de organizador —exportar, personalizar la marca, afinar las
        reglas— reservadas al plan de pago.
      </p>
      <p>
        Nada de eso es un engaño: es cómo se paga el servidor. Lo único que debes
        hacer es comprobar <em>dónde</em> está el límite antes de invitar a la gente:
        toparte con él a mitad de torneo, con 20 personas dentro, es un problema muy
        distinto a descubrirlo el primer día.
      </p>

      <h2>Preguntas que hacerle a cualquier herramienta</h2>
      <p>
        Antes de meter a 30 amigos dentro, estas respuestas deberías tenerlas. Sirven
        para cualquier opción, incluida la nuestra:
      </p>
      <ol>
        <li>¿Los pronósticos se cierran solos a la hora del partido, o tengo que cerrarlos yo?</li>
        <li>¿Puedo cambiar el margen de cierre y el sistema de puntos?</li>
        <li>Si corrijo un resultado tres días después, ¿se recalcula todo solo?</li>
        <li>¿Puedo meter un partido o un marcador a mano para un torneo que no esté en el catálogo?</li>
        <li>¿Cada jugador ve su histórico de pronósticos y los puntos de cada uno?</li>
        <li>¿Se puede jugar desde el navegador del móvil, sin instalar nada?</li>
        <li>¿Qué datos pide a cada participante y cómo se borra una cuenta?</li>
        <li>¿Puedo exportar pronósticos y clasificación?</li>
        <li>¿Cuál es exactamente el límite del plan gratuito y qué pasa si lo paso a mitad de torneo?</li>
        <li>¿Qué ocurre con la quiniela si dejo de pagar o si cierro la cuenta?</li>
      </ol>
      <div className="gu__note">
        <p>
          <strong>Haz una prueba corta antes del torneo bueno.</strong> Monta una
          quiniela de dos o tres partidos contigo y un amigo, deja pasar el cierre y
          mira qué pasa: si bloqueó a tiempo, si los puntos salieron solos y si la
          tabla cuadra. Veinte minutos de prueba evitan tres meses de arrepentimiento.
        </p>
      </div>

      <h2>Resumen comparado</h2>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>&nbsp;</th>
              <th>Hoja de cálculo</th>
              <th>Mensajería</th>
              <th>App dedicada</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Resultados automáticos</td>
              <td>No</td>
              <td>No</td>
              <td>Sí (si la herramienta los trae)</td>
            </tr>
            <tr>
              <td>Clasificación al día</td>
              <td>A mano o con fórmulas</td>
              <td>A mano</td>
              <td>Automática</td>
            </tr>
            <tr>
              <td>Cierre a la hora del partido</td>
              <td>No</td>
              <td>No</td>
              <td>Sí</td>
            </tr>
            <tr>
              <td>Reglas raras a medida</td>
              <td>Sin límite</td>
              <td>Sin límite</td>
              <td>Solo lo que permita</td>
            </tr>
            <tr>
              <td>Trabajo del organizador</td>
              <td>Alto y recurrente</td>
              <td>Alto y recurrente</td>
              <td>Concentrado al crearla</td>
            </tr>
            <tr>
              <td>Tus datos</td>
              <td>En tu archivo</td>
              <td>En el chat</td>
              <td>En un servicio ajeno</td>
            </tr>
            <tr>
              <td>Dónde encaja mejor</td>
              <td>Grupos pequeños, torneo corto</td>
              <td>Grupos muy pequeños y de confianza</td>
              <td>Grupos grandes o torneos largos</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Y si al final montas la tuya</h2>
      <p>
        Elijas la herramienta que elijas, la parte que ninguna app hace por ti es la
        organización: cuánto se pone, cómo se reparte, qué pasa con la prórroga y los
        penaltis, y cómo se desempata. Eso se decide antes del primer partido y se
        deja por escrito —está desarrollado en la{' '}
        <Link href="/guias/como-organizar-una-quiniela">
          guía de cómo organizar una quiniela
        </Link>
        .
      </p>
      <p>
        QuinielaBOX es nuestra respuesta a estos criterios: resultados y puntos
        automáticos, cierre antes de cada partido, catálogo de competiciones y
        enlace de invitación, con el bote siempre fuera de la aplicación. Es gratis
        para empezar y puedes verla funcionando sin registrarte en la{' '}
        <Link href="/demo">demo jugable</Link>. Si después de leer esto decides que
        te basta una hoja de cálculo, también has acertado.
      </p>

      <h2>Preguntas frecuentes</h2>
      {FAQ.map((item) => (
        <div key={item.q}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}
    </GuiaShell>
  );
}
