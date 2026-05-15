interface FooterProps {
  /** Si la página es dark (login), usa estilo más sutil. */
  variant?: 'app' | 'auth';
}

/**
 * Footer global con crédito a Solintlabs.
 * Aparece en login y en toda el área autenticada.
 */
export function Footer({ variant = 'app' }: FooterProps) {
  return (
    <footer
      className={
        variant === 'auth'
          ? 'mt-12 text-center'
          : 'mt-16 pt-8 border-t border-line text-center'
      }
    >
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
