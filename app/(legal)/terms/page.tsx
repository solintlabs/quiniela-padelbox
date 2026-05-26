export const metadata = {
  title: 'Términos de Uso',
  description:
    'Condiciones de uso de la Quiniela PADELBOX × DELISH del Mundial 2026: participación, premios, sistema de puntos y reglas.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <article className="space-y-6 leading-relaxed">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Legal</p>
        <h1 className="font-display text-4xl mt-1">Términos de uso</h1>
        <p className="text-sm text-muted mt-2">Última actualización: 15 de mayo de 2026</p>
      </header>

      <section>
        <h2 className="font-display text-2xl mt-8">1. Qué es Quiniela PADELBOX</h2>
        <p className="text-sm text-muted mt-2">
          Quiniela PADELBOX es una aplicación patrocinada por el complejo de pádel PADELBOX y
          operada técnicamente por Solintlabs. Permite a los participantes inscritos competir
          en una quiniela del Mundial de Fútbol 2026: predecir marcadores de los partidos, competir
          por puntos y optar a los premios definidos por la organización.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">2. Quién puede participar</h2>
        <p className="text-sm text-muted mt-2">
          Cualquier persona que desee inscribirse a la quiniela patrocinada por PADELBOX. Hay que ser <strong className="text-ink">mayor de edad</strong>
          y pagar la cuota única de inscripción por uno de los métodos publicados en la app.
          La cuenta queda activada únicamente tras la confirmación manual del pago por parte del admin.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">3. Reglas de la quiniela</h2>
        <p className="text-sm text-muted mt-2">
          Las reglas detalladas (puntuación, cierres, fases, ranking, desempate) están publicadas
          en{' '}
          <a href="/reglas" className="text-accent underline">/reglas</a>{' '}
          y pueden modificarse antes del primer partido. Cualquier cambio posterior se anunciará
          por email a todos los participantes.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">4. Pago y reembolsos</h2>
        <p className="text-sm text-muted mt-2">
          La cuota se paga fuera de la plataforma (Pago Móvil, Banesco, Zelle, Binance Pay).
          Una vez activada tu cuenta, <strong className="text-ink">no hay reembolsos</strong> excepto
          en caso de cancelación de la quiniela completa por causas externas (ej. suspensión
          del Mundial).
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">5. Premios</h2>
        <p className="text-sm text-muted mt-2">
          Los premios se entregan a los ganadores en el plazo de <strong className="text-ink">30 días</strong> tras la
          final del Mundial. Los importes y desglose se publican en{' '}
          <a href="/inscripcion" className="text-accent underline">/inscripcion</a>.
          La entrega se hace en PADELBOX o por transferencia, a elección del ganador.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">6. Conducta esperada</h2>
        <ul className="text-sm text-muted mt-2 space-y-1.5 list-disc list-inside">
          <li>No usar nombres o apodos ofensivos.</li>
          <li>No intentar manipular el sistema (acceder a pronósticos de otros antes del cierre, etc.).</li>
          <li>No crear cuentas duplicadas.</li>
          <li>No compartir tu enlace mágico o código con otros.</li>
        </ul>
        <p className="text-sm text-muted mt-2">
          El admin se reserva el derecho de suspender cuentas que incumplan estas normas, con
          pérdida de la cuota pagada.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">7. Disponibilidad del servicio</h2>
        <p className="text-sm text-muted mt-2">
          Hacemos lo razonable para que la app esté disponible 24/7, pero <strong className="text-ink">no se garantiza</strong>
          la disponibilidad ininterrumpida. Si la app falla durante el cierre de un partido,
          el admin podrá ampliar la ventana de pronóstico hasta resolver la incidencia.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">8. Datos y privacidad</h2>
        <p className="text-sm text-muted mt-2">
          Ver{' '}
          <a href="/privacy" className="text-accent underline">Política de Privacidad</a>{' '}
          para el detalle del tratamiento de datos personales.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">9. Limitación de responsabilidad</h2>
        <p className="text-sm text-muted mt-2">
          Quiniela PADELBOX es una actividad lúdica entre participantes. La participación no constituye
          una apuesta sujeta a regulación de juego — los premios se financian con la propia cuota
          colectiva. Solintlabs no es responsable de disputas entre participantes sobre los premios.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">10. Jurisdicción</h2>
        <p className="text-sm text-muted mt-2">
          Estos términos se rigen por la legislación aplicable al lugar de operación de PADELBOX.
          Cualquier controversia se resolverá en los tribunales correspondientes.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-bg-elev p-5 mt-10">
        <p className="text-sm">
          <strong>Contacto:</strong>{' '}
          <a href="mailto:info@solint.cloud" className="text-accent underline">info@solint.cloud</a>
          {' · '}
          <a href="https://solint.cloud" target="_blank" rel="noopener noreferrer" className="text-accent underline">solint.cloud</a>
        </p>
      </section>
    </article>
  );
}
