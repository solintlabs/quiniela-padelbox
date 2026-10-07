import Link from 'next/link';
import Script from 'next/script';
import { BrandMark } from '@/components/BrandMark';
import { ThemeToggle } from '@/components/ThemeToggle';
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, type FaqItem } from '@/lib/seo';

/** Con la cuenta de AdSense activa, las guías (contenido público con tráfico
 * orgánico) cargan el loader para que Auto ads pueda servir aquí. Las zonas
 * tras login no lo cargan: los anuncios de las quinielas FREE van por AdSlot. */
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_TENANT;

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
  slug,
  description,
  published = '2026-08-07',
  faq,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  cta?: boolean;
  /** Slug del artículo. Si se pasa, emite Article + BreadcrumbList. */
  slug?: string;
  description?: string;
  published?: string;
  /** Preguntas frecuentes → desplegables en Google. */
  faq?: FaqItem[];
}) {
  // Datos estructurados centralizados: así toda guía los lleva sin repetirlos.
  const schemas = [
    ...(slug && description
      ? [
          articleJsonLd({ slug, title, description, published }),
          breadcrumbJsonLd(slug, title),
        ]
      : []),
    ...(faq && faq.length > 0 ? [faqJsonLd(faq)] : []),
  ];

  return (
    <main className="gu">
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      {ADSENSE_CLIENT && (
        <Script
          id="adsense-loader"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          onLoad={() => {
            // Pide que se rellene el hueco de abajo. Sin esto el <ins> se
            // queda vacío aunque la cuenta esté aprobada.
            try {
              ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({});
            } catch {
              /* el bloqueador del visitante puede impedirlo */
            }
          }}
        />
      )}
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

        {/* Hueco de anuncio al final del artículo. Explícito y no solo Auto ads:
            así los anuncios se sirven aunque Auto ads no esté activado en la
            cuenta. Va DESPUÉS del contenido, nunca intercalado, para no
            estorbar la lectura (y porque Google penaliza lo contrario). */}
        {ADSENSE_CLIENT && ADSENSE_SLOT && (
          <ins
            className="adsbygoogle gu__ad"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}

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
