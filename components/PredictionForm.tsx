'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface PredictionFormProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  initialHome?: number | null;
  initialAway?: number | null;
  disabled?: boolean;
  disabledReason?: string;
}

const MIN = 0;
const MAX = 20;

function clamp(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(MIN, Math.min(MAX, Math.floor(n)));
}

/**
 * Formulario de pronóstico — variante A elegida (steppers ±) + soporte
 * de teclado numérico real. El usuario puede:
 *   - tocar +/− (móvil)
 *   - escribir el número con el teclado (desktop + móvil con keypad numérico)
 *   - usar flechas ↑/↓ en el input
 */
export function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  initialHome,
  initialAway,
  disabled,
  disabledReason,
}: PredictionFormProps) {
  const router = useRouter();
  const [home, setHome] = useState<number>(initialHome ?? 0);
  const [away, setAway] = useState<number>(initialAway ?? 0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    home !== (initialHome ?? -1) || away !== (initialAway ?? -1);

  async function submit() {
    if (disabled) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? body.error ?? 'No se pudo guardar');
        }
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
        <ScoreInput label={homeTeam} value={home} onChange={setHome} disabled={disabled} side="home" />
        <span className="font-display text-3xl text-muted pb-3">–</span>
        <ScoreInput label={awayTeam} value={away} onChange={setAway} disabled={disabled} side="away" />
      </div>

      {disabled && disabledReason && (
        <p className="text-sm text-muted text-center">{disabledReason}</p>
      )}

      {!disabled && (
        <div className="flex flex-col items-center gap-2">
          <Button
            type="submit"
            size="lg"
            disabled={pending || !dirty}
            className="font-display tracking-tight px-10"
          >
            {pending ? 'Guardando…' : saved && !dirty ? 'Guardado ✓' : 'Guardar pronóstico →'}
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && !dirty && !error && (
            <p className="text-sm text-success">Pronóstico guardado.</p>
          )}
        </div>
      )}
    </form>
  );
}

interface ScoreInputProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  side: 'home' | 'away';
}

function ScoreInput({ label, value, onChange, disabled, side }: ScoreInputProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <label htmlFor={`score-${side}`} className="text-xs uppercase tracking-[0.18em] text-muted text-center min-h-[2em]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Restar"
          disabled={disabled || value <= MIN}
          onClick={() => onChange(clamp(value - 1))}
          className="h-12 w-12 rounded-lg border border-line text-xl hover:bg-bg-elev disabled:opacity-30 disabled:pointer-events-none"
        >
          −
        </button>
        <input
          id={`score-${side}`}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={MIN}
          max={MAX}
          step={1}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={cn(
            'h-20 w-20 rounded-xl border bg-bg-elev text-center',
            'font-display tabular-nums text-5xl',
            'border-accent/40 bg-accent/5',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            disabled && 'opacity-60',
          )}
        />
        <button
          type="button"
          aria-label="Sumar"
          disabled={disabled || value >= MAX}
          onClick={() => onChange(clamp(value + 1))}
          className="h-12 w-12 rounded-lg border border-line text-xl hover:bg-bg-elev disabled:opacity-30 disabled:pointer-events-none"
        >
          +
        </button>
      </div>
    </div>
  );
}
