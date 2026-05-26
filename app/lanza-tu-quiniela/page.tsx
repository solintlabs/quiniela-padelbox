import { Logo } from '@/components/Logo';
import { LeadForm } from './LeadForm';

export const metadata = {
  title: 'Lanza tu propia quiniela para club, peña u oficina',
  description:
    'Crea la quiniela de tu club, empresa o grupo de amigos en minutos. Mundial, La Liga, Champions, Copa América — con app iOS + Android, ranking en vivo, premios y patrocinadores. Por Solintlabs.',
  alternates: { canonical: '/lanza-tu-quiniela' },
  openGraph: {
    title: 'Lanza tu propia quiniela — Club, peña, oficina · QuinielaBOX',
    description:
      'Plataforma de quinielas privadas. App móvil iOS + Android, ranking, premios, patrocinadores. La misma que usa PADELBOX × DELISH.',
    url: '/lanza-tu-quiniela',
  },
  twitter: {
    title: 'Lanza tu propia quiniela · QuinielaBOX',
    description:
      'Plataforma de quinielas privadas para clubs, peñas y oficinas. App iOS + Android incluida.',
  },
};

const jsonLdProduct = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'QuinielaBOX',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    'Plataforma SaaS para crear quinielas privadas de torneos de fútbol con ranking en vivo, app móvil iOS + Android, patrocinadores y premios semanales.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://www.quinielabox.com/lanza-tu-quiniela',
  },
  provider: {
    '@type': 'Organization',
    name: 'Solintlabs',
    url: 'https://solint.cloud',
  },
};

export default function LanzaTuQuinielaPage() {
  return (
    <main className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }}
      />
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Logo size={32} />
        <a href="/login" className="text-sm text-muted hover:text-ink">Entrar a mi quiniela →</a>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-12 pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">
          Lanza tu propia quiniela
        </p>
        <h1 className="font-display text-4xl sm:text-6xl mt-3 leading-[0.95]">
          Tu club, tu peña, tu oficina.<br />
          <span className="text-accent">Tu quiniela.</span>
        </h1>
        <p className="text-base text-muted mt-6 max-w-2xl mx-auto">
          La misma plataforma que usa <strong className="text-ink">PADELBOX × DELISH</strong> para
          el Mundial 2026. La instalamos a tu nombre, con tu logo, tus premios y tus aliados.
          <br />
          App móvil iOS + Android incluida.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 grid sm:grid-cols-3 gap-4 mb-12">
        <Feature icon="📱" title="App iOS + Android" desc="Tus socios predicen desde el móvil con notificaciones push." />
        <Feature icon="🏆" title="Cualquier torneo" desc="Mundial, La Liga, Champions, Copa América, lo que quieras." />
        <Feature icon="🎁" title="Aliados comerciales" desc="Patrocinadores premium con sus logos, productos como premios semanales." />
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-6 sm:p-8 text-center">
          <h2 className="font-display text-2xl">¿Listo para arrancar?</h2>
          <p className="text-sm text-muted mt-2 mb-6 max-w-md mx-auto">
            Rellena el form de onboarding y te contactamos en 24h con presupuesto + siguientes pasos.
          </p>
          <a
            href="/onboarding"
            className="inline-flex items-center h-12 px-8 rounded-lg bg-accent text-accent-fg font-display tracking-tight hover:brightness-95"
          >
            Quiero mi quiniela →
          </a>
        </div>

        <details className="mt-6 rounded-xl border border-line bg-bg-elev p-4">
          <summary className="cursor-pointer text-sm">¿Solo quieres preguntar algo rápido?</summary>
          <div className="mt-4">
            <LeadForm />
          </div>
        </details>

        <p className="text-xs text-muted text-center mt-6">
          ¿Ya tienes cuenta? <a href="/login" className="text-accent underline">Entra a tu quiniela →</a>
        </p>
      </section>

      {/* Sección Solintlabs — prominente, posicionamiento de marca */}
      <section className="max-w-3xl mx-auto px-6 pb-12">
        <div className="rounded-2xl border border-line bg-bg-elev p-6 sm:p-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted font-semibold">
            Esto y más lo desarrolla
          </p>
          <a
            href="https://solint.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 font-display text-2xl text-ink hover:text-accent transition-colors"
          >
            Solintlabs
            <span className="text-accent text-lg">↗</span>
          </a>
          <p className="text-sm text-muted mt-3 max-w-md mx-auto">
            Productos digitales a medida: apps móviles, dashboards, plataformas SaaS y automatizaciones para empresas y clubs.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            <a href="https://solint.cloud" target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline">
              solint.cloud
            </a>
            <a href="mailto:info@solint.cloud" className="text-xs text-muted hover:text-ink">
              info@solint.cloud
            </a>
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-muted border-t border-line">
        QuinielaBOX · Plataforma de quinielas para clubs y grupos privados
      </footer>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="font-display text-sm">{title}</p>
      <p className="text-xs text-muted mt-1">{desc}</p>
    </div>
  );
}
