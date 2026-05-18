/**
 * Email con código de verificación para el form "lanza tu quiniela".
 * Anti-spam: solo procesamos el lead si el solicitante verifica su email.
 */

interface LeadCodeParams {
  code: string;
  origin: string;
  clubName?: string | null;
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

export function buildLeadCodeEmail({ code, origin, clubName }: LeadCodeParams) {
  const formatted = code.replace(/(\d{3})(\d{3})/, '$1 $2');
  const subject = `Tu código: ${code} · QuinielaBOX`;

  const text = [
    'QuinielaBOX',
    '',
    'Para confirmar tu solicitud de quiniela' + (clubName ? ` para ${clubName}` : '') + ',',
    'introduce este código de 6 dígitos en la web:',
    '',
    `    ${formatted}`,
    '',
    'Si tú no solicitaste nada, ignora este email — alguien escribió tu correo por error.',
    '',
    'Caduca en 10 minutos.',
    '',
    `${origin}/lanza-tu-quiniela`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${PALETTE.ink};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.bg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;background:${PALETTE.card};border:1px solid ${PALETTE.border};border-radius:14px;padding:32px;">
          <tr>
            <td>
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${PALETTE.muted};">QuinielaBOX</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">
                Confirma tu solicitud${clubName ? ` para <strong>${escapeHtml(clubName)}</strong>` : ''}
              </h1>
              <p style="margin:16px 0 24px;font-size:14px;color:${PALETTE.muted};line-height:1.6;">
                Introduce este código en la web para enviar tu petición. Esto nos ayuda a evitar bots.
              </p>
              <div style="background:${PALETTE.accent};color:${PALETTE.accentFg};border-radius:10px;padding:24px;text-align:center;">
                <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;">Tu código</p>
                <p style="margin:8px 0 0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:36px;font-weight:bold;letter-spacing:6px;">${formatted}</p>
              </div>
              <p style="margin:24px 0 0;font-size:12px;color:${PALETTE.muted};">
                Caduca en 10 minutos · Si no solicitaste nada, ignora este email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:${PALETTE.muted};">
          ${origin}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c] ?? c);
}
