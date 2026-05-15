/**
 * Datos de contacto y pago de PADELBOX.
 * Edita aquí (un solo sitio) y se actualiza en la página /inscripcion.
 *
 * Los valores con "..." son placeholders — sustituir antes de lanzar a socios.
 */
export const CLUB_INFO = {
  name: 'PADELBOX Sports Club',

  fee: {
    amount: 10,
    currency: '$',
    description: 'Cuota única por toda la duración del Mundial',
  },

  /** Métodos de pago aceptados. Comenta o pon '' para ocultar uno. */
  payment: {
    concept: 'Quiniela Mundial 2026 - tu nombre',

    pagoMovil: {
      enabled: true,
      bank: 'Banesco',
      phone: '0412-PRUEBA',      // ← reemplazar con el número real
      ci: 'V-00.000.000',         // ← cédula del titular
      holder: 'S. Baldini',
    },

    banesco: {
      enabled: true,
      account: '0134-0000-0000-0000-0000',  // ← cuenta real Banesco
      type: 'Corriente',
      holder: 'S. Baldini',
      ci: 'V-00.000.000',
    },

    zelle: {
      enabled: true,
      email: 'sergiobaldini6@gmail.com',
      holder: 'Sergio Baldini',
    },

    binance: {
      enabled: true,
      email: 'sergiobaldini6@gmail.com',
      preferredCoin: 'USDT (red BSC o TRC20)',
    },
  },

  contact: {
    email: 'info@solint.cloud',
    /** Número internacional sin '+' ni espacios, p.ej. '584120000000' */
    whatsapp: '',
    /** Mensaje pre-rellenado al abrir WhatsApp */
    whatsappPrefill: 'Hola PADELBOX, quiero inscribirme en la quiniela del Mundial 2026.',
    instagram: '',
  },

  /** Premios — texto libre para mostrar a los socios */
  prizes: [
    'Trofeo para el campeón',
    'Cena/comida grupal en el club',
    'Material de pádel (palas, ropa, accesorios)',
  ],

  rules: {
    pointsExact: 3,
    pointsWinner: 1,
    pointsChampion: 25,
    closeMin: 15,
  },
};
