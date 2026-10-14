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

      <h2>Importante: no gestionamos dinero</h2>
      <div className="gu__note">
        <p>
          QuinielaBOX <strong>no procesa apuestas ni maneja el bote</strong>. Si
          un grupo decide poner una cuota, la recauda y reparte el propio
          organizador, fuera de la plataforma. Nosotros solo llevamos los
          pronósticos, los puntos y la clasificación.
        </p>
      </div>

      <h2>Contacto</h2>
      <p>
        Para dudas, soporte o propuestas, escríbenos a{' '}
        <a href="mailto:info@solint.cloud">info@solint.cloud</a>. Respondemos en
        horario laboral.
      </p>
      <p>
        Más información en <Link href="/soporte">Soporte</Link>, la{' '}
        <Link href="/privacy">Política de Privacidad</Link> y los{' '}
        <Link href="/terms">Términos de Uso</Link>.
      </p>
    </GuiaShell>
  );
}
