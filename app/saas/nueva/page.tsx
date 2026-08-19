import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { NuevaQuinielaForm } from './NuevaQuinielaForm';

export const metadata = {
  title: 'Crea tu quiniela · QuinielaBOX',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * /saas/nueva — alta self-service.
 *
 * El guard de SAAS_ENABLED lo aplica app/saas/layout.tsx. Aquí solo se exige
 * sesión: el organizador entra con el mismo magic link que cualquier jugador,
 * sin registro aparte.
 */
export default async function NuevaQuinielaPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/saas/nueva');

  return (
    <main className="min-h-screen bg-bg">
      <section className="max-w-xl mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">
          QuinielaBOX
        </p>
        <h1 className="font-display text-3xl sm:text-4xl mt-2">Crea tu quiniela</h1>
        <p className="text-sm text-muted mt-2">
          En tres pasos. Sin tarjeta, sin instalar nada.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-bg-elev p-6">
          <NuevaQuinielaForm />
        </div>
      </section>
    </main>
  );
}
