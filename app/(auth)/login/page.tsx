import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { WhatsappFab } from '@/components/WhatsappFab';

export const metadata = { title: 'Entrar · Quiniela PADELBOX' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/');

  const [sponsors] = await Promise.all([
    prisma.sponsor.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
  ]);
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  return (
    <main className="min-h-screen relative overflow-hidden">
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
            <p className="font-display tabular-nums text-xs mt-0.5">$500</p>
          </div>
          <div className="rounded-md bg-orange-500/15 border border-orange-500/40 py-1.5 px-2 text-center">
            <p className="text-orange-300">🥉</p>
            <p className="font-display tabular-nums text-orange-300 text-xs mt-0.5">$300</p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 mt-2 text-center max-w-xs">
          + gift cards y productos <span className="text-[#f14826] font-semibold">DELISH</span> cada semana
        </p>

        {/* Card del form */}
        <div className="mt-6 w-full rounded-2xl bg-zinc-950/92 backdrop-blur-md border border-zinc-800 p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Únete a la quiniela</p>

          <form
            action={async (formData) => {
              'use server';
              const email = String(formData.get('email') ?? '').trim().toLowerCase();
              const name = String(formData.get('name') ?? '').trim();
              const phone = String(formData.get('phone') ?? '').trim();
              if (!email) return;

              if (name || phone) {
                const existing = await prisma.user.findUnique({ where: { email } });
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
              ENVIAR CÓDIGO →
            </Button>
          </form>

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
              href="https://wa.me/34635171649?text=Quiero%20inscribirme%20en%20la%20Quiniela%20PADELBOX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#25D366]"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* Sponsors slot */}
        <section className="mt-8 w-full">
          <p className="text-center text-[10px] uppercase tracking-[0.18em] text-muted mb-3">
            Con el apoyo de
          </p>
          {sponsors.length > 0 ? (
            <div className="flex items-center justify-center gap-6 flex-wrap opacity-70">
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
              <p className="text-xs text-muted">Espacio para tus patrocinadores</p>
            </div>
          )}
        </section>

        <p className="text-xs text-muted text-center mt-8 max-w-xs">
          ¿No estás inscrito? Tu cuenta se crea sola. El admin de PADELBOX valida tu pago para activarte.
        </p>
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
