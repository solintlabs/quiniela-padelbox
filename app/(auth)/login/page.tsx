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

  // Premios garantizados (fijos)
  const guaranteedPrizes = '$2.300';
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Hero stadium background — verde cancha */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at center top, rgba(74,124,29,0.35) 0%, transparent 55%), linear-gradient(180deg, #0A1F08 0%, #0A0A0A 50%)',
        }}
      />
      {/* Líneas de cancha sutiles */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(transparent 50%, rgba(255,255,255,0.06) 50.5%, transparent 51%), linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,0.04) 50%, transparent 50.5%)',
          backgroundSize: '100% 120px, 120px 100%',
        }}
      />

      <div className="max-w-md mx-auto px-6 pt-10 pb-12 flex flex-col items-center">
        {/* Header con logo */}
        <Logo size={36} priority />

        <p className="text-[10px] uppercase tracking-[0.28em] text-accent font-bold mt-12">
          El Mundial llega
        </p>
        <h1
          className="font-display text-5xl sm:text-6xl text-center mt-2 leading-[0.85] uppercase"
          style={{ letterSpacing: '-0.01em' }}
        >
          Predice.<br />Compite.<br />
          <span className="text-accent">Gana.</span>
        </h1>

        {/* Premios garantizados + mención patrocinadores */}
        <div className="mt-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur border border-white/10 text-center">
          <p className="text-xs">
            <span className="text-zinc-400">Premios garantizados:</span>{' '}
            <span className="font-display text-accent tabular-nums">{guaranteedPrizes}</span>
          </p>
        </div>
        <p className="text-[11px] text-zinc-400 mt-3 text-center max-w-xs">
          + más premios todas las semanas de nuestros patrocinadores
        </p>

        {/* Card del form */}
        <div className="mt-6 w-full rounded-2xl bg-ink/95 backdrop-blur-md border border-zinc-800 p-5">
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
            <Input name="phone" type="tel" inputMode="tel" placeholder="+34 600 000 000" autoComplete="tel" maxLength={20} />
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
              <p className="text-xs text-muted">
                Espacio para tus patrocinadores
              </p>
              <p className="text-[10px] text-muted mt-1">
                El admin añade logos desde <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300">/admin/sponsors</code> (próximamente)
              </p>
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
