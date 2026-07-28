/**
 * Email "tu quiniela cierra pronto" para los jugadores de un tenant SaaS.
 * Branding neutro de QuinielaBOX con el nombre y color del club, porque cada
 * quiniela es de un cliente distinto (no lleva marca PADELBOX).
 */

interface TenantReminderParams {
  tenantName: string;
  accentColor: string;
  /** Partidos que cierran pronto, ya formateados: "España vs Italia · 20:00". */
  fixtures: string[];
  /** URL absoluta a la quiniela del jugador. */
  url: string;
}

const PALETTE = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  ink: '#0A0A0A',
  muted: '#737373',
  border: '#E5E5E5',
} as const;

export function buildTenantReminderEmail({
  tenantName,
  accentColor,
  fixtures,
  url,
}: TenantReminderParams) {
  const count = fixtures.length;
  const subject =
    count === 1
      ? `Te falta 1 pronóstico en ${tenantName}`
      : `Te faltan ${count} pronósticos en ${tenantName}`;

  const list = fixtures
    .map(
      (f) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid ${PALETTE.border};font-size:15px;color:${PALETTE.ink}">${f}</td></tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:${PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:${PALETTE.card};border:1px solid ${PALETTE.border};border-radius:14px;overflow:hidden">
    <tr><td style="padding:24px 24px 8px">
      <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:${accentColor}">${tenantName}</p>
      <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;color:${PALETTE.ink}">Tu quiniela cierra pronto</h1>
      <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:${PALETTE.muted}">
        Todavía no has pronosticado ${count === 1 ? 'este partido' : 'estos partidos'}. Si no lo haces antes del cierre, no sumas puntos.
      </p>
    </td></tr>
    <tr><td style="padding:8px 24px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${list}</table>
    </td></tr>
    <tr><td style="padding:20px 24px 26px" align="center">
      <a href="${url}" style="display:inline-block;padding:13px 26px;border-radius:10px;background:${accentColor};color:${PALETTE.ink};font-weight:700;font-size:15px;text-decoration:none">Pronosticar ahora</a>
    </td></tr>
    <tr><td style="padding:0 24px 22px" align="center">
      <p style="margin:0;font-size:11px;color:${PALETTE.muted}">Quiniela gestionada con QuinielaBOX</p>
    </td></tr>
  </table>
</body></html>`;

  const text = `${tenantName} — tu quiniela cierra pronto

Todavía no has pronosticado:
${fixtures.map((f) => `- ${f}`).join('\n')}

Pronostica aquí: ${url}`;

  return { subject, html, text };
}
