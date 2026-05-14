import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Entrar · Quiniela PADELBOX' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/');

  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
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
            const email = String(formData.get('email') ?? '').trim();
            if (!email) return;
            await signIn('resend', { email, redirectTo: '/' });
          }}
          className="space-y-3 mt-10"
        >
          <Input name="email" type="email" placeholder="tu@email.com" autoComplete="email" required />
          <Button type="submit" size="lg" className="w-full font-display tracking-tight">
            ENVIAR ENLACE MÁGICO
          </Button>
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
    </main>
  );
}
