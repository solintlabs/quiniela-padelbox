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
          ? 'mt-12 text-center space-y-3'
          : 'mt-16 pt-8 border-t border-line text-center space-y-3'
      }
    >
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
    </footer>
  );
}
