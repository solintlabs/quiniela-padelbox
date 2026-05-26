import { OnboardingForm } from './OnboardingForm';
import { Logo } from '@/components/Logo';

export const metadata = {
  title: 'Crear mi quiniela',
  description: 'Lanza la quiniela de tu club en minutos.',
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

/**
 * /onboarding — wizard placeholder para self-service tenant creation.
 *
 * ESTADO SCAFFOLD: por ahora solo crea un registro en Lead. Cuando
 * activemos Stripe y el flow completo, este endpoint:
 * 1. Crea Tenant con status=LEAD
 * 2. Redirige a Stripe Checkout
 * 3. Webhook activa Tenant → status=TRIAL
 * 4. Email con link al panel admin del nuevo tenant
 */
export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-bg">
      <header className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <Logo size={32} />
        <a href="/lanza-tu-quiniela" className="text-sm text-muted hover:text-ink">← Volver</a>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold text-center">
          Crear mi quiniela
        </p>
        <h1 className="font-display text-3xl sm:text-4xl mt-2 text-center">
          En 3 pasos
        </h1>
        <p className="text-sm text-muted text-center mt-2 max-w-md mx-auto">
          Por ahora montamos cada quiniela contigo de forma personalizada.
          Próximamente self-service con un click.
        </p>

        <div className="mt-10 rounded-2xl border border-accent/40 bg-accent/5 p-6">
          <OnboardingForm />
        </div>

        <p className="text-[11px] text-muted text-center mt-6">
          Self-service automático en desarrollo · estimado julio 2026
        </p>
      </section>
    </main>
  );
}
