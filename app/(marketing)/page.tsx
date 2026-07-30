import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import './landing.css';
import { PLANS } from '@/lib/saas/plans';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BrandMark } from '@/components/BrandMark';
import { LandingFX } from './LandingFX';
import { ScoringDemo } from './ScoringDemo';
import { Assistant } from './Assistant';
import { LeadForm } from './LeadForm';

export const metadata: Metadata = {
  title: 'La aplicación para quinielas de fútbol — crea la de tu grupo gratis',
  description:
    'Aplicación para quinielas de fútbol (web + iOS + Android): crea la quiniela, prode, penca o polla de tu comunidad en minutos. Resultados y puntos automáticos, ranking en vivo y reglas a tu medida. Gratis para empezar.',
  keywords: [
    'quiniela', 'prode', 'penca', 'polla de fútbol', 'porra de fútbol', 'boliche',
    'quiniela de fútbol', 'crear quiniela', 'quiniela entre amigos', 'quiniela del club',
    'app de quinielas', 'pronósticos de fútbol', 'quiniela mundial', 'quiniela online',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'QuinielaBOX',
    title: 'Lanza tu quiniela de fútbol · QuinielaBOX',
    description:
      'App de quinielas para tu comunidad: iOS + Android, ranking en vivo, puntuación configurable y premios. Gratis para empezar.',
    url: '/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'QuinielaBOX' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lanza tu quiniela de fútbol · QuinielaBOX',
    description: 'App de quinielas para tu comunidad. iOS + Android, gratis para empezar.',
  },
};

const jsonLdProduct = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'QuinielaBOX',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    'App para crear quinielas de fútbol con tu comunidad: ranking en vivo, puntuación configurable, app móvil iOS + Android y premios.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://www.quinielabox.com/',
  },
  provider: { '@type': 'Organization', name: 'Solint', url: 'https://solint.cloud' },
};

/**
 * Marca de la landing. Delega en BrandMark (fuente única) para que el logo sea
 * el mismo en la web, el favicon y la app; antes era una pala de pádel que en
 * pequeño se leía como un asterisco.
 */
function Mark() {
  return <BrandMark className="w-full h-full" ball="var(--lime)" seam="var(--paper)" />;
}

/** Balón pequeño (una tinta) para los eyebrow. */
function Ball() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.1" />
      <polygon points="8,5.98 9.92,7.38 9.19,9.63 6.81,9.63 6.08,7.38" fill="none" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" />
      <g stroke="currentColor" strokeWidth="0.85" strokeLinecap="round">
        <line x1="8" y1="5.98" x2="8" y2="3.95" />
        <line x1="9.92" y1="7.38" x2="11.85" y2="6.75" />
        <line x1="9.19" y1="9.63" x2="10.38" y2="11.28" />
        <line x1="6.81" y1="9.63" x2="5.62" y2="11.28" />
        <line x1="6.08" y1="7.38" x2="4.15" y2="6.75" />
      </g>
    </svg>
  );
}

function Stars() {
  return (
    <span className="rating__stars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24">
          <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.9 6.1 21l1.1-6.5-4.7-4.6 6.5-.95z" />
        </svg>
      ))}
    </span>
  );
}

const AppleIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 1.6c.1 1-.3 2-1 2.7-.7.8-1.8 1.4-2.8 1.3-.1-1 .4-2 1-2.7.7-.8 1.9-1.4 2.8-1.3zM19.6 17c-.5 1.2-.8 1.7-1.4 2.7-.9 1.4-2.2 3.1-3.7 3.1-1.4 0-1.7-.9-3.6-.9-1.8 0-2.2.9-3.5.9-1.6 0-2.7-1.6-3.6-2.9C1.2 17.3.9 13.1 2.5 10.8c1-1.5 2.7-2.4 4.3-2.4 1.6 0 2.6.9 3.9.9 1.3 0 2-.9 3.9-.9 1.4 0 2.9.8 3.9 2.1-3.4 1.9-2.9 6.8 1.2 6.4z" /></svg>
);
const AndroidIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.3c-.3.3-.5.7-.5 1.3v16.8c0 .6.2 1 .5 1.3l.1.1L13 12.6v-.2L3.7 2.2l-.1.1zM16.3 15.9l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.7 2zM15.9 16.3l-3.2-3.2-9.1 9.1c.4.4 1 .4 1.6.1l10.7-6M15.9 7.7L5.2 1.6c-.6-.3-1.2-.3-1.6.1l9.1 9.1 3.2-3.1z" /></svg>
);

