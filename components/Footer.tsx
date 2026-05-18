import Link from 'next/link';

interface FooterProps {
  /** Si la página es dark (login), usa estilo más sutil. */
  variant?: 'app' | 'auth';
}

/**
 * Footer global con crédito a Solintlabs + links legales.
 */
export function Footer({ variant = 'app' }: FooterProps) {
  return (
    <footer
      className={
        variant === 'auth'
          ? 'mt-6 text-center space-y-3'
          : 'mt-10 pt-6 border-t border-line text-center space-y-3'
      }
    >
      {/* Banda co-branding PADELBOX × DELISH */}
      <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-zinc-800">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">Presentado por</span>
        <span className="font-display text-base">PADELBOX</span>
        <span className="text-zinc-500 text-base">×</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/partners/delish.svg" alt="DELISH" className="h-7 w-auto" />
      </div>

      <div className="flex justify-center gap-4 text-xs text-muted">
        <Link href="/privacy" className="hover:text-ink underline-offset-4 hover:underline">
          Privacidad
        </Link>
        <Link href="/terms" className="hover:text-ink underline-offset-4 hover:underline">
          Términos
        </Link>
      </div>
      <p className="text-xs text-muted">
        Desarrollado por{' '}
        <a
          href="https://solint.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink hover:text-accent transition-colors underline-offset-4 hover:underline"
        >
          Solintlabs · S.Baldini
        </a>
      </p>
      <p className="text-[11px] text-muted">
        ¿Quieres tu propia quiniela del club o peña?{' '}
        <Link href="/lanza-tu-quiniela" className="text-accent hover:underline">
          Mira cómo →
        </Link>
      </p>
    </footer>
  );
}
