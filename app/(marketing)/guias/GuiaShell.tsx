import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Marco de las guías públicas: cabecera con marca, contenido y CTA de cierre.
 * Se comparte entre el índice y cada artículo para que todas se vean iguales
 * y siempre haya una salida hacia el producto.
 */
export function GuiaShell({
  eyebrow,
  title,
  lede,
  children,
  cta = true,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  cta?: boolean;
}) {
  return (
    <main className="gu">
      <header className="gu__top">
        <Link href="/" className="gu__brand" title="Volver al inicio">
          <BrandMark />
          <span>
            QUINIELA<i>BOX</i>
          </span>
        </Link>
        <Link href="/" className="gu__back">
          ← Inicio
        </Link>
        <div className="gu__topcta">
          <ThemeToggle />
          <Link href="/demo" className="gu__topbtn">
            🎮 Probar la demo
          </Link>
        </div>
      </header>

      <div className="gu__wrap">
        <p className="gu__eyebrow">{eyebrow}</p>
        <h1 className="gu__h1">{title}</h1>
        {lede && <p className="gu__lede">{lede}</p>}

        <div className="gu__body">{children}</div>

        {cta && (
          <section className="gu__cta">
            <h2>Monta la tuya en 2 minutos</h2>
            <p>
              Crea la quiniela de tu club, peña o grupo de amigos. Gratis para
              empezar, sin tarjeta.
            </p>
            <Link href="/saas/nueva" className="gu__btn">
              Crear mi quiniela
            </Link>
            <Link href="/demo" className="gu__alt">
              o prueba la demo sin registrarte →
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
