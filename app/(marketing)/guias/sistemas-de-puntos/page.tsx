import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import type { FaqItem } from '@/lib/seo';
import '../guias.css';

export const metadata: Metadata = {
  title: 'Sistemas de puntos para una quiniela: cuál elegir',
  description:
    'Sistemas de puntuación para quinielas de fútbol: 3/1/0, diferencia de goles, bonus por empate, multiplicadores por ronda y pick de campeón. Qué incentivo crea cada uno, cómo puntuar prórroga y penales, y cómo resolver los desempates.',
  alternates: { canonical: '/guias/sistemas-de-puntos' },
  openGraph: {
    title: 'Sistemas de puntos para una quiniela: cuál elegir',
    description:
      'El 3/1/0 clásico y sus variantes. Qué premia cada sistema y cómo evitar que el torneo se decida demasiado pronto.',
    type: 'article',
  },
};

const FAQ: FaqItem[] = [
  {
    q: '¿Cuántos puntos vale el marcador exacto en una quiniela?',
    a: 'El estándar es 3 puntos por el marcador exacto y 1 por acertar solo el ganador o el empate. Lo importante no es el número, sino la proporción: el exacto debe pagar bastante más que el signo, porque si no nadie se arriesga a poner un resultado concreto. Y nunca puede pagar menos que un acierto parcial.',
  },
  {
    q: '¿Cómo se puntúan la prórroga y los penales?',
    a: 'Lo habitual es puntuar el resultado al final de los 90 minutos, más el añadido del árbitro, e ignorar la prórroga y los penales. Así un 1-1 que se decide en la tanda sigue siendo un empate para la quiniela. Conviene dejarlo escrito antes del primer partido de eliminatorias, porque es la discusión más repetida.',
  },
  {
    q: '¿Qué pasa si un jugador no pronostica un partido?',
    a: 'Lo normal es que ese partido valga cero: no se castiga, simplemente se pierde la oportunidad de sumar. Penalizar con puntos negativos a quien se despista una jornada suele conseguir que abandone. Si quieres evitar olvidos, lo que funciona es un recordatorio antes del cierre, no una multa.',
  },
  {
    q: '¿Cómo se desempata una quiniela que acaba igualada?',
    a: 'El criterio más justo es el número de marcadores exactos acertados, porque mide quién arriesgó y acertó en lugar de quién jugó a lo seguro. Si sigue el empate, se usan los aciertos en las rondas finales y, como último recurso, los puntos hechos en el último partido del torneo. Elige el orden antes de empezar y escríbelo.',
  },
  {
    q: '¿Se puede cambiar el sistema de puntos a mitad del torneo?',
    a: 'Se puede, pero solo si recalculas toda la clasificación desde el primer partido con las reglas nuevas. Aplicar los puntos nuevos solo a lo que queda premia a la gente por el orden en que acertó, algo que nadie podía prever. Si no puedes recalcular, termina el torneo con el sistema que anunciaste.',
  },
  {
    q: '¿Qué sistema conviene para un torneo con grupos y eliminatorias?',
    a: 'El 3/1/0 como base y multiplicadores crecientes por ronda: los partidos de grupos valen x1 y los de semifinales y final valen el doble o el triple. Así nadie se descuelga de forma definitiva en la primera semana y el torneo se decide cuando se decide el torneo de verdad.',
  },
];

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Sistemas de puntos: cuál elegir para tu quiniela"
      lede="El sistema de puntos decide qué tipo de juego tendrás: uno conservador, uno arriesgado, o uno que se decide en el último partido."
      slug="sistemas-de-puntos"
      description="Comparativa de sistemas de puntuación para quinielas: 3/1/0, diferencia de goles, bonus por empate y pick de campeón."
      faq={FAQ}
    >
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <p>
        Un sistema de puntos no es una tabla de precios: es un conjunto de
        incentivos. Cuando decides cuánto vale cada acierto, decides cómo va a
        rellenar sus pronósticos la gente. Si el exacto paga poco, todos pondrán
        el resultado más probable y la clasificación será un pelotón donde nadie
        se mueve. Si paga demasiado, ganará quien tuvo suerte una tarde. Y si
        todos los partidos valen lo mismo, el torneo puede estar decidido antes
        de las eliminatorias.
      </p>
      <p>
        Aquí va qué premia cada sistema, qué estrategia induce y en qué grupo
        funciona mal. Si aún no tienes la quiniela montada, empieza por{' '}
        <Link href="/guias/como-organizar-una-quiniela">
          cómo organizar una quiniela
        </Link>{' '}
        y vuelve cuando toque decidir el puntaje.
      </p>

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
        <strong>Qué premia.</strong> Acertar el signo de forma constante y, de
        vez en cuando, clavar un marcador. La proporción 3 a 1 es lo que hace
        funcionar el sistema: tres aciertos de signo equivalen a un exacto, así
        que arriesgar un resultado concreto tiene sentido aunque falles a menudo.
      </p>
      <p>
        <strong>Qué estrategia induce.</strong> Marcadores cortos y frecuentes:
        1-0 o 2-1 en casi todos los partidos entre rivales parejos, los
        resultados que más se repiten. Así se cubre el signo y queda una opción
        real de clavar el exacto sin perder nada. La clasificación sale
        comprimida arriba y se mueve a saltos, porque las diferencias las abren
        los exactos y los exactos llegan en rachas.
      </p>
      <p>
        <strong>Dónde funciona mal.</strong> En grupos grandes de nivel
        parecido: acaban empatados a puntos cinco o seis y todo se resuelve en
        el desempate. Si pasas de 30 jugadores, añádele una variante.
      </p>

      <h2>Variante: puntos por diferencia de goles</h2>
      <p>
        Suma puntos si aciertas por cuántos goles gana un equipo, aunque falles
        el marcador. Pones 2-0 y acaba 3-1: fallaste el resultado, pero
        acertaste que ganaba por dos.
      </p>
      <p>
        La forma limpia de montarlo es acumulativa, no por categorías
        excluyentes: 1 punto por el signo, 1 más si además aciertas la
        diferencia y 2 más si clavas el marcador. Así el exacto paga 4, la
        diferencia 2 y el signo 1, sin que un acierto parcial pueda superar al
        completo.
      </p>
      <p>
        <strong>Qué premia.</strong> Tener una opinión sobre el partido. Decir
        &quot;este gana de calle&quot; y poner 3-0 ya tiene recompensa aunque
        acabe 4-1. Y castiga el 1-0 universal, que solo acierta la diferencia
        cuando el partido acaba por un gol.
      </p>
      <p>
        <strong>Qué estrategia induce.</strong> Distinguir favoritos de partidos
        parejos en lugar de aplicar el mismo molde: 1-0 donde esperas algo
        cerrado, 3-0 donde esperas goleada. La clasificación sale más apretada,
        porque la categoría intermedia reparte algo a mucha gente casi cada
        jornada: cuesta descolgarse y cuesta escaparse.
      </p>
      <p>
        <strong>Dónde funciona mal.</strong> En grupos de ocasión, con gente que
        rellena en un minuto: una regla más que explicar y una fuente de
        reclamaciones (&quot;¿y mi 2-0 contra el 3-1 cuánto vale?&quot;). Si
        media quiniela no sigue el fútbol, no lo uses.
      </p>

      <h2>Variante: bonus por acertar un empate</h2>
      <p>
        El empate es la opción que casi nadie marca: hay dos ganadores posibles
        y un empate, pero el empate no tiene un favorito detrás, así que la
        intuición empuja a elegir un lado. Un punto extra corrige ese sesgo.
      </p>
      <p>
        <strong>Qué premia.</strong> Atreverse con los partidos ilegibles. Con
        el bonus, acertar un 2-2 poniendo 1-1 paga 2 puntos en vez de 1, y
        clavar el 2-2 paga 4 en vez de 3. La estrategia que induce es repartir
        algunos empates en vez de ninguno. Cuidado con pasarse: si el bonus vale
        2 o 3 puntos, lo óptimo pasa a ser marcar empate en todo partido dudoso,
        que es otro molde automático. Un punto basta.
      </p>
      <p>
        <strong>Dónde funciona mal.</strong> En eliminatorias, donde media
        ronda no admite empate en la práctica y el bonus casi no aparece. Es una
        variante de liga: encaja en una{' '}
        <Link href="/guias/quiniela-de-laliga">quiniela de LaLiga</Link>, con 38
        jornadas y muchos empates reales.
      </p>

      <h2>El mismo partido bajo cada sistema</h2>
      <p>
        Supongamos que el partido acaba <strong>3-1</strong> (gana el local por
        dos goles) y comparamos cinco pronósticos bajo tres sistemas: el 3/1/0
        clásico, el acumulativo con diferencia (1 signo / +1 diferencia / +2
        exacto) y el 3/1/0 con bonus de empate.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Pronóstico</th>
              <th>3/1/0</th>
              <th>Con diferencia</th>
              <th>Con bonus empate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>3-1 (exacto)</td>
              <td>3</td>
              <td>4</td>
              <td>3</td>
            </tr>
            <tr>
              <td>2-0 (signo y diferencia)</td>
              <td>1</td>
              <td>2</td>
              <td>1</td>
            </tr>
            <tr>
              <td>4-1 (solo signo)</td>
              <td>1</td>
              <td>1</td>
              <td>1</td>
            </tr>
            <tr>
              <td>1-1 (empate, falla el signo)</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>0-2 (gana el otro)</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        El 4-1 y el 2-0 valen lo mismo en el clásico y cosas distintas en el de
        diferencia: quien dijo &quot;gana por dos&quot; cobra el doble que quien
        dijo &quot;gana por tres&quot;. El bonus de empate no cambia nada aquí
        porque el partido no acabó empatado.
      </p>

      <h2>La regla que no se puede romper: el exacto manda</h2>
      <p>
        <strong>
          Acertar el marcador exacto no puede pagar menos que acertar solo el
          ganador.
        </strong>{' '}
        Parece obvio, y es el error más fácil de cometer, porque no se cuela al
        escribir la regla: se cuela al sumar parciales.
      </p>
      <p>
        El caso típico: marcador exacto, 3 puntos fijos; signo, 1 punto;
        diferencia de goles acertada, 3 puntos más, &quot;porque tiene
        mérito&quot;. Suena razonable hasta que llega un partido 3-1:
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Pronóstico</th>
              <th>Cómo suma</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2-0</td>
              <td>signo 1 + diferencia 3</td>
              <td>4</td>
            </tr>
            <tr>
              <td>3-1 (exacto)</td>
              <td>tarifa fija del exacto</td>
              <td>3</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Quien falló el resultado gana un punto más que quien lo clavó. Y en
        cuanto alguien lo detecta, la estrategia óptima pasa a ser no intentar
        nunca el exacto: el sistema se autodestruye.
      </p>
      <div className="gu__note">
        <p>
          <strong>Cómo evitarlo:</strong> trata el exacto como una suma, no como
          una tarifa plana. Si clavas el marcador has acertado también el signo y
          la diferencia, así que cobras esos puntos <em>más</em> el extra del
          exacto. Comprueba que el exacto supere siempre la suma máxima de todos
          los parciales posibles.
        </p>
      </div>

      <h2>El líder que se escapa: multiplicadores por ronda</h2>
      <p>
        El segundo problema de diseño no es la injusticia, es el aburrimiento.
        Con todos los partidos valiendo igual, la fase de grupos reparte la mayor
        parte de los puntos solo porque tiene la mayor parte de los partidos.
        Alguien hace una primera semana enorme, saca quince puntos y, cuando
        llegan las eliminatorias, no queda bote suficiente para alcanzarlo. La
        solución estándar son los{' '}
        <strong>puntos crecientes por ronda</strong>: multiplicar la puntuación
        base según lo avanzada que esté la eliminatoria.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Ronda</th>
              <th>Multiplicador</th>
              <th>Exacto / signo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fase de grupos</td>
              <td>x1</td>
              <td>3 / 1</td>
            </tr>
            <tr>
              <td>Octavos</td>
              <td>x2</td>
              <td>6 / 2</td>
            </tr>
            <tr>
              <td>Cuartos</td>
              <td>x2</td>
              <td>6 / 2</td>
            </tr>
            <tr>
              <td>Semifinales</td>
              <td>x3</td>
              <td>9 / 3</td>
            </tr>
            <tr>
              <td>Final</td>
              <td>x3</td>
              <td>9 / 3</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Con esta escala, clavar la final vale 9 puntos en vez de 3: tanto como
        tres exactos de la fase de grupos. Quien llegue a semifinales a diez
        puntos del líder sigue teniendo una opción real, y eso es lo que le
        mantiene jugando. Usa multiplicadores enteros: los x1,5 obligan a
        explicar los medios puntos y llenan la tabla de decimales.
      </p>
      <p>
        <strong>Efecto secundario que hay que aceptar:</strong> triplicar la
        final significa que un acierto afortunado en un solo partido puede
        decidir el torneo. Si tu grupo valora más la regularidad, no pases de
        x2.
      </p>

      <h2>El pick de campeón (el que cambia el final)</h2>
      <p>
        Cada jugador elige al principio quién ganará el torneo, y ese pick se
        congela cuando arranca. Si acierta, se lleva un bonus grande (por
        ejemplo <strong>+25 puntos</strong>).
      </p>
      <p>
        <strong>Qué premia.</strong> Comprometerse con una opinión larga, un mes
        antes y sin poder corregirla: es el único punto del sistema donde no
        puedes ir ajustando partido a partido. En grupos pequeños conviene
        diferenciarse: si doce de quince eligen al mismo favorito, acertar con
        él no da ninguna ventaja relativa, mientras que acertar con una selección
        que nadie eligió te pone arriba directamente.
      </p>
      <div className="gu__note">
        <p>
          <strong>Por qué merece la pena:</strong> mantiene viva la quiniela
          hasta el último día. Aunque alguien vaya 15 puntos por delante, el
          bonus del campeón puede darle la vuelta a todo en la final.
        </p>
      </div>
      <p>
        <strong>Cómo calibrarlo.</strong> Una referencia razonable es que valga
        entre el 10% y el 20% de lo que un buen jugador acumula en todo el
        torneo. Demasiado poco y es un adorno; demasiado y el resto del torneo
        se vuelve irrelevante. El{' '}
        <Link href="/guias/quiniela-mundial-2026">Mundial 2026</Link> es el caso
        natural: grupos largos, eliminatoria corta y un campeón que se conoce el
        último día.
      </p>

      <h2>Prórroga y penales: déjalo escrito</h2>
      <p>
        Es la discusión más repetida, y aparece el primer día de eliminatorias
        con el mismo guion: el partido acaba 1-1 y se decide en los penales;
        quien puso 1-1 reclama su acierto y quien puso 2-1 para el que pasó
        reclama el suyo.
      </p>
      <p>
        <strong>Lo habitual, y lo recomendable:</strong> se puntúa el resultado
        al final de los <strong>90 minutos más el añadido del árbitro</strong>.
        Prórroga y penales no cuentan: un 1-1 resuelto en la tanda es un empate
        para la quiniela.
      </p>
      <p>
        Hay dos razones. Práctica: es el resultado que publican las fuentes de
        datos como marcador del partido, así que no hay que interpretar nada. Y
        de diseño: pedir el resultado tras la prórroga convierte el pronóstico
        en lotería, porque nadie predice una prórroga.
      </p>
      <div className="gu__note">
        <p>
          <strong>Escríbelo antes del primer partido</strong>, con esas palabras.
          No porque sea complicado, sino porque una regla anunciada después de
          que el partido haya ocurrido siempre parece hecha a medida de alguien,
          aunque no lo sea.
        </p>
      </div>

      <h2>Partidos sin pronóstico: cero, no castigo</h2>
      <p>
        Alguien se va a olvidar de una jornada. Tienes dos opciones: esos
        partidos valen cero, o valen cero y además restan.
      </p>
      <p>
        <strong>Cero es casi siempre la respuesta.</strong> No pronosticar ya es
        el castigo: pierdes todo lo que esos partidos reparten, y una jornada
        completa basta para descolgarte de la cabeza. Sumarle puntos negativos
        convierte un despiste en sentencia y lo que suele pasar es que esa
        persona abandona, que es peor para el grupo que un jugador que va
        último.
      </p>
      <p>
        Dos matices: para reducir olvidos el remedio es un aviso antes del
        cierre, no una multa; y si hay dinero en juego, deja claro desde el
        principio que los partidos sin pronóstico no se rellenan después.
      </p>

      <h2>Desempates en la clasificación final</h2>
      <p>
        Dos personas acaban con los mismos puntos y hay bote que repartir. Hay
        que tenerlo decidido antes; discutirlo después es imposible. En el orden
        que recomendamos:
      </p>
      <ol>
        <li>
          <strong>Más marcadores exactos.</strong> Mide lo que el sistema quería
          premiar: entre dos jugadores igualados, el que clavó más resultados
          llegó ahí jugando, no esquivando.
        </li>
        <li>
          <strong>Más aciertos en las rondas finales.</strong> Premia a quien
          acertó cuando el torneo era difícil de leer, no a quien hizo caja con
          los partidos de grupos cantados.
        </li>
        <li>
          <strong>Puntos en el último partido del torneo.</strong> Limpio y
          narrativo: se resuelve delante de todos, el mismo día.
        </li>
        <li>
          <strong>Reparto a partes iguales.</strong> Si el bote se divide, es la
          salida más pacífica.
        </li>
      </ol>
      <p>
        Lo que no recomendamos: el sorteo, que anula un torneo entero en un
        segundo, y el orden de inscripción, que premia algo ajeno al juego.
      </p>

      <h2>Errores clásicos al diseñar el sistema</h2>
      <ul>
        <li>
          <strong>Que un parcial pague más que el exacto.</strong> Comprueba la
          aritmética antes de publicar las reglas.
        </li>
        <li>
          <strong>Demasiadas categorías.</strong> Signo, diferencia, goles del
          local, goles del visitante, total de goles, bonus de empate... cada una
          es una regla más que explicar. Tres son muchas; cinco, demasiadas.
        </li>
        <li>
          <strong>Un bonus de campeón desproporcionado.</strong> Si vale más que
          un torneo entero de aciertos, la quiniela es una apuesta única con cien
          partidos de decoración.
        </li>
        <li>
          <strong>Puntos negativos.</strong> Restar suena a rigor y funciona
          como repelente: la gente juega por la ilusión de subir, no por el
          miedo a bajar.
        </li>
        <li>
          <strong>Reglas que dependen de un juicio humano.</strong> Todo lo que
          empiece por &quot;si el organizador considera que...&quot; acaba en una
          conversación incómoda. El sistema debe calcularse sin opinar.
        </li>
        <li>
          <strong>No escribirlo en ningún sitio.</strong> Si vive en la cabeza
          del organizador, la versión oficial es la que recuerde cada uno.
        </li>
      </ul>

      <h2>Cómo cambiar el sistema sin crear injusticias</h2>
      <p>
        A veces hay que cambiarlo: descubres el error del parcial, o el grupo
        pide puntos por diferencia de goles. Se puede, con una condición.
      </p>
      <p>
        <strong>Recalcula desde el primer partido.</strong> Si aplicas las reglas
        nuevas solo a lo que queda, premias o castigas a la gente por el{' '}
        <em>orden</em> en que acertó, algo que nadie podía prever al rellenar:
        quien clavó cinco marcadores en grupos los cobraría a precio antiguo y
        quien los clave después, a precio nuevo. El procedimiento que funciona:
        anuncia el cambio, explica por qué, recalcula la clasificación completa y
        publica la tabla antes y después. Si llega con una jornada en juego,
        espera a que termine: eso no se arregla ni recalculando.
      </p>
      <p>
        Recalcular a mano cincuenta jugadores por cien partidos es donde mueren
        casi todas las hojas de cálculo. En QuinielaBOX puedes ajustar cuánto
        vale cada acierto y recalcular la clasificación entera con un botón; si
        comparas herramientas, la guía de{' '}
        <Link href="/guias/aplicacion-para-quinielas">
          aplicaciones para quinielas
        </Link>{' '}
        lista lo que conviene mirar.
      </p>

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
            <tr>
              <td>Tiene grupos y eliminatorias</td>
              <td>3/1/0 + multiplicadores por ronda</td>
            </tr>
            <tr>
              <td>Es grande y se le empata la tabla</td>
              <td>3/1/0 + desempate por exactos</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Y la tabla que de verdad importa cuando dudas: qué efecto tiene cada
        añadido sobre el torneo.
      </p>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>Sistema</th>
              <th>Qué premia</th>
              <th>Efecto en el torneo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>3/1/0 puro</td>
              <td>Regularidad en el signo</td>
              <td>Simple; tabla a saltos y empates al final</td>
            </tr>
            <tr>
              <td>+ diferencia de goles</td>
              <td>Leer cada partido, no repetir molde</td>
              <td>Tabla apretada; cuesta escaparse</td>
            </tr>
            <tr>
              <td>+ bonus de empate</td>
              <td>Atreverse con los partidos ilegibles</td>
              <td>Más variedad de pronósticos en liga</td>
            </tr>
            <tr>
              <td>+ multiplicadores por ronda</td>
              <td>Acertar cuando más cuesta</td>
              <td>Nadie se descuelga antes de la final</td>
            </tr>
            <tr>
              <td>+ pick de campeón</td>
              <td>Comprometerse con una opinión larga</td>
              <td>Final abierto; vuelco posible el último día</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Si dudas, empieza por el 3/1/0 con pick de campeón y nada más. Es el
        mínimo que produce un torneo entretenido de principio a fin, y siempre
        puedes añadir una variante en la siguiente edición, cuando ya sepas cómo
        juega tu grupo.
      </p>
    </GuiaShell>
  );
}
