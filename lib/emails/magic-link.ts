/**
 * Email de magic link de PADELBOX Quiniela.
 *
 * Devuelve { subject, html, text }. Cumple:
 *  - Estilos inline (Gmail/Outlook strippean <style>).
 *  - Tablas para layout (engines de email no soportan flexbox bien).
 *  - Versión texto plano como fallback obligatorio (anti-spam + accesibilidad).
 *  - Diseño LIGHT por compatibilidad cross-client (dark mode rompe en Outlook).
 *  - CTA con altura ≥44px (tap-friendly móvil).
 */

interface MagicLinkParams {
  /** URL completa al magic link (callbackUrl ya construido por NextAuth). */
  url: string;
  /** Origen para servir el logo (ej. https://quiniela-padelbox.vercel.app). */
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

export function buildMagicLinkEmail({ url, origin }: MagicLinkParams) {
  const logoUrl = `${origin}/logos/completo-negro.png`;
  const year = new Date().getFullYear();

  const subject = 'Tu enlace para entrar a la Quiniela PADELBOX';

  const text = [
    'Quiniela Mundial 2026 — PADELBOX',
    '',
    'Has solicitado entrar a la quiniela del club.',
    'Pulsa el siguiente enlace para acceder (caduca en 24 horas y solo funciona una vez):',
    '',
    url,
    '',
    'Si no fuiste tú, ignora este email — nadie podrá entrar sin este enlace.',
    '',
    `© ${year} PADELBOX Sports Club`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${PALETTE.ink};">
  <!-- preheader (texto oculto que se muestra en el inbox preview) -->
  <div style="display:none;font-size:1px;color:${PALETTE.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Tu enlace para entrar a la quiniela del Mundial. Caduca en 24 h.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:${PALETTE.card};border:1px solid ${PALETTE.border};border-radius:14px;overflow:hidden;">

          <!-- Header con logo -->
          <tr>
            <td align="center" style="padding:40px 32px 24px;">
              <img src="${logoUrl}" alt="PADELBOX" width="180" style="display:block;height:auto;max-width:180px;" />
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td align="center" style="padding:0 32px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.muted};">
                Quiniela Mundial 2026
              </p>
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;font-weight:900;letter-spacing:-0.02em;color:${PALETTE.ink};">
                Tu enlace para entrar
              </h1>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.55;color:${PALETTE.muted};">
                Has pedido acceso a la quiniela privada del club. Pulsa el botón de abajo y entrarás directo — sin contraseñas.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 32px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:10px;background:${PALETTE.accent};">
                    <a href="${escapeAttr(url)}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:800;letter-spacing:-0.01em;color:${PALETTE.accentFg};text-decoration:none;border-radius:10px;">
                      Entrar a la quiniela →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Caducidad -->
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${PALETTE.muted};">
                Este enlace caduca en <strong style="color:${PALETTE.ink};">24 horas</strong> y solo funciona una vez.
              </p>
            </td>
          </tr>

          <!-- Separador -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:${PALETTE.border};line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${PALETTE.muted};">
                ¿No funciona el botón? Copia y pega esta URL en tu navegador:
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="${escapeAttr(url)}" style="color:${PALETTE.ink};text-decoration:underline;">${escapeHtml(url)}</a>
              </p>
            </td>
          </tr>

          <!-- Aviso -->
          <tr>
            <td style="padding:16px 32px 40px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${PALETTE.muted};">
                Si no fuiste tú quien lo pidió, ignora este email — nadie podrá entrar sin este enlace.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer fuera del card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:24px 32px;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:${PALETTE.muted};letter-spacing:0.04em;">
                © ${year} PADELBOX Sports Club · Quiniela privada del club
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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string) {
  return escapeHtml(s);
}
