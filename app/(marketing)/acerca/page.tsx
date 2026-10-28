import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../guias/GuiaShell';
import '../guias/guias.css';

/**
 * "Acerca de" — quién está detrás del sitio, qué es el producto y cómo
 * contactar. La revisión de AdSense (y la de cualquier anunciante serio) busca
 * explícitamente esta página junto con privacidad, términos y contacto: sin
 * ella el sitio parece anónimo y se rechaza.
 */
const DESCRIPTION =
  'Qué es QuinielaBOX, quién está detrás y cómo contactarnos. Plataforma para crear y gestionar quinielas de fútbol entre amigos, clubes y empresas.';

export const metadata: Metadata = {
  title: 'Acerca de QuinielaBOX — quiénes somos',
  description: DESCRIPTION,
  alternates: { canonical: '/acerca' },
  openGraph: { title: 'Acerca de QuinielaBOX', description: DESCRIPTION, type: 'website' },
};

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Acerca de"
      title="Quiénes somos"
      lede="QuinielaBOX nació de una quiniela real, en un club real. Hoy cualquiera puede montar la suya."
      cta={false}
    >
      <h2>Qué es QuinielaBOX</h2>
      <p>
        QuinielaBOX es una plataforma para <strong>organizar quinielas de fútbol</strong>{' '}
        entre amigos, socios de un club o compañeros de trabajo. Cada participante
        pronostica los marcadores, la plataforma trae los resultados
        automáticamente, calcula los puntos y mantiene la clasificación al día.
      </p>
      <p>
        Existe en web y en aplicación para iPhone. Es gratis para grupos
        pequeños, con un plan de pago para clubes que necesitan más jugadores y
        más competiciones a la vez.
      </p>

      <h2>Cómo funciona</h2>
      <p>
        El organizador crea la quiniela, elige la competición y comparte un
        enlace de invitación. A partir de ahí el flujo es siempre el mismo:
      </p>
      <ul>
        <li>
          <strong>Cada jugador pronostica los marcadores</strong> desde el móvil
          o el navegador, sin instalar nada si no quiere.
        </li>
        <li>
          <strong>Los pronósticos se cierran solos</strong> al empezar cada
          partido. Es la regla que más discusiones evita, y por eso no depende
          de que el organizador se acuerde.
        </li>
        <li>
          <strong>Los resultados entran automáticamente</strong> desde
          proveedores de datos deportivos, y los puntos se calculan sin que
          nadie toque una hoja de cálculo.
        </li>
        <li>
          <strong>La clasificación está siempre al día</strong> y es la misma
          para todos, con el histórico de pronósticos visible cuando el partido
          ya ha cerrado.
        </li>
      </ul>
      <p>
        El sistema de puntos es configurable: el clásico 3 / 1 / 0, variantes
        por diferencia de goles o bonus por acertar al campeón del torneo. Lo
        explicamos a fondo en la guía de{' '}
        <Link href="/guias/sistemas-de-puntos">sistemas de puntos</Link>.
      </p>

      <h2>Qué cuesta</h2>
      <p>
        El plan gratuito permite grupos pequeños y una competición a la vez, y
        muestra publicidad. El plan Pro amplía el número de jugadores y de
        competiciones simultáneas, quita los anuncios y deja poner la marca, el
        color y el logo del club. Hay una modalidad de temporada con un pago
        único y otra mensual que se cancela cuando se quiera.
      </p>
      <p>
        Los pagos del plan Pro se procesan a través de <strong>Stripe</strong>.
        QuinielaBOX no almacena los datos de tu tarjeta en ningún momento.
      </p>

      <h2>De dónde viene</h2>
      <p>
        El producto empezó como la quiniela interna del club de pádel{' '}
        <strong>PADELBOX</strong>, en Venezuela, para sus socios. Funcionó tan
        bien que se convirtió en producto: hoy cualquier club o grupo puede crear
        la suya con las mismas herramientas.
      </p>

      <h2>Quién lo desarrolla</h2>
      <p>
        QuinielaBOX está desarrollado por{' '}
        <a href="https://solint.cloud" target="_blank" rel="noopener noreferrer">
          Solintlabs
        </a>
        , un estudio de software dirigido por Sergio Baldini.
      </p>

      <h2>Por qué publicamos guías</h2>
      <p>
        Además del producto, mantenemos una{' '}
        <Link href="/guias">sección de guías</Link> sobre cómo organizar
        quinielas: reglamentos, sistemas de puntuación, desempates, torneos
        largos y los errores que hacen que un grupo abandone a mitad de
        temporada.
      </p>
      <p>
        Las escribimos desde la experiencia de gestionar una quiniela real
        durante torneos completos, y desde las dudas que nos llegan por correo.
        Es el mismo juego en todo el mundo con nombres distintos —{' '}
        <Link href="/guias/penca-de-futbol">penca</Link> en Uruguay,{' '}
        <Link href="/guias/prode-como-armarlo">prode</Link> en Argentina,{' '}
        <Link href="/guias/polla-futbolera">polla</Link> en Venezuela y
        Colombia, <Link href="/guias/porra-de-futbol-oficina">porra</Link> en
        España — así que cada guía está escrita en el registro del país del que
        habla.
      </p>
      <p>
        Intentamos que sirvan aunque quien las lea no use nunca QuinielaBOX. Si
        encuentras algo mal o incompleto, escríbenos y lo corregimos.
      </p>

      <h2>Importante: no gestionamos dinero</h2>
      <div className="gu__note">
        <p>
          QuinielaBOX <strong>no procesa apuestas ni maneja el bote</strong>. Si
          un grupo decide poner una cuota, la recauda y reparte el propio
          organizador, fuera de la plataforma. Nosotros solo llevamos los
          pronósticos, los puntos y la clasificación.
        </p>
      </div>
      <p>
        Tampoco somos una casa de apuestas ni tenemos relación con ninguna: no
        se pueden hacer apuestas contra la plataforma, no hay cuotas, ni bonos,
        ni promociones de juego. Una quiniela es un juego entre personas que ya
        se conocen, y recomendamos mantenerlo así: cantidades pequeñas, reglas
        escritas desde el principio y ninguna presión para que nadie participe.
      </p>

      <h2>Contacto</h2>
      <p>
        Para dudas, soporte o propuestas, escríbenos a{' '}
        <a href="mailto:info@solint.cloud">info@solint.cloud</a>. Respondemos en
        horario laboral. Si eres un club y quieres que te ayudemos a montar la
        quiniela de tus socios, cuéntanoslo por ese mismo correo.
      </p>
      <p>
        Si quieres borrar tu cuenta y todos tus datos, puedes hacerlo tú mismo
        desde <Link href="/account/delete">eliminar mi cuenta</Link>, sin
        tener que escribirnos.
      </p>
      <p>
        Más información en <Link href="/soporte">Soporte</Link>, la{' '}
        <Link href="/privacy">Política de Privacidad</Link> y los{' '}
        <Link href="/terms">Términos de Uso</Link>.
      </p>
    </GuiaShell>
  );
}
