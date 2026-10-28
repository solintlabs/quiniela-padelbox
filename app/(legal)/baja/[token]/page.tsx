import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

/**
 * Baja de correos en un clic desde el enlace del pie de cada email.
 *
 * Sin login a propósito: quien quiere dejar de recibir correos no va a
 * iniciar sesión para conseguirlo, y ponérselo difícil es lo que hace que la
 * gente marque como spam (y eso sí quema el dominio de envío).
 *
 * La baja se aplica al abrir la página. Es aceptable porque el token es
 * secreto y de un solo usuario, y porque se ofrece deshacer ahí mismo.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preferencias de correo · QuinielaBOX',
  robots: { index: false, follow: false },
};

export default async function BajaPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { deshacer?: string };
}) {
  const user = await prisma.user.findUnique({
    where: { unsubToken: params.token },
    select: { id: true, email: true, emailOptOut: true },
  });

  if (!user) {
    return (
      <Shell title="Enlace no válido">
        <p>
          Este enlace de baja no es válido o ha caducado. Si sigues recibiendo
          correos que no quieres, escríbenos a{' '}
          <a href="mailto:info@solint.cloud">info@solint.cloud</a> y te damos de
          baja a mano.
        </p>
      </Shell>
    );
  }

  const volver = searchParams.deshacer === '1';
  await prisma.user.update({
    where: { id: user.id },
    data: volver
      ? { emailOptOut: false, emailOptOutAt: null }
      : { emailOptOut: true, emailOptOutAt: new Date() },
  });

  if (volver) {
    return (
      <Shell title="Vuelves a recibir avisos">
        <p>
          Listo. Volveremos a avisarte cuando te falten pronósticos por enviar.
        </p>
        <p className="mt-4">
          <Link href={`/baja/${params.token}`} className="underline">
            Darme de baja otra vez
          </Link>
        </p>
      </Shell>
    );
  }

  return (
    <Shell title="Ya no recibirás más avisos">
      <p>
        Hemos dado de baja a <strong>{user.email}</strong> de los correos de
        recordatorios y promociones.
      </p>
      <p className="mt-3 text-muted">
        Seguirás recibiendo solo lo imprescindible para entrar a tu cuenta (el
        enlace de acceso y el código de inicio de sesión), porque sin eso no
        podrías usar la aplicación.
      </p>
      <p className="mt-3 text-muted">
        Si tienes la aplicación instalada, puedes seguir recibiendo los avisos
        como <strong>notificaciones</strong> sin que te llegue ningún correo.
      </p>
      <p className="mt-6">
        <Link href={`/baja/${params.token}?deshacer=1`} className="underline">
          Me he equivocado, quiero seguir recibiéndolos
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <div className="max-w-xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">QuinielaBOX</p>
        <h1 className="font-display text-3xl mt-2 mb-6">{title}</h1>
        <div className="text-sm leading-relaxed">{children}</div>
        <p className="mt-10 text-xs text-muted">
          <Link href="/" className="hover:text-ink">
            Ir a QuinielaBOX
          </Link>
        </p>
      </div>
    </main>
  );
}