// App Store ya publicada. Google Play pendiente → "Próximamente". Ambas se
// pueden sobreescribir por env (útil para tenants con su propia app), igual
// que en components/AppStoreBadges.tsx.
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://apps.apple.com/app/id6770234104';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || null;

function Stores() {
  return (
    <div className="stores">
      <a className="store" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Descargar en el App Store">
        {AppleIcon}
        <span><small>Descárgala en</small><b>App Store</b></span>
      </a>
      {PLAY_STORE_URL ? (
        <a className="store" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Descargar en Google Play">
          {AndroidIcon}
          <span><small>Disponible en</small><b>Google Play</b></span>
        </a>
      ) : (
        <span className="store store--soon" aria-disabled="true" title="Próximamente en Google Play">
          {AndroidIcon}
          <span><small>Próximamente</small><b>Google Play</b></span>
        </span>
      )}
    </div>
  );
}

const PLAN_ORDER = ['FREE', 'PRO', 'CUSTOM'] as const;

/** Precio legible de un plan. */
function priceLabel(priceUsd: number | null, period: string | null) {
  if (priceUsd === 0) return { big: 'Gratis', sub: 'para siempre' };
  if (priceUsd === null) return { big: 'A medida', sub: 'hablamos' };
  return { big: `$${priceUsd}`, sub: `USD / ${period ?? 'mes'}` };
}

/** Lista de features de un plan, derivada de sus límites reales. */
function planFeatures(limits: (typeof PLANS)['FREE']['limits']): string[] {
  const players = limits.maxPlayers === Number.POSITIVE_INFINITY
    ? 'Jugadores ilimitados'
    : `Hasta ${limits.maxPlayers} jugadores`;
  const comps = limits.maxCompetitions === Number.POSITIVE_INFINITY
    ? 'Competencias ilimitadas'
    : `${limits.maxCompetitions} competencia${limits.maxCompetitions === 1 ? '' : 's'} a la vez`;
  const catalog = limits.espnCatalog ? 'Catálogo de 221 ligas' : 'Partidos a mano o por CSV';
  const ads = limits.showsAds ? 'Con anuncios' : 'Sin anuncios';
  const brand = limits.removeBranding ? 'Sin marca ajena (white-label)' : 'Con marca QuinielaBOX';
  return [players, comps, catalog, ads, brand];
}

