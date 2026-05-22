// Cuentas especiales con bypass de OTP — solo para reviewers (Apple/Google)
// y para que el equipo pueda demostrar el flujo de borrar cuenta en vídeo.
//
// Sin este bypass, el reviewer no puede entrar (la app exige magic-link al email)
// y rechaza la submission por "incomplete information".
//
// Comportamiento de cada email en la lista:
// - request: no envia email, guarda el codigo fijo en BD (no consume Resend)
// - verify : acepta ese codigo fijo y marca hasPaid=true automaticamente
// - sin rate limit, sin chequeo de "inscripciones cerradas"
//
// ⚠️ Mantener corta la lista. Cualquier email aquí dentro es una puerta
// trasera de auth — solo cuentas controladas por el equipo.

export const APPLE_REVIEW_EMAIL = 'apple-review@solint.cloud';
export const APPLE_REVIEW_CODE = '123456';

/** Emails con bypass de OTP. Todos comparten el mismo código fijo. */
const DEMO_BYPASS_EMAILS: ReadonlySet<string> = new Set([
  APPLE_REVIEW_EMAIL,
  'demo@solint.cloud', // cuenta de prueba para demos / grabar video de delete account
]);

export function isAppleReviewEmail(email: string): boolean {
  return DEMO_BYPASS_EMAILS.has(email.toLowerCase());
}
