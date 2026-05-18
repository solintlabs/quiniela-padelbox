// Cuenta especial para la review de Apple App Store.
// Sin este bypass, el reviewer no puede entrar (la app exige magic-link al email)
// y rechaza la submission por "incomplete information".
//
// Comportamiento:
// - request: no envia email, guarda el codigo fijo en BD
// - verify : acepta ese codigo fijo y marca hasPaid=true para que pueda probar todo el flujo

export const APPLE_REVIEW_EMAIL = 'apple-review@solint.cloud';
export const APPLE_REVIEW_CODE = '123456';

export function isAppleReviewEmail(email: string): boolean {
  return email.toLowerCase() === APPLE_REVIEW_EMAIL;
}
