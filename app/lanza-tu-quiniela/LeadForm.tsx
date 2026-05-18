'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      const expectedSizeRaw = fd.get('expectedSize');
      const payload = {
        email: String(fd.get('email') ?? '').trim().toLowerCase(),
        name: String(fd.get('name') ?? '').trim() || undefined,
        clubName: String(fd.get('clubName') ?? '').trim() || undefined,
        phone: String(fd.get('phone') ?? '').trim() || undefined,
        expectedSize: expectedSizeRaw ? Number(expectedSizeRaw) : undefined,
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <p className="text-3xl mb-2">✓</p>
        <p className="font-display text-lg">¡Recibido!</p>
        <p className="text-sm text-muted mt-2">
          Te escribimos en menos de 24h al email que diste.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input name="name" placeholder="Tu nombre" autoComplete="name" />
        <Input name="email" type="email" placeholder="Tu email *" required autoComplete="email" />
      </div>
      <Input name="clubName" placeholder="Nombre del club o grupo" />
      <div className="grid sm:grid-cols-2 gap-3">
        <Input name="phone" type="tel" placeholder="WhatsApp (opcional)" autoComplete="tel" />
        <Input name="expectedSize" type="number" min={1} max={10000} placeholder="¿Cuántos socios? (aprox)" />
      </div>
      <textarea
        name="notes"
        rows={3}
        maxLength={500}
        placeholder="¿Qué torneo quieres? ¿Cuándo lo lanzas? ¿Algo especial?"
        className="w-full rounded-lg border border-line bg-bg-elev p-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="text-xs text-danger text-center">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={sending}>
        {sending ? 'Enviando…' : 'Quiero mi quiniela →'}
      </Button>
      <p className="text-[10px] text-muted text-center">
        Sin spam. Solo te contactamos por tu solicitud.
      </p>
    </form>
  );
}
