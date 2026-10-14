import Link from 'next/link';
import type { Metadata } from 'next';
import { GuiaShell } from '../GuiaShell';
import '../guias.css';

/**
 * Página objetivo del término de búsqueda "aplicación para quinielas" (y
 * variantes: app para quinielas, app para hacer una quiniela…). Es la que
 * debe posicionar para esa intención de compra; por eso lleva FAQPage.
 */
export const metadata: Metadata = {
  title: 'Aplicación para quinielas de fútbol: qué debe tener y cuál usar',
  description:
    'Buscas una aplicación para quinielas? Qué debe tener una buena app: resultados automáticos, ranking en vivo, puntos configurables y bote fuera de la app. Compara Excel, WhatsApp y QuinielaBOX.',
  alternates: { canonical: '/guias/aplicacion-para-quinielas' },
  openGraph: {
    title: 'Aplicación para quinielas de fútbol: qué debe tener y cuál usar',
    description:
      'Resultados automáticos, ranking en vivo y reglas a tu medida. Lo que separa una app de quinielas de verdad de un Excel compartido.',
    type: 'article',
  },
};

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuál es la mejor aplicación para hacer una quiniela con amigos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La que te quite trabajo: resultados y puntos automáticos, ranking en vivo, reglas configurables y enlace de invitación. QuinielaBOX hace todo eso gratis para grupos de hasta 15 jugadores, con web y app iOS/Android.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo crear una quiniela gratis?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. En QuinielaBOX el plan gratis incluye una competición activa, hasta 15 jugadores, catálogo de más de 200 ligas y ranking en vivo. Los planes de pago añaden más jugadores, más competiciones y tu propia marca.',
      },
    },
    {
      '@type': 'Question',
      name: '¿La aplicación maneja el dinero del bote?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, y es lo correcto: el bote se paga entre vosotros como siempre (efectivo, transferencia, Zelle…). La app solo lleva los pronósticos, los puntos y el ranking, y muestra al organizador cómo cobrar.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Sirve para cualquier liga o solo para el Mundial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sirve para más de 200 competiciones: Mundial 2026, LaLiga, Premier League, Liga MX, Libertadores, MLS… y también puedes crear partidos a mano para torneos locales.',
      },
    },
  ],
};

export default function Page() {
  return (
    <GuiaShell
      eyebrow="Guía"
      title="Aplicación para quinielas: qué debe tener y cuál usar"
      lede="Una quiniela en Excel funciona… hasta la segunda jornada. Esto es lo que tiene que hacer por ti una aplicación de quinielas de verdad."
      slug="aplicacion-para-quinielas"
      description="Qué debe tener una buena aplicación para quinielas: resultados automáticos, ranking en vivo, puntos configurables y el bote fuera de la app."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <Link href="/guias" className="gu__back">
        ← Todas las guías
      </Link>

      <h2>El problema de la quiniela “a mano”</h2>
      <p>
        Todas las quinielas de amigos empiezan igual: un Excel o una lista en WhatsApp. Y todas
        mueren igual: alguien olvida apuntar un pronóstico, otro discute un punto, el organizador
        pasa el domingo copiando marcadores… y a la tercera jornada ya nadie sabe quién va
        ganando. El problema no es tu grupo: es la herramienta.
      </p>

      <h2>Qué debe hacer por ti una aplicación para quinielas</h2>
      <ul>
        <li>
          <strong>Resultados automáticos.</strong> Los marcadores entran solos al terminar cada
          partido. Nadie copia nada, nadie discute nada.
        </li>
        <li>
          <strong>Puntos y ranking en vivo.</strong> El sistema puntúa cada pronóstico al momento
          y la tabla se mueve sola. Cada jugador ve claramente si su pronóstico quedó guardado.
        </li>
        <li>
          <strong>Reglas a tu medida.</strong> El 3/1/0 clásico, bonus por marcador exacto, pick
          de campeón… y que el organizador decida cuándo se cierran los pronósticos.
        </li>
        <li>
          <strong>Cierre antes del pitido.</strong> Los pronósticos se bloquean solos antes de
          cada partido y los de los demás no se ven hasta el cierre: imposible copiar.
        </li>
        <li>
          <strong>Invitación por enlace.</strong> Mandas un link por WhatsApp y tu gente entra
          sola, sin instalar nada raro y sin registros eternos.
        </li>
        <li>
          <strong>El dinero, fuera.</strong> Una app seria NO toca el bote: os pagáis entre
          vosotros como siempre, y la app solo dice quién ganó.
        </li>
      </ul>

      <h2>Excel vs. WhatsApp vs. aplicación</h2>
      <div className="gu__tableWrap">
        <table className="gu__table">
          <thead>
            <tr>
              <th>&nbsp;</th>
              <th>Excel</th>
              <th>WhatsApp</th>
              <th>QuinielaBOX</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Resultados automáticos</td>
              <td>✗</td>
              <td>✗</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Ranking en vivo</td>
              <td>A mano</td>
              <td>✗</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Nadie puede copiar</td>
              <td>✗</td>
              <td>✗</td>
              <td>✓ (se cierran solos)</td>
            </tr>
            <tr>
              <td>Trabajo del organizador</td>
              <td>Horas por jornada</td>
              <td>Horas por jornada</td>
              <td>Minutos al crearla</td>
            </tr>
            <tr>
              <td>Precio</td>
              <td>Gratis</td>
              <td>Gratis</td>
              <td>Gratis hasta 15 jugadores</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Cómo se crea una quiniela en QuinielaBOX</h2>
      <ol>
        <li>Entra en quinielabox.com (o en la app iOS) y pulsa «Crear mi quiniela».</li>
        <li>Ponle nombre y color: es tu quiniela, con tu marca.</li>
        <li>Elige la competición del catálogo (Mundial 2026, LaLiga, Liga MX… más de 200).</li>
        <li>Comparte el enlace de invitación por WhatsApp.</li>
        <li>Listo: los partidos, los puntos y el ranking van solos.</li>
      </ol>
      <p>
        Si quieres verlo antes de registrarte,{' '}
        <Link href="/demo">prueba la demo jugable</Link> — es la app real con datos de ejemplo.
      </p>

      <h2>Preguntas frecuentes</h2>
      <h3>¿Cuál es la mejor aplicación para hacer una quiniela con amigos?</h3>
      <p>
        La que te quite trabajo. Si el organizador sigue copiando marcadores a mano, la
        herramienta no está haciendo su parte. Busca resultados automáticos, ranking en vivo y
        reglas configurables — y que sea gratis empezar, como QuinielaBOX.
      </p>
      <h3>¿Puedo crear una quiniela gratis?</h3>
      <p>
        Sí: el plan gratis de QuinielaBOX cubre una competición y hasta 15 jugadores. Para clubes
        y grupos grandes está el plan Pro (hasta 500 jugadores, sin anuncios y con tu marca).
      </p>
      <h3>¿La aplicación maneja el dinero?</h3>
      <p>
        No. El bote se paga entre vosotros como siempre. La app lleva los pronósticos y los
        puntos, y le enseña a cada jugador cómo pagar su inscripción al organizador.
      </p>
      <h3>¿Funciona en iPhone y Android?</h3>
      <p>
        QuinielaBOX funciona en la web (cualquier móvil u ordenador) y tiene app nativa en el App
        Store; la de Google Play está en camino. Tus jugadores pueden mezclar: unos por web,
        otros por app.
      </p>
    </GuiaShell>
  );
}
