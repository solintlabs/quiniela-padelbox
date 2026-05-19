import Link from 'next/link';
import { requireUser } from '@/lib/permissions';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { BottomQuickNav } from '@/components/BottomQuickNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <Nav isAdmin={user.role === 'ADMIN'} userEmail={user.email ?? undefined} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">
        {!user.hasPaid && <PaymentBanner />}
        {children}
        <Footer variant="app" />
      </main>
      <BottomQuickNav hasPaid={user.hasPaid} />
    </>
  );
}

function PaymentBanner() {
  return (
    <section className="mb-8 rounded-xl border-2 border-warning/50 bg-warning/10 p-5 md:p-6">
      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0" aria-hidden>
          ⚠️
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg leading-tight">
            Tu cuenta aún no está activa
          </p>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            La página funciona y puedes mirar partidos y ranking sin problema, pero{' '}
            <strong className="text-ink">no podrás enviar pronósticos</strong> hasta
            que confirmemos tu inscripción. Es muy rápido:
          </p>
          <ol className="text-sm mt-3 space-y-1 list-decimal list-inside">
            <li>Paga la cuota por cualquier método (Pago Móvil, Banesco, Zelle, Binance).</li>
            <li>Envíanos el comprobante.</li>
            <li>Tu cuenta se activa automáticamente en cuanto lo recibamos.</li>
          </ol>
          <div className="mt-4">
            <Link
              href="/inscripcion"
              className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-warning text-ink font-display tracking-tight text-sm hover:brightness-95"
            >
              Ver métodos de pago →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
