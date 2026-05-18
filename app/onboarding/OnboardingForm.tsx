'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const TOURNAMENTS = ['Mundial 2026', 'La Liga', 'Champions', 'Copa América', 'Eurocopa', 'Otro'];

export function OnboardingForm() {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setError(null);
    try {
      const tournament = String(fd.get('tournament') ?? '').trim();
      const customTournament = String(fd.get('customTournament') ?? '').trim();
      const finalTournament = tournament === 'Otro' ? customTournament || 'Otro' : tournament;
      const expectedSizeRaw = fd.get('expectedSize');

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: String(fd.get('email') ?? '').trim().toLowerCase(),
          name: String(fd.get('name') ?? '').trim() || undefined,
          clubName: String(fd.get('clubName') ?? '').trim() || undefined,
          phone: String(fd.get('phone') ?? '').trim() || undefined,
          expectedSize: expectedSizeRaw ? Number(expectedSizeRaw) : undefined,
          notes: `Torneo: ${finalTournament}${fd.get('notes') ? '\n\n' + String(fd.get('notes')) : ''}`,
          source: 'onboarding',
        }),
      });
      if (!res.ok) throw new Error('No se pudo enviar');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">🎉</p>
        <p className="font-display text-xl">Listo</p>
        <p className="text-sm text-muted mt-2">
          Te contactamos en 24h por email para arrancar tu quiniela.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Tu nombre">
        <Input name="name" required autoComplete="name" />
      </Field>
      <Field label="Tu email *">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="WhatsApp (te contactamos por aquí)">
        <Input name="phone" type="tel" required placeholder="+58 412 555 0000" />
      </Field>

      <hr className="border-line my-2" />

      <Field label="Nombre del club / grupo *">
        <Input name="clubName" required maxLength={80} placeholder="Ej: Club Padelista del Este" />
      </Field>

      <Field label="¿Cuántos socios aproximadamente?">
        <Input name="expectedSize" type="number" min={1} max={10000} placeholder="50" />
      </Field>

      <Field label="¿Qué torneo quieres correr?">
        <select name="tournament" defaultValue="Mundial 2026" className="h-11 w-full bg-bg border border-line rounded-lg px-3 text-sm text-ink">
          {TOURNAMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="Si elegiste Otro, cuál:">
        <Input name="customTournament" placeholder="Liga del barrio, Apertura argentino, etc." />
      </Field>

      <Field label="Notas (premios, cuotas, urgencia…)">
        <textarea
          name="notes"
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border border-line bg-bg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </Field>

      {error && <p className="text-xs text-danger text-center">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={sending}>
        {sending ? 'Enviando…' : 'Solicitar mi quiniela →'}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-[0.18em] text-muted">{label}</label>
      {children}
    </div>
  );
}
