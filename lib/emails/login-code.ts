/**
 * Email de código numérico para login desde la app móvil.
 * Mismo estilo branded que el magic link de web, pero con código de 6 dígitos
 * en lugar de botón.
 */

interface LoginCodeParams {
  code: string;
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

export function buildLoginCodeEmail({ code, origin }: LoginCodeParams) {
  const solintLogo = `${origin}/partners/solint.png`;
  const year = new Date().getFullYear();
  const formatted = code.replace(/(\d{3})(\d{3})/, '$1 $2'); // "123 456"

  const subject = `Tu código: ${code} · QuinielaBOX`;

  const text = [
    'QuinielaBOX',
    '',
    `Tu código de acceso es: ${code}`,
    '',
    'Vuelve a la app y pégalo en la pantalla de verificación.',
    'El código caduca en 10 minutos y solo funciona una vez.',
    '',
    'Si no fuiste tú, ignora este email — nadie podrá entrar sin este código.',
    '',
    `© ${year} QuinielaBOX · hecho por Solintlabs`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>${code} · QuinielaBOX</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${PALETTE.ink};">
  <div style="display:none;font-size:1px;color:${PALETTE.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Tu código de acceso a QuinielaBOX. Caduca en 10 min.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:${PALETTE.card};border:1px solid ${PALETTE.border};border-radius:14px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:40px 32px 16px;">
              <!-- Marca QuinielaBOX (genérica: vale para cualquier cliente) -->
              <p style="margin:0;font-size:26px;font-weight:900;letter-spacing:-0.03em;color:${PALETTE.ink};">
                QUINIELA<span style="color:#7BB800;">BOX</span>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.muted};">
                Quiniela Mundial 2026
              </p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.15;font-weight:900;letter-spacing:-0.02em;color:${PALETTE.ink};">
                Tu código de acceso
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.55;color:${PALETTE.muted};">
                Vuelve a la app y pega este código en la pantalla de verificación.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <div style="display:inline-block;padding:20px 36px;background:${PALETTE.accent};border-radius:12px;">
                <span style="font-family:'Courier New',monospace;font-size:44px;font-weight:900;letter-spacing:0.18em;color:${PALETTE.accentFg};">
                  ${formatted}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${PALETTE.muted};">
                Este código caduca en <strong style="color:${PALETTE.ink};">10 minutos</strong> y solo funciona una vez.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:${PALETTE.border};line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 40px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${PALETTE.muted};">
                Si no fuiste tú quien lo pidió, ignora este email — nadie podrá entrar sin este código.
              </p>
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
              <p style="margin:8px 0 0;font-size:10px;color:${PALETTE.muted};">
                <a href="https://solint.cloud" style="color:${PALETTE.muted};text-decoration:none;">solint.cloud</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 24px;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:${PALETTE.muted};letter-spacing:0.04em;">
                © ${year} QuinielaBOX
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
