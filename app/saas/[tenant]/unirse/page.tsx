import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isSaasEnabled } from '@/lib/saas/flags';
import { resolveTenant } from '@/lib/saas/tenant';
import { getTenantMembership } from '@/lib/saas/permissions';
import { joinTenantAsPlayer, PlanLimitError } from '@/lib/saas/tenants';
import { Button } from '@/components/ui/button';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * /saas/[tenant]/unirse — el enlace que el organizador comparte.
 *
 * Apuntarse no da acceso a nada útil hasta que el organizador confirma la
 * inscripción, así que no hace falta un token secreto en la URL.
 */
export default async function UnirsePage({ params }: { params: { tenant: string } }) {
  if (!isSaasEnabled()) notFound();

  const tenant = await resolveTenant(params.tenant);
  if (!tenant) notFound();

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/saas/${tenant.slug}/unirse`)}`);
  }

  const existing = await getTenantMembership(tenant.id, session.user.id);
  if (existing) redirect(`/saas/${tenant.slug}`);

  async function join() {
    'use server';
    const inner = await auth();
    if (!inner?.user) redirect('/login');
    const t = await resolveTenant(params.tenant);
    if (!t) notFound();
    try {
      await joinTenantAsPlayer(t.id, inner.user.id);
    } catch (e) {
      if (e instanceof PlanLimitError) {
        redirect(`/saas/${t.slug}/unirse?lleno=1`);
      }
      throw e;
    }
    redirect(`/saas/${t.slug}`);
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg-elev p-8 text-center">
        <p
          className="text-xs uppercase tracking-[0.28em] font-bold"
          style={{ color: tenant.accentColor }}
        >
          {tenant.name}
        </p>
        <h1 className="font-display text-2xl mt-2">Te han invitado a la quiniela</h1>
        <p className="text-sm text-muted mt-3">
          Pronostica los partidos y compite con el resto. El organizador
          confirmará tu inscripción.
        </p>

        <form action={join} className="mt-6">
          <Button type="submit" size="lg" className="w-full">
            Apuntarme
          </Button>
        </form>
      </div>
    </main>
  );
}