function Plans() {
  return (
    <div className="plans rise">
      {PLAN_ORDER.map((id) => {
        const plan = PLANS[id];
        const highlighted = id === 'PRO';
        // El número GRANDE es el barato ($9/mes): ancla la percepción de
        // precio. La temporada ($29 pago único) va justo debajo como "mejor
        // precio" — es la que mejor convierte en torneos, pero sin asustar.
        const price = priceLabel(plan.priceUsd, plan.period);
        return (
          <article key={id} className={`plan${highlighted ? ' plan--on' : ''}`}>
            {highlighted && <span className="plan__tag">Recomendado</span>}
            <h3>{plan.name}</h3>
            <div className="plan__price">
              <span className="plan__n">{price.big}</span>
              <span className="small">{price.sub}</span>
            </div>
            {highlighted && plan.season && (
              <p className="plan__season">
                ⭐ <strong>Mejor precio: ${plan.season.priceUsd} por temporada</strong> — pago
                único, cubre el torneo entero
              </p>
            )}
            <p className="plan__desc">{plan.tagline}</p>
            <ul className="plan__feats">
              {planFeatures(plan.limits).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link
              className={`btn ${highlighted ? 'btn--solid' : ''}`}
              href={plan.priceUsd === null ? '#contacto' : '/saas/nueva'}
            >
              {plan.priceUsd === null ? 'Contactar' : plan.priceUsd === 0 ? 'Empezar gratis' : 'Elegir Pro'}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function Phone({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="tilt" data-tilt>
      <div className="phone">
        <Image src={src} alt={alt} width={460} height={997} priority={priority} />
        <span className="phone__glare" aria-hidden="true" />
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  // Los usuarios que ya tienen sesión van directo a su quiniela; la home
  // pública es solo para visitantes.
  const session = await auth();
  if (session?.user) redirect('/mis-quinielas');

  return (
    <main className="lz">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }} />
      {/* El verificador de AdSense busca su script en la PORTADA del dominio. */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
        <Script
          id="adsense-loader"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
        />
      )}
      <noscript>
        <style>{`.lz .rise{opacity:1;transform:none}`}</style>
      </noscript>

      <header className="lz-top" id="top">
        <div className="wrap lz-top__in">
          <a className="brand" href="#top" aria-label="QuinielaBOX, inicio" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', textDecoration: 'none' }}>
            <span style={{ width: 30, height: 30, color: 'var(--ink)', flex: 'none' }}><Mark /></span>
            <span style={{ fontFamily: 'var(--display)', fontSize: '1.1rem', letterSpacing: '-0.035em' }}>
              QUINIELA<i style={{ fontStyle: 'normal', color: 'var(--lime)' }}>BOX</i>
            </span>
          </a>
          <nav>
            <Link href="/demo">Demo</Link>
            <Link href="/guias">Guías</Link>
            <a href="#juegos">Juegos</a>
            <a href="#reglas">Reglas</a>
            <a href="#app">La app</a>
            <a href="#precios">Precios</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <div className="lz-top__cta">
            <ThemeToggle />
            <Link className="lz-top__enter" href="/login">Entrar</Link>
            <Link className="btn btn--solid btn--sm" href="/saas/nueva">Crea tu quiniela</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="stadium hero" id="descargar">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="eyebrow rise"><Ball /> La quiniela de fútbol de tu comunidad</p>
            <h1 className="rise">El fútbol<br />se vive mejor<em>en quiniela</em></h1>
            <p className="lede rise">
              Pronostica los partidos, compite con tu gente y sube en la tabla jornada a jornada.
              Del Mundial a tu liga de siempre, gratis y sin límite de jugadores.
            </p>
            <p className="hero__syn rise">
              Le dicen quiniela, prode, penca, polla o porra — da igual cómo la llames en tu país.
            </p>
            <div className="hero__cta rise">
              <Link className="btn btn--solid btn--lg" href="/saas/nueva">
                Crea tu quiniela gratis
                <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              {/* Una sola llamada a "ver el producto": la demo jugable. El tour
                  de capturas (DemoTour) confundía al estar al lado. */}
              <Link className="btn" href="/demo">
                Probar demo en vivo
              </Link>
            </div>
            <div className="hero__stores rise">
              <span className="hero__stores-label">O descárgala en tu móvil:</span>
              <Stores />
            </div>
            <div className="rating rise">
              <Stars /> 4,8 en las tiendas · jugadores ilimitados · gratis
            </div>
            <p className="hero__enter rise">
              ¿Ya tienes cuenta? <Link href="/login">Entra a tu quiniela →</Link>
            </p>
          </div>
          <div className="stage rise">
            <Phone src="/demo/dashboard.jpg" alt="Pantalla de inicio de la app: podio de los tres primeros, tu posición y el siguiente partido" priority />
          </div>
        </div>
      </section>

      {/* CIFRAS */}
      <section className="wrap band band--tight">
        <div className="stats rise">
          <div className="stat"><span className="stat__n" data-count="221">0</span><span className="stat__l">Competencias</span></div>
          <div className="stat"><span className="stat__n" data-count="6192">0</span><span className="stat__l">Pronósticos jugados</span></div>
          <div className="stat"><span className="stat__n" data-count="3">0</span><span className="stat__l">Idiomas</span></div>
          <div className="stat"><span className="stat__n">Gratis</span><span className="stat__l">Para empezar a jugar</span></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="wrap band" id="features">
        <p className="eyebrow rise"><Ball /> Todo lo que necesitas</p>
        <h2 className="rise">Una quiniela<br />que juega sola</h2>
        <p className="lede rise">Tú pones el marcador. Del resto —resultados, puntos y tabla— se encarga la app.</p>
        <div className="feats rise">
          <article className="feat">
            <span className="feat__i" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 16 0M4 12a8 8 0 0 0 16 0M12 4v16" /><circle cx="12" cy="12" r="2.4" /></svg></span>
            <h3>Marcadores en vivo</h3>
            <p>Los resultados entran solos desde 221 competencias. Tú no actualizas nada.</p>
          </article>
          <article className="feat">
            <span className="feat__i" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7h10M4 12h16M4 17h7" /><circle cx="18" cy="7" r="2.2" /><circle cx="15" cy="17" r="2.2" /></svg></span>
            <h3>Puntuación a tu medida</h3>
            <p>Tú decides cuánto vale cada acierto: marcador exacto, ganador, diferencia de goles…</p>
          </article>
          <article className="feat">
            <span className="feat__i" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 4h12v4a6 6 0 0 1-12 0z" /><path d="M6 5.5H3.4v1.4A3 3 0 0 0 6.4 10M18 5.5h2.6v1.4A3 3 0 0 1 17.6 10M12 14v3M8.5 20.5h7" /></svg></span>
            <h3>Mención de campeón</h3>
            <p>Bonus por acertar quién levanta la copa. Tu elección se congela al primer pitido.</p>
          </article>
          <article className="feat">
            <span className="feat__i" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7" /></svg></span>
            <h3>Tabla al instante</h3>
            <p>El ranking se recalcula apenas termina el partido. Los empatados comparten puesto.</p>
          </article>
          <article className="feat">
            <span className="feat__i" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><path d="M14 4h5v5M20 4l-8 8" /><path d="M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6" /></svg></span>
            <h3>Invita con un enlace</h3>
            <p>Compartes el link por WhatsApp. Quien entra queda anotado. Sin instalar nada para probar.</p>
          </article>
          <article className="feat">
            <span className="feat__i" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z" /></svg></span>
            <h3>221 competencias</h3>
            <p>LaLiga, Premier, Champions, Libertadores, el Mundial… o la liga de tu barrio a mano.</p>
          </article>
        </div>
      </section>

      {/* JUEGOS */}
      <section className="wrap band" id="juegos">
        <p className="eyebrow rise"><Ball /> Nuestros juegos crean comunidad</p>
        <h2 className="rise">A los fans les encanta<br />competir entre sí</h2>
        <div className="games rise">
          <article className="game">
            <div className="gmock" aria-hidden="true">
              <div className="grow grow--lit"><span className="pos pos--1">1</span><span className="nm">Pedrinho</span><span className="pts">243 pts</span></div>
              <div className="grow"><span className="pos">2</span><span className="nm">Gustavo Helo</span><b>238</b></div>
              <div className="gmatch"><span>🇺🇾 Uruguay</span><span className="sc">2 – 1</span><span className="aw">España 🇪🇸</span></div>
              <div className="gmatch"><span>🇦🇷 Argentina</span><span className="sc">3 – 2</span><span className="aw">Austria 🇦🇹</span></div>
            </div>
            <div className="game__txt">
              <h3>Quinielas, pollas, prodes</h3>
              <p>Las competencias de predicciones que imagines para tu comunidad, con tu propio contenido, reglas y premios.</p>
            </div>
          </article>
          <article className="game">
            <div className="gmock" aria-hidden="true">
              <div className="gq">¿Quién metió más goles en Mundiales?</div>
              <div className="gopt gopt--ok"><span>Miroslav Klose</span><span className="goals">16 goles</span></div>
              <div className="gopt"><span>Ronaldo</span><span className="goals">15 goles</span></div>
              <div className="gopt"><span>Gerd Müller</span><span className="goals">14 goles</span></div>
            </div>
            <div className="game__txt">
              <h3>Trivias deportivas</h3>
              <p>Los desafíos más divertidos para que tu comunidad aprenda, compita y demuestre quién es el verdadero experto.</p>
            </div>
          </article>
          <article className="game">
            <div className="gmock" aria-hidden="true">
              <div className="grow"><span className="pos">⚔️</span><span className="nm">Survivor</span><span className="pts">Pronto</span></div>
              <div className="grow"><span className="pos">🎱</span><span className="nm">Bingo deportivo</span><span className="pts">Pronto</span></div>
              <div className="grow"><span className="pos">🧢</span><span className="nm">Fantasy</span><span className="pts">Pronto</span></div>
            </div>
            <div className="game__txt">
              <span className="game__soon">En camino</span>
              <h3>Vamos por más…</h3>
              <p>Se vienen más juegos para los fans: Survivor, Bingo, Fantasy y más formas de competir con tu gente.</p>
            </div>
          </article>
        </div>
      </section>

      {/* PUNTUACIÓN */}
      <section className="wrap band" id="reglas">
        <p className="eyebrow rise"><Ball /> Tus reglas</p>
        <h2 className="rise">Tú decides<br />cuánto vale cada acierto</h2>
        <p className="lede rise">¿En tu grupo el marcador exacto vale 5 y no 3? Cámbialo. Se ajusta desde tu panel y se aplica al instante.</p>
        <div className="try">
          <div className="rules rise">
            <div className="rule"><span className="rule__p">5</span><span className="rule__t"><strong>Marcador exacto</strong><span>Acertar el resultado. Excluyente: no acumula parciales.</span></span></div>
            <div className="rule"><span className="rule__p">2</span><span className="rule__t"><strong>Acertar el ganador</strong><span>El 1X2 de siempre.</span></span></div>
            <div className="rule"><span className="rule__p">1</span><span className="rule__t"><strong>Diferencia de goles</strong><span>Pones 2–0 y termina 3–1. Sigue teniendo mérito.</span></span></div>
            <div className="rule"><span className="rule__p">1</span><span className="rule__t"><strong>Goles de un equipo</strong><span>Por cada equipo cuyo marcador aciertes.</span></span></div>
            <div className="rule"><span className="rule__p">3</span><span className="rule__t"><strong>Acertar un empate</strong><span>Extra opcional: es lo más difícil de clavar.</span></span></div>
            <div className="rule"><span className="rule__p">25</span><span className="rule__t"><strong>Mención de campeón</strong><span>Bonus si aciertas quién gana el torneo.</span></span></div>
          </div>
          <ScoringDemo />
        </div>
      </section>

      {/* LA APP */}
      <section className="wrap band" id="app">
        <p className="eyebrow rise"><Ball /> La app</p>
        <h2 className="rise">Tus jugadores<br />la llevan encima</h2>
        <p className="lede rise">Lo que ves aquí no es un montaje: es una quiniela real funcionando en el móvil de sus jugadores.</p>
        <div className="shots">
          <figure className="shot rise">
            <Phone src="/demo/predecir.jpg" alt="Listado de partidos con botones más y menos para poner el marcador de cada equipo" />
            <figcaption><span className="shot__t">El pronóstico</span><span className="shot__d">Dos botones por equipo. Se cierra solo al pitido inicial.</span></figcaption>
          </figure>
          <figure className="shot rise">
            <Phone src="/demo/ranking.jpg" alt="Tabla de la quiniela con el jugador actual resaltado en su fila" />
            <figcaption><span className="shot__t">La tabla</span><span className="shot__d">Se recalcula sola apenas termina el partido.</span></figcaption>
          </figure>
        </div>
      </section>

      {/* CÓMO */}
      <section className="wrap band" id="como">
        <p className="eyebrow rise"><Ball /> Cómo funciona</p>
        <h2 className="rise">Tu quiniela<br />en 3 pasos</h2>
        <div className="steps rise">
          <article className="step"><span className="step__n">PASO <b>01</b></span><h3>Crea la quiniela</h3><p>Le pones nombre, eliges la competencia del catálogo y ajustas la puntuación a tu gusto.</p></article>
          <article className="step"><span className="step__n">PASO <b>02</b></span><h3>Invita a tu gente</h3><p>Compartes un enlace por WhatsApp. Cada quien entra, se anota y elige su campeón.</p></article>
          <article className="step"><span className="step__n">PASO <b>03</b></span><h3>A competir</h3><p>Pronostican cada jornada. Los puntos se reparten al pitido final y la tabla se mueve sola.</p></article>
        </div>
      </section>

      {/* PREMIOS */}
      <section className="wrap band" id="premios">
        <p className="eyebrow rise"><Ball /> Premios</p>
        <h2 className="rise">Juega por lo<br />que quieras</h2>
        <div className="prize">
          <article className="pcard rise">
            <span className="pcard__k">Quinielas privadas</span>
            <h3>Entre los tuyos</h3>
            <p>Montas la quiniela con tus amigos y deciden entre ustedes qué se lleva quien gane. La app pone la tabla; lo demás, lo arreglan a su manera.</p>
          </article>
          <article className="pcard rise">
            <span className="pcard__k">Quinielas de tu comunidad</span>
            <h3>Con tus propios premios</h3>
            <p>Cada club, negocio o grupo suma los premios que consiga de sus propios patrocinadores. Tú eliges qué está en juego cada temporada.</p>
          </article>
        </div>
      </section>

      {/* PRECIOS */}
      <section className="wrap band" id="precios">
        <p className="eyebrow rise"><Ball /> Planes</p>
        <h2 className="rise">Gratis para jugar.<br />De pago para clubes.</h2>
        <p className="lede rise">
          Jugar siempre es gratis. Si tu club o negocio quiere más jugadores, más competencias
          y quitar los anuncios, subes a Pro. El plan lo paga el organizador en la web; la app
          nunca vende nada.
        </p>
        <Plans />
        <p className="small rise" style={{ marginTop: '1.4rem' }}>
          El nivel gratis muestra anuncios a tus jugadores. Pasar a Pro los quita y desbloquea el catálogo completo.
        </p>
      </section>

      {/* LIGAS */}
      <section className="wrap band" id="ligas">
        <p className="eyebrow rise"><Ball /> El catálogo</p>
        <h2 className="rise">221 competencias,<br />actualizadas solas</h2>
        <p className="lede rise">Marcadores en vivo, calendario y tabla. Cuando termina el partido, los puntos ya están repartidos.</p>
        <div className="chips rise">
          <span className="chip chip--on">LaLiga</span><span className="chip chip--on">Premier League</span>
          <span className="chip">Serie A</span><span className="chip">Bundesliga</span><span className="chip">Ligue 1</span>
          <span className="chip chip--on">Liga MX</span><span className="chip">MLS</span>
          <span className="chip chip--on">Libertadores</span><span className="chip">Copa América</span>
          <span className="chip">Champions</span><span className="chip">Brasileirão</span>
          <span className="chip">Liga Argentina</span><span className="chip">Concacaf</span>
          <span className="chip">Mundial</span><span className="chip">+ 207 más</span>
        </div>
        <div className="tablewrap rise">
          <table>
            <caption>Así ve la tabla tu grupo</caption>
            <thead><tr><th>#</th><th>Jugador</th><th style={{ textAlign: 'right' }}>Exactos</th><th style={{ textAlign: 'right' }}>Puntos</th></tr></thead>
            <tbody>
              <tr className="me"><td className="n">1</td><td>Tú</td><td className="n">5</td><td className="n">28</td></tr>
              <tr><td className="n">2</td><td>Marta R.</td><td className="n">2</td><td className="n">19</td></tr>
              <tr><td className="n">2</td><td>Javi</td><td className="n">2</td><td className="n">19</td></tr>
              <tr><td className="n">4</td><td>Nico</td><td className="n">0</td><td className="n">15</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="wrap band" id="contacto">
        <p className="eyebrow rise"><Ball /> Contacto</p>
        <div className="contact">
          <div className="contact__copy rise">
            <h2>¿Montamos<br />la de tu comunidad?</h2>
            <p style={{ marginTop: '1.1rem' }}>Cuéntanos qué tienes en mente y te ayudamos a lanzarla. Clubes, negocios, medios o grupos de amigos: la armamos contigo.</p>
            <ul className="contact__list">
              <li><svg viewBox="0 0 24 24"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg><span>Escríbenos a <b>info@solint.cloud</b></span></li>
              <li><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg><span>Te respondemos <b>en menos de 24 h</b></span></li>
              <li><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg><span>Sin compromiso: primero <b>lo probamos juntos</b></span></li>
            </ul>
          </div>
          <div className="rise"><LeadForm /></div>
        </div>
      </section>

      {/* CIERRE */}
      <section className="stadium band">
        <div className="wrap" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem' }}>
          <p className="eyebrow rise"><Ball /> Empieza hoy</p>
          <h2 className="rise">¿Jugamos?</h2>
          <p className="lede rise">Tardas menos en crear tu quiniela que en discutir cuánto vale acertar un empate.</p>
          <div className="rise">
            <Link className="btn btn--solid btn--lg" href="/saas/nueva">
              Crea tu quiniela gratis
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
          <div className="rise"><Stores /></div>
        </div>
      </section>

      <footer className="lz-foot">
        <div className="wrap lz-foot__in">
          <div>
            <span style={{ fontFamily: 'var(--display)', fontSize: '1.1rem', letterSpacing: '-0.035em' }}>
              QUINIELA<i style={{ fontStyle: 'normal', color: 'var(--lime)' }}>BOX</i>
            </span>
            <p className="small" style={{ marginTop: '.45rem' }}>Escríbenos a <a href="mailto:info@solint.cloud">info@solint.cloud</a></p>
          </div>
          <a className="lz-foot__solint" href="https://solint.cloud" target="_blank" rel="noopener noreferrer">
            <small>Hecho por</small>
            <Image src="/partners/solint.png" alt="Solint" width={1000} height={227} />
          </a>
          <p className="small mono">es · en · pt</p>
        </div>
        <div className="wrap lz-foot__legal">
          <Link href="/privacy">Política de Privacidad</Link>
          <Link href="/terms">Términos de Uso</Link>
          <Link href="/soporte">Soporte</Link>
          <Link href="/account/delete">Eliminar cuenta</Link>
        </div>
      </footer>

      <Assistant />
      <LandingFX />
    </main>
  );
}
