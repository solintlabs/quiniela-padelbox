import Link from 'next/link';
import { auth } from '@/lib/auth';
import { NuevaQuinielaForm } from './NuevaQuinielaForm';

export const metadata = {
  title: 'Crea tu quiniela gratis · QuinielaBOX',
  description:
    'Crea la quiniela de tu club, peña o grupo de amigos en tres pasos: elige competición, define los puntos y comparte el enlace. Gratis, sin tarjeta.',
  alternates: { canonical: '/saas/nueva' },
};

export const dynamic = 'force-dynamic';

/**
 * /saas/nueva — alta self-service.
 *
 * NO redirige a login cuando no hay sesión: esta página es el destino del
 * botón principal de todo el sitio, y mandar a un muro de login a quien llega
 * (incluidos los rastreadores) descalifica el sitio en la revisión de AdSense
 * y hace que el visitante se vaya sin entender qué se le ofrece. Sin sesión se
 * explica el producto y se invita a entrar; el formulario aparece al estar
 * dentro.
 */
export default async function NuevaQuinielaPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-bg">
        <section className="max-w-xl mx-auto px-6 py-12">
          <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">
            QuinielaBOX
          </p>
          <h1 className="font-display text-3xl sm:text-4xl mt-2">Crea tu quiniela</h1>
          <p className="text-sm text-muted mt-2">
            Gratis hasta 15 jugadores. Sin tarjeta y sin instalar nada.
          </p>

          <ol className="mt-8 space-y-4">
            {[
              ['Ponle nombre y color', 'El de tu club, peña o grupo. Puedes subir tu logo.'],
              ['Elige la competición', 'Del catálogo de 221 ligas, o mete los partidos a mano.'],
              ['Reparte el enlace', 'Quien entre queda apuntado y empieza a pronosticar.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-accent text-accent-fg grid place-items-center font-display shrink-0">
                  {i + 1}
                </span>
                <span>
                  <strong className="block">{t}</strong>
                  <span className="text-sm text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login?callbackUrl=/saas/nueva"
              className="inline-flex items-center h-12 px-6 rounded-lg bg-accent text-accent-fg font-display tracking-tight hover:brightness-95"
            >
              Entrar y crear la mía →
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center h-12 px-6 rounded-lg border border-line hover:bg-bg-elev"
            >
              Ver la demo primero
            </Link>
          </div>

          <p className="text-xs text-muted mt-6">
            Se entra con tu correo: te mandamos un enlace y listo, sin contraseñas.
            QuinielaBOX no gestiona dinero — el bote lo cobra y reparte el organizador.
          </p>
        </section>
      </main>
    );
  }

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
