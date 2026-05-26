export const metadata = {
  title: 'Política de Privacidad',
  description:
    'Cómo recopilamos, usamos y protegemos tus datos en la Quiniela PADELBOX × DELISH del Mundial 2026.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none space-y-6 leading-relaxed">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Legal</p>
        <h1 className="font-display text-4xl mt-1">Política de Privacidad</h1>
        <p className="text-sm text-muted mt-2">Última actualización: 15 de mayo de 2026</p>
      </header>

      <p className="text-sm">
        Esta política describe cómo <strong>Quiniela PADELBOX</strong> (operada por Solintlabs, S.Baldini)
        recopila, usa y protege los datos personales de los participantes inscritos en la
        quiniela del Mundial 2026 patrocinada por PADELBOX.
      </p>

      <section>
        <h2 className="font-display text-2xl mt-8">1. Qué datos recopilamos</h2>
        <ul className="text-sm text-muted space-y-1.5 mt-2 list-disc list-inside">
          <li><span className="text-ink">Email</span> — para identificarte y enviarte el enlace de acceso.</li>
          <li><span className="text-ink">Nombre o apodo</span> — visible en el ranking y pronósticos públicos.</li>
          <li><span className="text-ink">Pronósticos</span> — los marcadores que envías para cada partido.</li>
          <li><span className="text-ink">Estado de pago</span> — flag marcado por el admin tras confirmar tu inscripción.</li>
          <li><span className="text-ink">Pick de campeón</span> — si decides seleccionar al campeón del Mundial.</li>
          <li><span className="text-ink">Token de notificaciones push</span> — solo si concedes permiso de notificaciones. Identifica tu dispositivo para poder enviarte avisos. No revela tu identidad fuera de la app.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">2. Qué datos NO recopilamos</h2>
        <ul className="text-sm text-muted space-y-1.5 mt-2 list-disc list-inside">
          <li>Ubicación / GPS</li>
          <li>Contactos del teléfono</li>
          <li>Información de tarjetas o pagos (los pagos se gestionan fuera de la plataforma)</li>
          <li>Información de redes sociales</li>
          <li>Datos biométricos</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">3. Para qué usamos tus datos</h2>
        <ul className="text-sm text-muted space-y-1.5 mt-2 list-disc list-inside">
          <li>Autenticarte mediante enlace mágico o código de un solo uso.</li>
          <li>Calcular y mostrar el ranking entre los participantes.</li>
          <li>Mostrar tus pronósticos en tu perfil y, tras el cierre de cada partido, en la página pública del partido.</li>
          <li>Enviar emails transaccionales (códigos de acceso, recordatorios de cierre).</li>
          <li>Enviar notificaciones push si nos das permiso (recordatorios de partidos, cierres de pronóstico, resultados, novedades de la quiniela). Puedes desactivarlas en cualquier momento desde Ajustes &gt; Notificaciones de tu iPhone.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">4. Con quién compartimos tus datos</h2>
        <p className="text-sm text-muted mt-2">
          <strong className="text-ink">Con nadie.</strong> Tus datos no se venden, ceden ni comparten con terceros
          con fines comerciales. Únicamente los procesadores técnicos que la app necesita para funcionar:
        </p>
        <ul className="text-sm text-muted space-y-1.5 mt-2 list-disc list-inside">
          <li><span className="text-ink">Neon</span> — base de datos (servidores en UE).</li>
          <li><span className="text-ink">Vercel</span> — hosting de la aplicación.</li>
          <li><span className="text-ink">Resend</span> — envío de los emails con códigos/links de acceso.</li>
          <li><span className="text-ink">ESPN</span> — solo se consulta para obtener los resultados públicos de los partidos. No reciben información tuya.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">5. Cuánto tiempo guardamos los datos</h2>
        <p className="text-sm text-muted mt-2">
          Mientras tu cuenta esté activa. Si solicitas la baja, eliminamos tus datos en un plazo de 30 días
          (excepto registros mínimos que la normativa contable pueda exigir conservar).
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">6. Tus derechos</h2>
        <p className="text-sm text-muted mt-2">
          Bajo el RGPD tienes derecho a: acceso, rectificación, supresión, oposición, portabilidad y
          limitación del tratamiento. Para ejercerlos escribe a{' '}
          <a href="mailto:info@solint.cloud" className="text-accent underline">info@solint.cloud</a>.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">7. Seguridad</h2>
        <p className="text-sm text-muted mt-2">
          Las contraseñas no existen — usamos enlaces mágicos y códigos OTP. Las comunicaciones van
          siempre por HTTPS. Las credenciales sensibles (API keys, tokens) están encriptadas en
          reposo. Los pronósticos de otros usuarios solo se exponen tras el cierre de cada partido,
          para evitar trampas.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">8. Cookies</h2>
        <p className="text-sm text-muted mt-2">
          Solo cookies <strong className="text-ink">técnicas estrictamente necesarias</strong> (sesión).
          Sin cookies de tracking ni de terceros.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mt-8">9. Cambios en esta política</h2>
        <p className="text-sm text-muted mt-2">
          Si modificamos esta política te avisaremos por email. La versión vigente siempre estará disponible en
          esta URL.
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
