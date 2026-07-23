import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getInscriptionsStatus } from '@/lib/inscriptions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Entrar a tu quiniela',
  description:
    'Entra a QuinielaBOX sin contraseñas: te enviamos un enlace de acceso a tu correo, o entra con Google.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

/** Marca QuinielaBOX: pala de pádel con balón de fútbol. */
function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="34" height="34" aria-hidden="true">
      <line x1="14.1" y1="14.1" x2="20.6" y2="20.6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="9" cy="9" r="7.1" stroke="#fff" strokeWidth="1.8" />
      <circle cx="9" cy="9" r="4.9" fill="#B6FF3C" />
      <polygon points="9,6.75 11.14,8.30 10.32,10.82 7.68,10.82 6.86,8.30" fill="#0A0D08" />
      <g stroke="#0A0D08" strokeWidth="0.9" strokeLinecap="round">
        <line x1="9" y1="6.75" x2="9" y2="4.49" />
        <line x1="11.14" y1="8.30" x2="13.29" y2="7.61" />
        <line x1="10.32" y1="10.82" x2="11.65" y2="12.65" />
        <line x1="7.68" y1="10.82" x2="6.35" y2="12.65" />
        <line x1="6.86" y1="8.30" x2="4.71" y2="7.61" />
      </g>
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/mi-quiniela');

  const params = await searchParams;
  const showClosedAttempt = params.closed === '1';

  const rules = await prisma.rules.findUnique({
    where: { id: 1 },
    select: { inscriptionsCloseAt: true },
  });
  const inscriptions = getInscriptionsStatus(rules?.inscriptionsCloseAt ?? null);
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  const hasApple =
    !!process.env.AUTH_APPLE_ID &&
    !!process.env.APPLE_TEAM_ID &&
    !!process.env.APPLE_KEY_ID &&
    !!process.env.APPLE_PRIVATE_KEY;

  return (
    <main className="min-h-screen relative overflow-hidden text-[#EAF3E0]">
      {/* Estadio (imagen local) + overlay */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover"
        style={{ backgroundImage: "url('/landing/stadium.jpg')", backgroundPosition: 'center 22%' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,9,12,0.72) 0%, rgba(6,11,8,0.86) 45%, #060B08 90%)',
        }}
      />

      <div className="max-w-md mx-auto px-6 pt-14 pb-16 flex flex-col items-center">
        {/* Marca QuinielaBOX */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="QuinielaBOX, inicio">
          <BrandMark />
          <span className="font-display text-2xl tracking-tight">
            QUINIELA<span className="text-accent">BOX</span>
          </span>
        </Link>

        <h1 className="font-display text-3xl mt-8 text-center leading-tight">Entra a tu quiniela</h1>
        <p className="text-sm text-[#C7D4BB] mt-2 text-center max-w-xs">
          Sin contraseñas. Te enviamos un enlace de acceso a tu correo, o entra con Google.
        </p>

        {/* Card del form */}
        <div className="mt-7 w-full rounded-2xl bg-[#0B100B]/90 backdrop-blur-md border border-[#1e2a19] p-5">
          {(inscriptions.closed || showClosedAttempt) && (
            <div className="mb-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              <strong>Registro cerrado en esta quiniela.</strong> Si ya tienes cuenta, entra con tu
              correo o con Google.
            </div>
          )}

          <form
            action={async (formData) => {
              'use server';
              const email = String(formData.get('email') ?? '').trim().toLowerCase();
              const name = String(formData.get('name') ?? '').trim();
              if (!email) return;

              const existing = await prisma.user.findUnique({ where: { email } });

              if (!existing) {
                const r = await prisma.rules.findUnique({
                  where: { id: 1 },
                  select: { inscriptionsCloseAt: true },
                });
                const st = getInscriptionsStatus(r?.inscriptionsCloseAt ?? null);
                if (st.closed) redirect('/login?closed=1');
              }

              if (name) {
                if (!existing) {
                  await prisma.user.create({ data: { email, name } });
                } else if (!existing.name) {
                  await prisma.user.update({ where: { id: existing.id }, data: { name } });
                }
              }

              await signIn('resend', { email, redirectTo: '/mi-quiniela' });
            }}
            className="space-y-2"
          >
            <Input name="name" type="text" placeholder="Tu nombre (opcional)" autoComplete="name" maxLength={60} />
            <Input name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
            <Button type="submit" size="lg" className="w-full font-display tracking-tight mt-2">
              ENVIAR ENLACE DE ACCESO →
            </Button>
          </form>

          {(hasGoogle || hasApple) && (
            <div className="flex items-center gap-2 my-4 text-xs text-[#8b9a7f]">
              <span className="flex-1 h-px bg-[#1e2a19]" /> o <span className="flex-1 h-px bg-[#1e2a19]" />
            </div>
          )}

          <div className="space-y-2">
            {hasGoogle && (
              <form
                action={async () => {
                  'use server';
                  await signIn('google', { redirectTo: '/mi-quiniela' });
                }}
              >
                <button
                  type="submit"
                  className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-lg border border-[#2a3a22] bg-white/5 text-sm font-semibold text-[#EAF3E0] transition-colors hover:bg-white/10 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B100B]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </button>
              </form>
            )}
            {hasApple && (
              <form
                action={async () => {
                  'use server';
                  await signIn('apple', { redirectTo: '/mi-quiniela' });
                }}
              >
                <button
                  type="submit"
                  className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-lg border border-white/20 bg-black text-sm font-semibold text-white transition-colors hover:brightness-150 hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B100B]"
                >
                  <svg width="17" height="17" viewBox="0 0 384 512" fill="white" aria-hidden="true">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  Continuar con Apple
                </button>
              </form>
            )}
          </div>

          <p className="text-[11px] text-[#8b9a7f] mt-4 text-center leading-relaxed">
            ¿Primera vez? Tu cuenta se crea sola al entrar. Sin contraseñas que recordar.
          </p>
        </div>

        <Link href="/" className="mt-8 text-xs text-[#8b9a7f] hover:text-[#EAF3E0] transition-colors">
          ← Volver a QuinielaBOX
        </Link>
      </div>
    </main>
  );
}
