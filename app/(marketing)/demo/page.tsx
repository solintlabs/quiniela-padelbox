import Link from 'next/link';
import type { Metadata } from 'next';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BrandMark } from '@/components/BrandMark';
import { DemoQuiniela } from './DemoQuiniela';
import './demo.css';

export const metadata: Metadata = {
  title: 'Demo — prueba una quiniela sin registrarte | QuinielaBOX',
  description:
    'Prueba cómo se ve y funciona una quiniela de QuinielaBOX: pronostica partidos, mira el ranking en vivo, el podio y las reglas. Sin cuenta y sin instalar nada.',
  alternates: { canonical: '/demo' },
  openGraph: {
    title: 'Prueba una quiniela en 30 segundos',
    description:
      'Pronostica, mira el ranking y el podio. Es la misma quiniela que tendrá tu club, peña o grupo de amigos.',
    type: 'website',
  },
};

/**
 * Demo público. Nadie paga sin ver el producto: esta página deja jugar de
 * verdad (steppers, pestañas, ranking) con datos ficticios y sin cuenta, y
 * remata con el CTA de crear la tuya. Es indexable, a diferencia de las
 * quinielas reales.
 */
export default function DemoPage() {
  return (
    <main className="dm">
      {/* Cabecera propia: sin ella no había forma de volver al inicio. */}
      <header className="dm__top">
        <Link href="/" className="dm__brand">
          <BrandMark className="dm__mark" />
          <span>QUINIELA<i>BOX</i></span>
        </Link>
        <div className="dm__topcta">
          <ThemeToggle />
          <Link href="/" className="dm__toplink">← Volver al inicio</Link>
          <Link href="/saas/nueva" className="dm__topbtn">Crea la tuya</Link>
        </div>
      </header>

      <section className="dm__hero">
        <p className="dm__eyebrow">Demo en vivo</p>
        <h1 className="dm__title">
          Así se ve <span>tu quiniela</span>
        </h1>
        <p className="dm__sub">
          Toca los botones: pronostica, cambia de pestaña, mira el ranking. Es
          exactamente lo que recibirán los jugadores de tu club. No hace falta
          cuenta y nada de lo que hagas aquí se guarda.
        </p>
      </section>

      <section className="dm__stage">
        <div className="dm__phone">
          <DemoQuiniela />
        </div>

        <aside className="dm__side">
          <h2 className="dm__sideTitle">Lo que incluye</h2>
          <ul className="dm__list">
            <li><strong>Pronósticos</strong> con cierre automático antes de cada partido.</li>
            <li><strong>Resultados en vivo</strong> y puntos calculados solos.</li>
            <li><strong>Ranking y podio</strong> siempre actualizados.</li>
            <li><strong>Pick de campeón</strong> con bonus configurable.</li>
            <li><strong>Tus reglas</strong>: tú decides cuánto vale cada acierto.</li>
            <li><strong>Tu marca</strong>: nombre, color, logo y patrocinadores.</li>
            <li><strong>Recordatorios</strong> por email y notificación a quien le falte pronosticar.</li>
          </ul>

          <div className="dm__cta">
            <Link href="/saas/nueva" className="dm__btn">
              Crea tu quiniela gratis
            </Link>
            <Link href="/" className="dm__link">
              Ver planes y precios →
            </Link>
          </div>
        </aside>
      </section>

      <section className="dm__foot">
        <h2 className="dm__footTitle">¿Para quién es?</h2>
        <div className="dm__cards">
          <article>
            <h3>Clubes y peñas</h3>
            <p>Organiza el bote de tus socios sin listas de WhatsApp ni hojas de cálculo.</p>
          </article>
          <article>
            <h3>Grupos de amigos</h3>
            <p>Monta la quiniela del Mundial o de tu liga en un par de minutos.</p>
          </article>
          <article>
            <h3>Empresas</h3>
            <p>Una competición interna para el equipo durante el torneo.</p>
          </article>
        </div>
        <p className="dm__note">
          QuinielaBOX no gestiona el dinero: el bote lo cobra y reparte el
          organizador como siempre.
        </p>

        <h2 className="dm__footTitle">Qué estás viendo</h2>
        <p className="dm__sub">
          La demo usa partidos y jugadores ficticios, pero el funcionamiento es
          el real. Cada jugador entra con su correo, pronostica los marcadores y
          deja de poder tocarlos cuando el partido empieza. A partir de ahí los
          resultados entran solos, los puntos se calculan sin que nadie sume a
          mano y la clasificación es la misma para todos, sin versiones
          distintas circulando por el grupo.
        </p>
        <p className="dm__sub">
          Lo que decide el organizador es el reglamento: qué torneo se juega,
          cuánto vale cada acierto y cómo se reparten los premios. Si estás
          dándole vueltas a esa parte, empieza por la guía de{' '}
          <Link href="/guias/como-organizar-una-quiniela">
            cómo organizar una quiniela paso a paso
          </Link>{' '}
          y por la de{' '}
          <Link href="/guias/sistemas-de-puntos">sistemas de puntos</Link>, que
          es la decisión que más cambia el torneo.
        </p>
      </section>
    </main>
  );
}
