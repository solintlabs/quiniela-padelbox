/**
 * Estado del cierre de inscripciones.
 *
 * El admin configura `Rules.inscriptionsCloseAt`. Si es null, las inscripciones
 * quedan siempre abiertas. Una vez pasada esa fecha:
 *  - No se aceptan registros de nuevos emails (web ni móvil).
 *  - El admin no puede marcar usuarios como pagados.
 *  - La página de inscripción muestra mensaje de cierre.
 *
 * Las cuentas YA existentes mantienen su estado intacto, y las predicciones
 * siguen su lifecycle normal (lock por partido individual).
 */

export interface InscriptionsStatus {
  closeAt: Date | null;
  closed: boolean;
  /** Milisegundos hasta el cierre (negativo si ya pasó). null si no hay fecha. */
  msUntilClose: number | null;
}

export function getInscriptionsStatus(
  closeAt: Date | null | undefined,
  now: Date = new Date(),
): InscriptionsStatus {
  if (!closeAt) {
    return { closeAt: null, closed: false, msUntilClose: null };
  }
  const ms = closeAt.getTime() - now.getTime();
  return {
    closeAt,
    closed: ms <= 0,
    msUntilClose: ms,
  };
}
