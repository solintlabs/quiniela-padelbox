'use client';

import { useState } from 'react';

/**
 * Formulario de contacto de la landing. Envía un lead real a POST /api/leads
 * (rate-limited, notifica a info@solint.cloud). No abre el cliente de correo:
 * el lead se guarda en la DB aunque el visitante no tenga email configurado.
 */
export function LeadForm() {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setError(null);
    try {
      const payload = {
        email: String(fd.get('email') ?? '').trim().toLowerCase(),
        name: String(fd.get('name') ?? '').trim() || undefined,
        clubName: String(fd.get('clubName') ?? '').trim() || undefined,
        phone: String(fd.get('phone') ?? '').trim() || undefined,
        notes: String(fd.get('notes') ?? '').trim() || undefined,
        source: 'landing',
      };
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'No se pudo enviar');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="cform" style={{ textAlign: 'center', display: 'block' }}>
        <p style={{ fontSize: '2rem', margin: '0 0 .5rem' }} aria-hidden="true">✓</p>
        <h3>¡Recibido!</h3>
        <p className="small" style={{ marginTop: '.5rem' }}>
          Te escribimos en menos de 24 h al correo que nos diste.
        </p>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="f-nombre">Nombre</label>
        <input id="f-nombre" name="name" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="f-email">Email</label>
        <input id="f-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="f-club">Club o comunidad</label>
        <input id="f-club" name="clubName" />
      </div>
      <div className="field">
        <label htmlFor="f-tel">Teléfono (opcional)</label>
        <input id="f-tel" name="phone" inputMode="tel" autoComplete="tel" />
      </div>
      <div className="field full">
        <label htmlFor="f-msg">¿Qué quieres montar?</label>
        <textarea
          id="f-msg"
          name="notes"
          rows={4}
          maxLength={500}
          placeholder="Ej.: una quiniela de LaLiga para los socios del club, con premios de nuestros patrocinadores."
        />
      </div>
      <div className="cform__foot">
        <button className="btn btn--solid" type="submit" disabled={sending}>
          {sending ? 'Enviando…' : 'Enviar mensaje'}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        {error && <span className="small" style={{ color: 'hsl(var(--danger))' }}>{error}</span>}
      </div>
    </form>
  );
}
