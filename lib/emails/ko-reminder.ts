/**
 * Email recordatorio de fase eliminatoria. Se envía UNA vez por ronda cuando
 * se desbloquea (los cruces ya tienen equipos). Avisa de que en eliminatorias
 * NO hay 0-0 automático: si no rellenas, no sumas por ese partido.
 */

interface KnockoutReminderParams {
  /** Etiqueta de la ronda, ej. "los octavos de final". */
  label: string;
  origin: string;
}

const PALETTE = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  ink: '#0A0A0A',
  muted: '#737373',
  border: '#E5E5E5',
  accent: '#B6FF3C',
  accentFg: '#0A0A0A',
} as const;

export function buildKnockoutReminderEmail({ label, origin }: KnockoutReminderParams) {
  const padelboxLogo = `${origin}/logos/completo-negro.png`;
  const delishLogo = `${origin}/partners/delish.png`;
  const solintLogo = `${origin}/partners/solint.png`;
  const partidosUrl = `${origin}/partidos`;
  const year = new Date().getFullYear();
  // "los octavos de final" -> "Los octavos de final"
  const labelCap = label.charAt(0).toUpperCase() + label.slice(1);

  const subject = `⚽ Ya puedes pronosticar ${label} · Quiniela PADELBOX`;

  const text = [
    'Quiniela Mundial 2026 — PADELBOX',
    '',
    `${labelCap} ya están disponibles.`,
    '',
    'IMPORTANTE: en la fase eliminatoria NO se rellena un 0-0 automático.',
    'Si no pones tu pronóstico, ese partido no te suma puntos.',
    '',
    'Los cruces se van conociendo poco a poco — ve entrando y rellena los',
    'que ya tienen equipos; los demás aparecen conforme avanza el torneo.',
    'Cuentan los 90 minutos (sin prórroga).',
    '',
    `Entra y completa tus pronósticos: ${partidosUrl}`,
    '',
    'Recibes este email porque participas en la quiniela PADELBOX.',
    `© ${year} PADELBOX Sports Club`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>${labelCap} · Quiniela PADELBOX</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${PALETTE.ink};">
  <div style="display:none;font-size:1px;color:${PALETTE.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    En eliminatorias no hay 0-0 automático. Entra y rellena tus pronósticos.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:${PALETTE.card};border:1px solid ${PALETTE.border};border-radius:14px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:40px 32px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:14px;">
                    <img src="${padelboxLogo}" alt="PADELBOX" width="150" style="display:block;height:auto;max-width:150px;" />
                  </td>
                  <td valign="middle" style="font-size:22px;color:${PALETTE.muted};padding:0 8px;">×</td>
                  <td valign="middle" style="padding-left:14px;">
                    <img src="${delishLogo}" alt="DELISH" width="80" style="display:block;height:auto;max-width:80px;" />
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.muted};">
                Presentan la quiniela
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.muted};">
                Fase eliminatoria · Mundial 2026
              </p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.15;font-weight:900;letter-spacing:-0.02em;color:${PALETTE.ink};">
                Ya puedes pronosticar ${label}
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 8px;">
              <div style="background:#FFF4E5;border:1px solid #FFE0B2;border-radius:12px;padding:16px 20px;text-align:left;">
                <p style="margin:0;font-size:14px;line-height:1.55;color:${PALETTE.ink};">
                  <strong>Ojo:</strong> en eliminatorias <strong>no</strong> se rellena un 0-0 automático.
                  Si no pones tu pronóstico, ese partido <strong>no te suma puntos</strong>.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 8px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:${PALETTE.muted};">
                Los cruces se van conociendo poco a poco — ve entrando y rellena los que ya
                tienen equipos; los demás aparecen conforme avanza el torneo.
                ⏱️ Cuentan los <strong style="color:${PALETTE.ink};">90 minutos</strong> (sin prórroga).
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 36px;">
              <a href="${partidosUrl}" style="display:inline-block;background:${PALETTE.accent};color:${PALETTE.accentFg};text-decoration:none;font-weight:800;font-size:15px;padding:14px 32px;border-radius:10px;">
                Rellenar mis pronósticos
              </a>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:24px 32px 8px;">
              <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.muted};">
                Desarrollado por
              </p>
              <a href="https://solint.cloud" style="display:inline-block;text-decoration:none;background:#0A0A0A;padding:12px 24px;border-radius:8px;">
                <img src="${solintLogo}" alt="Solintlabs" width="140" style="display:block;height:auto;max-width:140px;" />
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 32px 24px;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:${PALETTE.muted};letter-spacing:0.04em;">
                Recibes este email porque participas en la quiniela PADELBOX.<br />
                © ${year} PADELBOX · Quiniela patrocinada
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
