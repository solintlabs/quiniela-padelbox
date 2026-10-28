import Link from 'next/link';

/** Aviso de inscripción pendiente (jugador sin pago confirmado). */
export function PendingBanner({ entryFee }: { entryFee: string | null }) {
  return (
    <p className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
      Tu inscripción está pendiente de confirmar por el organizador
      {entryFee ? ` (cuota: ${entryFee})` : ''}. Paga el bote y podrás pronosticar
      en cuanto la valide. Mira los detalles en{' '}
      <span className="font-semibold">Reglas</span>.
    </p>
  );
}

/** Estado cuando aún no hay competición abierta. */
export function NoCompetition({ slug, isAdmin }: { slug: string; isAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted rounded-xl border border-line p-5">
        {isAdmin
          ? 'Todavía no hay ninguna competición en esta quiniela. Ve al panel para crearla.'
          : 'El organizador todavía no ha abierto la quiniela. Vuelve en un rato.'}
      </p>
      {isAdmin && (
        <Link
          href={`/saas/${slug}/panel`}
          className="inline-flex h-11 px-5 rounded-lg bg-accent text-accent-fg font-display tracking-tight text-sm items-center"
        >
          Ir al panel →
        </Link>
      )}
    </div>
  );
}
