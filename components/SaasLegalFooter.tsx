import Link from 'next/link';

/**
 * Pie de página legal genérico de QuinielaBOX para toda la superficie SaaS
 * (hub, panel del organizador y vista del jugador). Da acceso siempre a los
 * términos, la privacidad y el soporte — requisito para publicar y para la app.
 */
export function SaasLegalFooter() {
  return (
    <footer className="mt-10 pt-6 border-t border-line text-center space-y-2">
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <Link href="/terms" className="hover:text-ink underline-offset-4 hover:underline">
          Términos y condiciones
        </Link>
        <Link href="/privacy" className="hover:text-ink underline-offset-4 hover:underline">
          Privacidad
        </Link>
        <Link href="/soporte" className="hover:text-ink underline-offset-4 hover:underline">
          Soporte
        </Link>
        <Link href="/account/delete" className="hover:text-ink underline-offset-4 hover:underline">
          Eliminar cuenta
        </Link>
      </nav>
      <p className="text-[11px] text-muted">
        <Link href="/" className="hover:text-accent">
          QuinielaBOX
        </Link>{' '}
        · Desarrollado por{' '}
        <a
          href="https://solint.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent underline-offset-4 hover:underline"
        >
          Solintlabs
        </a>
      </p>
    </footer>
  );
}
