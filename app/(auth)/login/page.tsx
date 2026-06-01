import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getInscriptionsStatus } from '@/lib/inscriptions';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { WhatsappFab } from '@/components/WhatsappFab';
import { AppStoreBadges } from '@/components/AppStoreBadges';
import { DemoTour } from '@/components/DemoTour';

export const metadata = {
  title: 'Entrar a la Quiniela del Mundial 2026',
  description:
    'Entra a la Quiniela PADELBOX × DELISH del Mundial 2026. Pronostica marcadores, sube en el ranking y gana premios semanales en gift cards de DELISH y aliados.',
  alternates: { canonical: '/login' },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'QuinielaBOX',
    title: 'Entrar a la Quiniela del Mundial 2026 · PADELBOX × DELISH',
    description:
      'Pronostica los partidos del Mundial 2026 y compite por $1.5K, $600 y $300 + gift cards en DELISH.',
    url: '/login',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'QuinielaBOX — Quiniela del Mundial 2026 PADELBOX × DELISH',
      },
    ],
  },
};
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/');

  const params = await searchParams;
  const showClosedAttempt = params.closed === '1';

  const [sponsors, rules] = await Promise.all([
    prisma.sponsor.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.rules.findUnique({ where: { id: 1 }, select: { inscriptionsCloseAt: true } }),
  ]);
  const inscriptions = getInscriptionsStatus(rules?.inscriptionsCloseAt ?? null);
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: 'Quiniela del Mundial 2026 — PADELBOX × DELISH',
    sport: 'Football',
    description:
      'Quiniela privada del Mundial de Fútbol 2026 para socios y amigos del club PADELBOX. Sistema de puntos 3/1/0 y bonus de +25 puntos por acertar al campeón.',
    startDate: '2026-06-11',
    endDate: '2026-07-19',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    organizer: {
      '@type': 'Organization',
      name: 'PADELBOX',
      url: 'https://www.quinielabox.com',
    },
    sponsor: { '@type': 'Organization', name: 'DELISH! BURGERS' },
    location: {
      '@type': 'VirtualLocation',
      url: 'https://www.quinielabox.com',
    },
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Foto de tribuna del estadio (asientos) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=2400&q=85')",
          filter: 'brightness(0.55)',
        }}
      />
      {/* Overlay oscuro de legibilidad */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.50) 0%, rgba(10,10,10,0.65) 35%, rgba(10,10,10,0.97) 80%, #0A0A0A 100%)',
        }}
      />

      <div className="max-w-md mx-auto px-6 pt-10 pb-12 flex flex-col items-center">
        {/* Co-branding: PADELBOX × DELISH */}
        <div className="flex items-center gap-5">
          <Logo size={44} priority />
          <span className="font-display text-3xl text-zinc-500 leading-none">×</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/partners/delish.svg"
            alt="DELISH! BURGERS"
            className="h-16 w-auto"
          />
        </div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 mt-2">
          Presentan la Quiniela del Mundial
        </p>

        <p className="text-[10px] uppercase tracking-[0.28em] text-accent font-bold mt-8">
          Mundial 2026
        </p>

        {/* Premios garantizados — 3 cuadritos del podio */}
        <div className="mt-5 grid grid-cols-3 gap-1.5 w-full max-w-[280px] text-[10px]">
          <div className="rounded-md bg-accent/15 border border-accent/40 py-1.5 px-2 text-center">
            <p className="text-accent">🥇</p>
            <p className="font-display tabular-nums text-accent text-xs mt-0.5">$1.5K</p>
          </div>
          <div className="rounded-md bg-zinc-900/80 border border-zinc-700 py-1.5 px-2 text-center">
            <p className="text-zinc-400">🥈</p>
            <p className="font-display tabular-nums text-xs mt-0.5">$600</p>
          </div>
          <div className="rounded-md bg-orange-500/15 border border-orange-500/40 py-1.5 px-2 text-center">
            <p className="text-orange-300">🥉</p>
            <p className="font-display tabular-nums text-orange-300 text-xs mt-0.5">$300</p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 mt-2 text-center max-w-xs">
          + gift cards canjeables en <span className="text-[#f14826] font-semibold">DELISH</span> y
          afiliados (Sole Mio, Tacoberto, Vinny&apos;s…)
        </p>

        {/* Card del form */}
        <div className="mt-6 w-full rounded-2xl bg-zinc-950/92 backdrop-blur-md border border-zinc-800 p-5">
          {(inscriptions.closed || showClosedAttempt) && (
            <div className="mb-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              <strong>Inscripciones cerradas.</strong> Ya no se aceptan nuevos registros. Si ya tenías cuenta, puedes seguir entrando con tu email.
            </div>
          )}
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted mb-3">
            {inscriptions.closed ? 'Entrar a tu cuenta' : 'Únete a la quiniela'}
          </p>

          <form
            action={async (formData) => {
              'use server';
              const email = String(formData.get('email') ?? '').trim().toLowerCase();
              const name = String(formData.get('name') ?? '').trim();
              const phone = String(formData.get('phone') ?? '').trim();
              if (!email) return;

              const existing = await prisma.user.findUnique({ where: { email } });

              // Si las inscripciones están cerradas, solo dejamos entrar a cuentas existentes.
              if (!existing) {
                const r = await prisma.rules.findUnique({ where: { id: 1 }, select: { inscriptionsCloseAt: true } });
                const st = getInscriptionsStatus(r?.inscriptionsCloseAt ?? null);
                if (st.closed) {
                  redirect('/login?closed=1');
                }
              }

              if (name || phone) {
                if (!existing) {
                  await prisma.user.create({
                    data: { email, name: name || null, phone: phone || null },
                  });
                } else {
                  const data: { name?: string; phone?: string } = {};
                  if (name && !existing.name) data.name = name;
                  if (phone && !existing.phone) data.phone = phone;
                  if (Object.keys(data).length) {
                    await prisma.user.update({ where: { id: existing.id }, data });
                  }
                }
              }

              await signIn('resend', { email, redirectTo: '/' });
            }}
            className="space-y-2"
          >
            <Input name="name" type="text" placeholder="Tu nombre o apodo" autoComplete="name" maxLength={60} />
            <Input name="phone" type="tel" inputMode="tel" placeholder="+58 412 555 0000" autoComplete="tel" maxLength={20} />
            <Input name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
            <Button type="submit" size="lg" className="w-full font-display tracking-tight mt-2">
              ENVIAR ENLACE →
            </Button>
          </form>

          {/* Demo: ver cómo funciona */}
          <div className="mt-4 flex justify-center">
            <DemoTour variant="pill" />
          </div>

          {hasGoogle && (
            <>
              <div className="flex items-center gap-2 my-4 text-xs text-muted">
                <span className="flex-1 h-px bg-line" /> o <span className="flex-1 h-px bg-line" />
              </div>
              <form
                action={async () => {
                  'use server';
                  await signIn('google', { redirectTo: '/' });
                }}
              >
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Continuar con Google
                </Button>
              </form>
            </>
          )}

          {/* Quick actions */}
          <div className="flex justify-around mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400">
            <Link href="/public/reglas" className="flex items-center gap-1 hover:text-ink">📖 Reglas</Link>
            <Link href="/public/inscripcion" className="flex items-center gap-1 hover:text-ink">💳 Inscripción</Link>
            <a
              href="https://wa.me/17864027294?text=Quiero%20inscribirme%20en%20la%20Quiniela%20PADELBOX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#25D366]"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* Info-box: como funciona el login passwordless + onboarding */}
        <div className="mt-6 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            <span className="text-accent font-bold uppercase tracking-[0.18em] text-[10px]">¿Cómo entro?</span>
            <br />
            Pones tu correo y te llega un <strong className="text-ink">enlace de acceso por email</strong>. Pinchas y entras —{' '}
            <strong className="text-ink">sin contraseñas que recordar</strong>. Tu sesión queda guardada en este navegador, así que solo pedimos el enlace la primera vez (o si cierras sesión).
          </p>
          <p className="text-[10px] text-zinc-500 mt-2">
            Tu cuenta se crea sola la primera vez. El admin de PADELBOX valida tu pago para activarte.
          </p>
        </div>

        {/* Aliados comerciales */}
        <section className="mt-8 w-full">
          <p className="text-center text-[10px] uppercase tracking-[0.28em] text-accent font-bold mb-3">
            Aliados Comerciales
          </p>
          {sponsors.length > 0 ? (
            <div className="flex items-center justify-center gap-6 flex-wrap opacity-80">
              {sponsors.map((s) =>
                s.logoUrl ? (
                  <SponsorLogo key={s.id} {...s} />
                ) : (
                  <span key={s.id} className="text-sm text-muted">{s.name}</span>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
              <p className="text-xs text-muted">Espacio para tus aliados comerciales</p>
            </div>
          )}
          <p className="text-[10px] text-zinc-500 text-center mt-3">
            Premios semanales cortesía de ellos
          </p>
        </section>

        {/* App Store / Play Store — solo aparece si las URLs estan en env */}
        <div className="mt-8 w-full">
          <AppStoreBadges variant="compact" />
        </div>
      </div>

      <Footer variant="auth" />
      <WhatsappFab />
    </main>
  );
}

function SponsorLogo({ logoUrl, name, url }: { logoUrl: string | null; name: string; url: string | null }) {
  if (!logoUrl) return null;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={name} className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
  );
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {img}
      </a>
    );
  }
  return img;
}
