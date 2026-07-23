import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata = {
  title: 'Mis quinielas',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

interface Quiniela {
  name: string;
  href: string;
  color: string;
  tag: string;
}

/**
 * Hub post-login. Reúne TODAS las quinielas del usuario:
 *  - PADELBOX (sistema monolítico) si es participante.
 *  - Cada tenant SaaS donde tiene membresía.
 * Si solo hay una, salta directo. Si hay varias, deja elegir. Si no hay, ofrece
 * crear o unirse. Los enlaces de invitación llevan a su quiniela sin pasar por aquí.
 */
export default async function MisQuinielasPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/mis-quinielas');
  const userId = session.user.id;

  const [padelUser, tenants] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasPaid: true,
        championPick: true,
        role: true,
        _count: { select: { predictions: true } },
      },
    }),
    prisma.tenant.findMany({
      where: { memberships: { some: { userId } } },
      select: { slug: true, name: true, accentColor: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // ¿Participa en PADELBOX? (heurística: tiene datos reales ahí)
  const inPadelbox =
    !!padelUser &&
    (padelUser.hasPaid ||
      !!padelUser.championPick ||
      padelUser._count.predictions > 0 ||
      padelUser.role === 'ADMIN');

  const quinielas: Quiniela[] = [];
  if (inPadelbox) {
    quinielas.push({
      name: 'Quiniela PADELBOX',
      href: '/mi-quiniela',
      color: '#B6FF3C',
      tag: 'Mundial 2026',
    });
  }
  for (const t of tenants) {
    quinielas.push({
      name: t.name,
      href: `/saas/${t.slug}`,
      color: t.accentColor,
      tag: 'Tu quiniela',
    });
  }

  // El hub siempre se muestra: el usuario ve sus quinielas Y tiene el botón de
  // crear una nueva. (Antes saltaba directo con una sola y ocultaba el "crear".)
  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-14">
        <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">QuinielaBOX</p>
        <h1 className="font-display text-3xl sm:text-4xl mt-2">
          {quinielas.length ? 'Tus quinielas' : '¡Bienvenido!'}
        </h1>

        {quinielas.length > 0 ? (
          <>
            <p className="text-sm text-muted mt-2">Elige a cuál quieres entrar.</p>
            <div className="mt-8 grid gap-3">
              {quinielas.map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="group flex items-center gap-4 rounded-2xl border border-line bg-bg-elev p-5 hover:border-accent transition-colors"
                >
                  <span
                    className="w-11 h-11 rounded-xl shrink-0 grid place-items-center font-display text-lg"
                    style={{ backgroundColor: `${q.color}22`, color: q.color }}
                  >
                    {q.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg leading-tight">{q.name}</span>
                    <span className="block text-xs text-muted mt-0.5">{q.tag}</span>
                  </span>
                  <span className="text-muted group-hover:text-accent transition-colors">→</span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted mt-2 max-w-md">
            Todavía no estás en ninguna quiniela. Crea la tuya o entra a una con el enlace de
            invitación que te pasaron.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/saas/nueva"
            className="inline-flex items-center h-11 px-5 rounded-lg bg-accent text-accent-fg font-display tracking-tight text-sm hover:brightness-95"
          >
            Crear una quiniela →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center h-11 px-5 rounded-lg border border-line text-sm hover:bg-bg-elev"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
