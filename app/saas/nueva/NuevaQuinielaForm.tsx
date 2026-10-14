'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface League {
  slug: string;
  name: string;
  abbreviation: string | null;
}

type Step = 1 | 2 | 3;

/**
 * Wizard de alta. Tres pasos y ninguno pide nada que no haga falta:
 * quien monta una quiniela para sus amigos no debería tener que rellenar
 * un formulario de quince campos.
 */
export function NuevaQuinielaForm() {
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1 — marca
  const [name, setName] = useState('');
  const [accentColor, setAccentColor] = useState('#B6FF3C');
  const [description, setDescription] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  /** Reduce el logo en el navegador (≤256px) y lo convierte a data URL:
   *  sin almacenamiento externo ni subida aparte — viaja con el alta. */
  async function onLogoFile(file: File | undefined) {
    setLogoError(null);
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
      // webp pesa menos; Safari viejo devuelve png en su lugar y también vale.
      let dataUrl = canvas.toDataURL('image/webp', 0.9);
      if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/png');
      if (dataUrl.length > 200_000) {
        setLogoError('La imagen es demasiado compleja. Prueba con un logo más simple.');
        return;
      }
      setLogoDataUrl(dataUrl);
    } catch {
      setLogoError('No se pudo leer la imagen. Usa un PNG o JPG.');
    }
  }

  // Paso 2 — competición
  const [mode, setMode] = useState<'ESPN' | 'MANUAL'>('ESPN');
  const [query, setQuery] = useState('');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [competitionName, setCompetitionName] = useState('');

  // Paso 3 — puntos
  const [pointsExact, setPointsExact] = useState(3);
  const [pointsWinner, setPointsWinner] = useState(1);
  const [pointsGoalDiff, setPointsGoalDiff] = useState(0);
  const [pointsTeamScore, setPointsTeamScore] = useState(0);
  const [pointsDrawBonus, setPointsDrawBonus] = useState(0);

  // Cuota y premios: opcionales aquí, editables después en Ajustes. Se piden
  // en el alta porque es cuando el organizador los tiene en la cabeza.
  const [entryFee, setEntryFee] = useState('');
  const [prizesText, setPrizesText] = useState('');

  async function searchLeagues(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setLeagues([]);
      return;
    }
    try {
      const res = await fetch(`/api/saas/leagues?q=${encodeURIComponent(q)}`);
      const body = await res.json();
      setLeagues(body.leagues ?? []);
    } catch {
      setLeagues([]);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const tenantRes = await fetch('/api/saas/tenants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          accentColor,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(logoDataUrl ? { logoDataUrl } : {}),
        }),
      });
      const tenant = await tenantRes.json();
      if (!tenantRes.ok) throw new Error(tenant.error ?? 'No se pudo crear tu quiniela.');

      const slug = tenant.tenant.slug as string;

      const compRes = await fetch(`/api/saas/${slug}/competitions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: competitionName || league?.name || 'Mi competición',
          provider: mode,
          espnSlug: mode === 'ESPN' ? league?.slug : undefined,
          pointsExact,
          pointsWinner,
          pointsGoalDiff,
          pointsTeamScore,
          pointsDrawBonus,
        }),
      });
      const comp = await compRes.json();

      // Cuota y premios: opcionales, se guardan aparte para no complicar el
      // alta. Si fallan no se pierde nada — se editan luego en Ajustes.
      if (entryFee.trim() || prizesText.trim()) {
        await fetch(`/api/saas/${slug}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            entryFee: entryFee.trim() || null,
            prizesText: prizesText.trim() || null,
          }),
        }).catch(() => null);
      }

      // Si falla la competición, el comercio ya existe: se manda igual al
      // panel en vez de perder el trabajo hecho.
      if (!compRes.ok) {
        window.location.href = `/saas/${slug}/panel?aviso=${encodeURIComponent(comp.error ?? '')}`;
        return;
      }

      window.location.href = `/saas/${slug}/panel?nueva=1`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo ha fallado.');
      setBusy(false);
    }
  }

  const canContinue =
    step === 1
      ? name.trim().length >= 2
      : step === 2
        ? mode === 'MANUAL' || league !== null
        : pointsExact >= pointsWinner;

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === 1 && (
        <section className="space-y-4">
          <Field label="¿Cómo se llama tu club o comercio?">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bar Manolo"
              maxLength={80}
              autoFocus
            />
          </Field>
          <Field label="Color de tu marca">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-11 w-16 rounded-lg border border-line bg-bg cursor-pointer"
              />
              <span className="font-mono text-sm text-muted">{accentColor}</span>
            </div>
          </Field>
          <Field label="Logo (opcional)">
            <div className="flex items-center gap-3">
              {logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoDataUrl}
                  alt="Tu logo"
                  className="h-14 w-14 rounded-xl object-contain border border-line bg-bg"
                />
              ) : (
                <div
                  className="h-14 w-14 rounded-xl border border-dashed border-line grid place-items-center text-lg font-display"
                  style={{ color: accentColor }}
                >
                  {name.trim().slice(0, 1).toUpperCase() || '?'}
                </div>
              )}
              <div className="space-y-1">
                <label className="inline-flex items-center h-9 px-3 rounded-lg border border-line text-sm cursor-pointer hover:bg-bg-elev">
                  {logoDataUrl ? 'Cambiar logo' : 'Subir logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => onLogoFile(e.target.files?.[0])}
                  />
                </label>
                {logoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoDataUrl(null)}
                    className="block text-xs text-muted hover:text-danger"
                  >
                    Quitar
                  </button>
                )}
                <p className="text-[11px] text-muted">
                  El escudo de tu club, tu negocio o tu peña. Tus jugadores lo verán en la
                  quiniela.
                </p>
              </div>
            </div>
            {logoError && <p className="text-xs text-danger mt-1">{logoError}</p>}
          </Field>
          <Field label="Descripción (opcional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder={'Qué es y cuánto dura. Ej: "La quiniela del Mundial 2026 del club — de junio a julio."'}
              className="w-full rounded-lg border border-line bg-bg px-3 py-2 resize-y text-sm"
            />
            <p className="text-[11px] text-muted">La verán tus jugadores al unirse.</p>
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <ModeCard
              active={mode === 'ESPN'}
              onClick={() => setMode('ESPN')}
              title="Del catálogo"
              detail="221 ligas. Los resultados se actualizan solos."
            />
            <ModeCard
              active={mode === 'MANUAL'}
              onClick={() => setMode('MANUAL')}
              title="A mano"
              detail="Tu liga del barrio. Tú pones los partidos y resultados."
            />
          </div>

          {mode === 'ESPN' ? (
            <>
              <Field label="Busca tu liga">
                <Input
                  value={query}
                  onChange={(e) => searchLeagues(e.target.value)}
                  placeholder="LaLiga, Premier, Libertadores…"
                />
              </Field>
              {leagues.length > 0 && (
                <ul className="max-h-64 overflow-y-auto rounded-lg border border-line divide-y divide-line">
                  {leagues.map((l) => (
                    <li key={l.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          setLeague(l);
                          setCompetitionName(l.name);
                        }}
                        className={
                          'w-full text-left px-3 py-2.5 text-sm hover:bg-bg-elev transition-colors ' +
                          (league?.slug === l.slug ? 'bg-accent/10 text-accent font-semibold' : '')
                        }
                      >
                        {l.name}
                        <span className="text-muted font-mono text-xs ml-2">{l.slug}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {league && (
                <p className="text-sm text-accent">Elegida: {league.name}</p>
              )}
            </>
          ) : (
            <Field label="¿Cómo se llama tu competición?">
              <Input
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="Liga del barrio 2026"
                maxLength={80}
              />
            </Field>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <p className="text-sm text-muted">
            Puedes cambiarlo cuando quieras desde tu panel.
          </p>
          <PointRow label="Marcador exacto" value={pointsExact} onChange={setPointsExact} />
          <PointRow label="Acertar el ganador" value={pointsWinner} onChange={setPointsWinner} />
          <PointRow
            label="Acertar la diferencia de goles"
            hint="Pones 2-0 y acaba 3-1"
            value={pointsGoalDiff}
            onChange={setPointsGoalDiff}
          />
          <PointRow
            label="Por cada equipo con los goles clavados"
            value={pointsTeamScore}
            onChange={setPointsTeamScore}
          />
          <PointRow
            label="Extra por clavar un empate"
            hint="Es lo más difícil de acertar"
            value={pointsDrawBonus}
            onChange={setPointsDrawBonus}
          />
          {pointsExact < pointsWinner && (
            <p className="text-sm text-danger">
              El marcador exacto no puede valer menos que acertar el ganador.
            </p>
          )}

          <div className="pt-4 border-t border-line space-y-3">
            <p className="text-sm font-semibold">Bote y premios (opcional)</p>
            <label className="block text-sm">
              <span className="text-muted">Cuota por jugador</span>
              <input
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                maxLength={120}
                placeholder="p. ej. 10 €"
                className="mt-1 w-full h-11 rounded-lg border border-line bg-bg px-3"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Premios</span>
              <textarea
                value={prizesText}
                onChange={(e) => setPrizesText(e.target.value)}
                maxLength={4000}
                rows={3}
                placeholder={'🥇 1º: 60% del bote\n🥈 2º: 30%\n🥉 3º: 10%'}
                className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 resize-y"
              />
              <span className="text-[11px] text-muted">
                Lo verán tus jugadores. Puedes dejarlo en blanco y ponerlo luego.
              </span>
            </label>
          </div>
        </section>
      )}

      {error && (
        <p className="text-sm text-danger rounded-lg border border-danger/40 bg-danger/5 p-3">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)} disabled={busy}>
            Atrás
          </Button>
        )}
        {step < 3 ? (
          <Button className="flex-1" onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canContinue}>
            Continuar
          </Button>
        ) : (
          <Button className="flex-1" onClick={submit} disabled={!canContinue || busy}>
            {busy ? 'Creando…' : 'Crear mi quiniela'}
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ['Tu marca', 'Competición', 'Puntos'];
  return (
    <ol className="flex gap-2">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const done = n < step;
        const active = n === step;
        return (
          <li key={label} className="flex-1">
            <div
              className={
                'h-1 rounded-full mb-2 ' +
                (done || active ? 'bg-accent' : 'bg-line')
              }
            />
            <span className={'text-xs ' + (active ? 'text-ink font-semibold' : 'text-muted')}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-[0.18em] text-muted">{label}</label>
      {children}
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'text-left rounded-xl border p-4 transition-colors ' +
        (active ? 'border-accent bg-accent/5' : 'border-line hover:bg-bg-elev')
      }
    >
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted mt-1">{detail}</p>
    </button>
  );
}

function PointRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-line p-3">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Quitar punto a ${label}`}
        >
          −
        </Button>
        <span className="w-10 text-center tabular-nums font-semibold">{value}</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(Math.min(100, value + 1))}
          aria-label={`Añadir punto a ${label}`}
        >
          +
        </Button>
      </div>
    </div>
  );
}
