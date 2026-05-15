import { requireUser } from '@/lib/permissions';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <Nav isAdmin={user.role === 'ADMIN'} userEmail={user.email ?? undefined} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {!user.hasPaid && <PaymentBanner />}
        {children}
        <Footer variant="app" />
      </main>
    </>
  );
}

function PaymentBanner() {
  return (
    <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <p>
        <strong>Inscripción pendiente.</strong> Tu cuenta está creada pero aún no ha sido validada por PADELBOX.
        Puedes ver los partidos y el ranking, pero no podrás enviar pronósticos hasta que el admin marque tu pago.
      </p>
    </div>
  );
}
