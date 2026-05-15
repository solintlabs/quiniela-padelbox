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
    /** Número internacional sin '+' ni espacios */
    whatsapp: '34635171649',
    /** Mensaje pre-rellenado al abrir WhatsApp */
    whatsappPrefill: 'Quiero inscribirme en la Quiniela PADELBOX',
    instagram: '',
  },

  /** Premios — los socios los ven en el dashboard y en /inscripcion */
  prizes: [
    { place: '🥇 1er lugar', amount: '$1.500' },
    { place: '🥈 2º lugar', amount: '$500' },
    { place: '🥉 3er lugar', amount: '$300' },
  ],

  rules: {
    pointsExact: 3,
    pointsWinner: 1,
    pointsChampion: 25,
    closeMin: 15,
  },
};
