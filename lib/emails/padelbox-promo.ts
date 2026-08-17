/**
 * Email promocional del club PADELBOX a los participantes de su quiniela.
 *
 * Este SÍ va con marca PADELBOX (a diferencia de los correos de la plataforma,
 * que son genéricos de QuinielaBOX): lo manda el club a su propia gente, que
 * se apuntó a la quiniela del club.
 *
 * Lleva línea de baja explícita: es un envío comercial a una lista, y sin una
 * forma clara de darse de baja se acaba en spam y se quema el dominio.
 */

interface PadelboxPromoParams {
  /** Origen para servir imágenes (logo). */
  origin: string;
  /** Precio por pista, tal cual se muestra. */
  price?: string;
  bookingUrl?: string;
  phone?: string;
}

const PALETTE = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  ink: '#0A0A0A',
  muted: '#737373',
  border: '#E5E5E5',
  accent: '#B6FF3C',
} as const;

export function buildPadelboxPromoEmail({
  origin,
  price = '$20',
  bookingUrl = 'https://padelbox.playbypoint.com',
  phone = '4246376709',
}: PadelboxPromoParams) {
  const logo = `${origin}/logos/completo-negro.png`;
  const year = new Date().getFullYear();
  const waLink = `https://wa.me/58${phone.replace(/\D/g, '').replace(/^0+/, '')}`;

  const subject = `Tu pista de pádel por ${price} · PADELBOX`;

  const text = [
    'PADELBOX',
    '',
    `Reserva tu pista por ${price}.`,
    '',
    'Ya juegas la quiniela con nosotros — ahora te toca jugar en la pista.',
    '',
    `· Pistas desde ${price}`,
    '· Club de fidelidad: suma puntos cada vez que juegas y canjéalos',
    '· Reserva en segundos, elige tu hora y listo',
    '',
    `Reserva aquí: ${bookingUrl}`,
    `WhatsApp / llamadas: ${phone}`,
    '',
    `© ${year} PADELBOX`,
    'Si no quieres recibir más promociones del club, responde a este correo con "BAJA".',
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${PALETTE.ink};">
  <div style="display:none;font-size:1px;color:${PALETTE.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Pistas desde ${price}, club de fidelidad y reserva en segundos.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:${PALETTE.card};border:1px solid ${PALETTE.border};border-radius:14px;overflow:hidden;">

        <tr><td align="center" style="padding:36px 32px 8px;">
          <img src="${logo}" alt="PADELBOX" width="160" style="display:block;height:auto;max-width:160px;" />
        </td></tr>

        <tr><td align="center" style="padding:8px 32px 0;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.muted};">
            Te esperamos en la pista
          </p>
          <h1 style="margin:0 0 14px;font-size:30px;line-height:1.12;font-weight:900;letter-spacing:-0.02em;">
            Tu pista de pádel<br />por ${price}
          </h1>
          <p style="margin:0 0 26px;font-size:16px;line-height:1.55;color:${PALETTE.muted};">
            Ya juegas la quiniela con nosotros. Ahora te toca jugar de verdad:
            reserva tu pista y vive la experiencia PADELBOX.
          </p>
        </td></tr>

        <tr><td align="center" style="padding:0 32px 8px;">
          <a href="${bookingUrl}" style="display:inline-block;padding:15px 34px;border-radius:10px;background:${PALETTE.accent};color:${PALETTE.ink};font-weight:800;font-size:16px;text-decoration:none;">
            Reservar mi pista
          </a>
        </td></tr>

        <tr><td style="padding:26px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="padding:12px 0;border-top:1px solid ${PALETTE.border};font-size:15px;line-height:1.5;">
              <strong>🎾 Pistas desde ${price}</strong><br />
              <span style="color:${PALETTE.muted};">Elige tu hora y reserva en segundos.</span>
            </td></tr>
            <tr><td style="padding:12px 0;border-top:1px solid ${PALETTE.border};font-size:15px;line-height:1.5;">
              <strong>⭐ Club de fidelidad</strong><br />
              <span style="color:${PALETTE.muted};">Suma puntos cada vez que juegas y cámbialos por beneficios del club.</span>
            </td></tr>
            <tr><td style="padding:12px 0;border-top:1px solid ${PALETTE.border};font-size:15px;line-height:1.5;">
              <strong>🏆 La experiencia PADELBOX</strong><br />
              <span style="color:${PALETTE.muted};">Torneos, quiniela, ambiente y gente con la que jugar.</span>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:26px 32px 32px;">
          <p style="margin:0 0 6px;font-size:15px;">
            ¿Dudas o quieres reservar por teléfono?
          </p>
          <p style="margin:0;font-size:17px;font-weight:700;">
            <a href="${waLink}" style="color:${PALETTE.ink};text-decoration:none;">${phone}</a>
          </p>
        </td></tr>

      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
        <tr><td align="center" style="padding:20px 24px 0;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:${PALETTE.muted};">
            © ${year} PADELBOX · <a href="${bookingUrl}" style="color:${PALETTE.muted};">padelbox.playbypoint.com</a>
          </p>
          <p style="margin:8px 0 0;font-size:11px;line-height:1.6;color:${PALETTE.muted};">
            Recibes este correo porque participas en la quiniela del club.
            Si no quieres más promociones, responde con <strong>BAJA</strong> y te sacamos de la lista.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
