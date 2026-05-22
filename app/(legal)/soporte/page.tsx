export const metadata = { title: 'Soporte · Quiniela PADELBOX' };

export default function SoportePage() {
  return (
    <article className="prose prose-invert max-w-none space-y-6 leading-relaxed">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Ayuda</p>
        <h1 className="font-display text-4xl mt-1">Soporte</h1>
        <p className="text-sm text-muted mt-2">
          ¿Algo no funciona? ¿Tienes una duda sobre la quiniela? Escríbenos.
        </p>
      </header>

      <section className="rounded-xl border-2 border-accent/40 bg-accent/5 p-5">
        <p className="text-sm">
          <strong>Contacto directo:</strong>{' '}
          <a href="mailto:info@solint.cloud" className="text-accent underline">info@solint.cloud</a>
        </p>
        <p className="text-xs text-muted mt-2">
          Respondemos en 24-48 horas laborables. Para que podamos ayudarte mejor, incluye:
          tu email registrado, qué intentabas hacer, qué pasó, y una captura si puedes.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">Preguntas frecuentes</h2>

        <div className="space-y-5 mt-4">
          <div>
            <h3 className="font-semibold text-base">No me llega el código de acceso al email</h3>
            <p className="text-sm text-muted mt-1">
              Revisa la carpeta de spam o promociones. Si tras 5 minutos sigue sin llegar,
              espera 1 hora (límite anti-spam) y vuelve a intentarlo. Si persiste, escríbenos.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base">¿Cuándo puedo enviar pronósticos?</h3>
            <p className="text-sm text-muted mt-1">
              Cada partido cierra 15 minutos antes del kickoff. Hasta ese momento puedes
              ajustar tu pronóstico todas las veces que quieras. Después se bloquea automáticamente.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base">No puedo guardar mi pronóstico — me dice que no tengo cuenta activa</h3>
            <p className="text-sm text-muted mt-1">
              Tu cuenta necesita confirmación de pago por el organizador de la quiniela. Habla con el
              administrador para que active tu inscripción.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base">¿Cómo se calculan los puntos?</h3>
            <p className="text-sm text-muted mt-1">
              <strong>+3 puntos</strong> si aciertas el marcador exacto.{' '}
              <strong>+1 punto</strong> si solo aciertas al ganador.{' '}
              <strong>+25 puntos bonus</strong> si tu pick de campeón gana el Mundial. El cálculo
              es automático en cuanto cada partido termina.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base">¿Puedo ver los pronósticos del resto de participantes?</h3>
            <p className="text-sm text-muted mt-1">
              Sí, pero solo después de que cada partido cierre. Hasta ese momento los pronósticos
              ajenos son privados — sin trampas.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base">¿Cómo cambio mi pick de campeón?</h3>
            <p className="text-sm text-muted mt-1">
              Desde la pantalla &ldquo;Mi Cuadro&rdquo;, antes del primer pitido del Mundial. Una vez empieza
              el torneo el pick queda congelado y no se puede cambiar.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">Eliminar mi cuenta y mis datos</h2>
        <p className="text-sm text-muted mt-2">
          Para solicitar la eliminación completa de tu cuenta y los datos asociados (email,
          pronósticos, pick de campeón, historial), escribe a{' '}
          <a href="mailto:info@solint.cloud?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta" className="text-accent underline">
            info@solint.cloud
          </a>{' '}
          desde el email con el que te registraste. Procesaremos la baja en un plazo máximo
          de 30 días. Más detalle en{' '}
          <a href="/privacy" className="text-accent underline">la política de privacidad</a>.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">Idiomas</h2>
        <p className="text-sm text-muted mt-2">
          Atendemos consultas en <strong className="text-ink">español</strong>.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-bg-elev p-5 mt-10">
        <p className="text-sm">
          <strong>Operado por:</strong>{' '}
          <a href="https://solint.cloud" target="_blank" rel="noopener noreferrer" className="text-accent underline">Solintlabs</a>
          {' · '}
          <a href="mailto:info@solint.cloud" className="text-accent underline">info@solint.cloud</a>
        </p>
      </section>
    </article>
  );
}
