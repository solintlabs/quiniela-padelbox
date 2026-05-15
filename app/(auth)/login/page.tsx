import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Entrar · Quiniela PADELBOX' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/');

  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Logo size={44} priority />
          <h1 className="font-display text-3xl mt-8">Quiniela Mundial 2026</h1>
          <p className="text-sm text-muted mt-2">
            Entra con tu email del club. Sin contraseñas.
          </p>
        </div>

        <form
          action={async (formData) => {
            'use server';
            const email = String(formData.get('email') ?? '')
              .trim()
              .toLowerCase();
            const name = String(formData.get('name') ?? '').trim();
            if (!email) return;

            // Persistimos el nombre si lo dan (primera vez) o si ya lo tenía,
            // respetamos el existente y no lo sobrescribimos.
            if (name) {
              const existing = await prisma.user.findUnique({ where: { email } });
              if (!existing) {
                await prisma.user.create({ data: { email, name } });
              } else if (!existing.name) {
                await prisma.user.update({ where: { id: existing.id }, data: { name } });
              }
            }

            await signIn('resend', { email, redirectTo: '/' });
          }}
          className="space-y-3 mt-10"
        >
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs uppercase tracking-[0.18em] text-muted">
              Nombre
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Tu nombre o apodo"
              autoComplete="name"
              maxLength={60}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full font-display tracking-tight">
            ENVIAR ENLACE MÁGICO
          </Button>
          <p className="text-xs text-muted text-center pt-1">
            Si ya tienes cuenta, basta con el email — el nombre solo se guarda la primera vez.
          </p>
        </form>

        {hasGoogle && (
          <>
            <div className="flex items-center gap-2 my-6 text-xs text-muted">
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

        <p className="text-xs text-muted text-center mt-8">
          ¿No estás inscrito? Tu cuenta se crea sola. Después un admin de PADELBOX valida tu pago para activarte.
        </p>
      </div>

      <Footer variant="auth" />
    </main>
  );
}
