import Link from 'next/link';
import { Logo } from '@/components/Logo';

export const metadata = { title: 'Revisa tu email · Quiniela PADELBOX × DELISH' };

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md w-full">
        {/* Co-branding PADELBOX × DELISH */}
        <div className="flex items-center justify-center gap-4">
          <Logo size={36} />
          <span className="font-display text-2xl text-zinc-500 leading-none">×</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/partners/delish.svg" alt="DELISH" className="h-10 w-auto" />
        </div>

        <h1 className="font-display text-3xl mt-8">Revisa tu email</h1>
        <p className="text-sm text-muted mt-3">
          Te hemos enviado un enlace mágico para entrar. Ábrelo desde este mismo dispositivo. Caduca en 10 minutos.
        </p>
        <p className="text-xs text-muted mt-6">
          ¿No lo ves? Mira en <strong className="text-ink">spam</strong> o <strong className="text-ink">promociones</strong>.
        </p>
      </div>

      {/* Footer Solintlabs */}
      <div className="mt-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Desarrollado por</p>
        <a
          href="https://solint.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-zinc-950 border border-zinc-800 px-5 py-3 hover:border-accent/40 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/partners/solint.png" alt="Solintlabs" className="h-8 w-auto" />
        </a>
        <p className="text-[10px] text-muted mt-2">
          <a href="https://solint.cloud" target="_blank" rel="noopener noreferrer" className="hover:text-accent">
            solint.cloud
          </a>
        </p>
      </div>
    </main>
  );
}
