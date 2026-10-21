export const metadata = {
  title: 'Soporte y contacto · QuinielaBOX',
  description:
    'Ayuda de QuinielaBOX: acceso a tu cuenta, cierre de pronósticos, cálculo de puntos, dudas de organizador, planes y eliminación de datos.',
  alternates: { canonical: '/soporte' },
};

/** Fila de pregunta y respuesta de las FAQ. */
function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-base">{q}</h3>
      <div className="text-sm text-muted mt-1 space-y-2">{children}</div>
    </div>
  );
}

export default function SoportePage() {
  return (
    <article className="prose prose-invert max-w-none space-y-6 leading-relaxed">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Ayuda</p>
        <h1 className="font-display text-4xl mt-1">Soporte</h1>
        <p className="text-sm text-muted mt-2">
          ¿Algo no funciona? ¿Tienes una duda sobre tu quiniela? Aquí están las
          respuestas que más nos piden, y nuestro correo para lo demás.
        </p>
      </header>

      <section className="rounded-xl border-2 border-accent/40 bg-accent/5 p-5">
        <p className="text-sm">
          <strong>Contacto directo:</strong>{' '}
          <a href="mailto:info@solint.cloud" className="text-accent underline">
            info@solint.cloud
          </a>
        </p>
        <p className="text-xs text-muted mt-2">
          Respondemos en 24-48 horas laborables. Para que podamos ayudarte a la
          primera, incluye: el email con el que entras, el nombre de tu
          quiniela, qué intentabas hacer, qué pasó y una captura si puedes.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">Entrar y empezar</h2>
        <div className="space-y-5 mt-4">
          <Faq q="¿Hace falta contraseña?">
            <p>
              No. Introduces tu correo y recibes un código de acceso; lo tecleas
              y entras. No hay contraseñas que recordar ni que perder. La sesión
              queda guardada en ese dispositivo, así que normalmente solo tienes
              que hacerlo la primera vez.
            </p>
          </Faq>

          <Faq q="No me llega el código al email">
            <p>
              Revisa las carpetas de spam y promociones: es donde acaba casi
              siempre. Comprueba también que el correo esté bien escrito, sin
              espacios al final.
            </p>
            <p>
              Si aun así no llega, espera unos minutos antes de volver a pedirlo
              — hay un límite para evitar el envío masivo — y si el problema
              persiste, escríbenos y lo miramos.
            </p>
          </Faq>

          <Faq q="¿Puedo entrar con Apple o Google?">
            <p>
              Sí, desde la aplicación de iPhone puedes entrar con tu cuenta de
              Apple o de Google, además del acceso por correo. Si entras unas
              veces con un método y otras con otro, usa siempre el que tenga el
              mismo correo para no acabar con dos cuentas distintas.
            </p>
          </Faq>

          <Faq q="¿Necesito instalar la aplicación?">
            <p>
              No. QuinielaBOX funciona en el navegador del móvil o del
              ordenador. La aplicación para iPhone existe y es más cómoda para
              el día a día — sobre todo por los avisos antes del cierre — pero
              nadie de tu grupo está obligado a instalarla.
            </p>
          </Faq>

          <Faq q="Me han pasado un enlace de invitación. ¿Qué hago?">
            <p>
              Ábrelo, entra con tu correo y ya estarás dentro de esa quiniela.
              Si el enlace no funciona, pídele al organizador el código corto de
              la quiniela: desde la pantalla de inicio puedes unirte
              introduciéndolo a mano.
            </p>
          </Faq>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">Pronósticos y puntos</h2>
        <div className="space-y-5 mt-4">
          <Faq q="¿Hasta cuándo puedo enviar o cambiar un pronóstico?">
            <p>
              Hasta que el partido cierra, que es justo antes de que empiece.
              Hasta ese momento puedes cambiarlo tantas veces como quieras; solo
              cuenta lo último que hayas guardado.
            </p>
            <p>
              El cierre es automático, no depende de que el organizador se
              acuerde de hacer nada. Quien organiza puede ajustar con cuántos
              minutos de antelación se cierra.
            </p>
          </Faq>

          <Faq q="¿Cómo se calculan los puntos?">
            <p>
              El sistema más habitual da <strong>3 puntos</strong> por acertar
              el marcador exacto y <strong>1 punto</strong> por acertar solo
              quién gana (o el empate). Algunas quinielas añaden un bonus grande
              por acertar al campeón del torneo.
            </p>
            <p>
              El organizador puede cambiar cuánto vale cada acierto, así que
              consulta las reglas de tu quiniela. En la guía de{' '}
              <a href="/guias/sistemas-de-puntos" className="text-accent underline">
                sistemas de puntos
              </a>{' '}
              explicamos qué cambia con cada opción.
            </p>
          </Faq>

          <Faq q="¿Puedo ver los pronósticos de los demás?">
            <p>
              Sí, pero solo después de que el partido haya cerrado. Hasta ese
              momento los pronósticos ajenos son privados, para que nadie pueda
              copiar.
            </p>
          </Faq>

          <Faq q="El partido ha terminado y mis puntos no aparecen">
            <p>
              Los resultados entran automáticamente, pero pueden tardar un rato
              desde el pitido final. Si pasadas unas horas tu puntuación sigue
              sin reflejarse, avisa al organizador: desde su panel puede
              actualizar los resultados y recalcular la clasificación.
            </p>
          </Faq>

          <Faq q="¿Cómo se puntúan la prórroga y los penaltis?">
            <p>
              Lo habitual es puntuar el resultado de los 90 minutos, sin contar
              la prórroga ni la tanda de penaltis. Es la norma más extendida y
              la que menos discusiones genera, pero conviene que tu quiniela lo
              deje escrito en sus reglas desde el principio.
            </p>
          </Faq>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">Si organizas la quiniela</h2>
        <div className="space-y-5 mt-4">
          <Faq q="¿Cómo creo una quiniela?">
            <p>
              Entra con tu correo, pulsa «Crear mi quiniela», ponle nombre y
              elige la competición. Al terminar tendrás un enlace de invitación
              para repartir por donde ya hable tu grupo. Crear una quiniela es
              gratis.
            </p>
          </Faq>

          <Faq q="¿Puedo cambiar las reglas a mitad de torneo?">
            <p>
              Puedes, pero piénsalo dos veces: cambiar cuánto vale cada acierto
              a mitad de camino genera agravios. Si lo haces, recalcula la
              clasificación completa desde el principio para que todo el mundo
              compita bajo las mismas reglas, en vez de aplicar lo nuevo solo a
              partir de hoy.
            </p>
          </Faq>

          <Faq q="¿QuinielaBOX cobra la cuota de mi grupo?">
            <p>
              No. Si tu grupo decide poner una cuota, la recaudas y la repartes
              tú, por fuera de la plataforma. Nosotros llevamos los
              pronósticos, los puntos y la clasificación; el dinero del grupo no
              pasa por aquí en ningún momento.
            </p>
            <p>
              Sí puedes llevar la cuenta de quién ha pagado y quién no, para no
              tener que recordarlo de memoria.
            </p>
          </Faq>

          <Faq q="Alguien quiere entrar cuando el torneo ya ha empezado">
            <p>
              Puede unirse, pero entrará con los puntos de los partidos ya
              cerrados perdidos, porque nadie puede pronosticar hacia atrás.
              Decide antes de empezar si admites incorporaciones tardías y
              díselo al grupo, que es la discusión más típica.
            </p>
          </Faq>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">Planes y pagos</h2>
        <div className="space-y-5 mt-4">
          <Faq q="¿Qué incluye el plan gratuito?">
            <p>
              Permite montar una quiniela para un grupo pequeño con una
              competición a la vez, con todas las funciones de juego:
              pronósticos, cierre automático, puntos y clasificación. Muestra
              publicidad y la marca de QuinielaBOX.
            </p>
          </Faq>

          <Faq q="¿Qué añade el plan Pro?">
            <p>
              Más jugadores, varias competiciones a la vez, sin anuncios, y la
              marca, el color y el logo de tu club en lugar de los nuestros. Hay
              una modalidad de temporada con un pago único y otra mensual que
              puedes cancelar cuando quieras.
            </p>
          </Faq>

          <Faq q="¿Cómo se paga y quién puede hacerlo?">
            <p>
              El pago lo hace quien creó la quiniela, desde el panel del
              organizador, y se procesa con Stripe. QuinielaBOX no guarda los
              datos de tu tarjeta. El plan se aplica a una quiniela concreta, no
              a tu cuenta entera.
            </p>
          </Faq>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">Tu cuenta y tus datos</h2>
        <p className="text-sm text-muted mt-2">
          Puedes eliminar tu cuenta y los datos asociados —correo, pronósticos y
          participaciones— tú mismo y en cualquier momento desde{' '}
          <a href="/account/delete" className="text-accent underline">
            eliminar mi cuenta
          </a>
          , sin tener que escribirnos ni dar explicaciones. Si prefieres que lo
          hagamos nosotros, escribe a{' '}
          <a
            href="mailto:info@solint.cloud?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta"
            className="text-accent underline"
          >
            info@solint.cloud
          </a>{' '}
          desde el correo con el que te registraste. Tienes el detalle completo
          en{' '}
          <a href="/privacy" className="text-accent underline">
            la política de privacidad
          </a>
          .
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
          <a
            href="https://solint.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            Solintlabs
          </a>
          {' · '}
          <a href="mailto:info@solint.cloud" className="text-accent underline">
            info@solint.cloud
          </a>
        </p>
        <p className="text-xs text-muted mt-2">
          ¿Buscabas cómo montar la tuya? Empieza por la guía de{' '}
          <a href="/guias/como-organizar-una-quiniela" className="text-accent underline">
            cómo organizar una quiniela
          </a>
          .
        </p>
      </section>
    </article>
  );
}
