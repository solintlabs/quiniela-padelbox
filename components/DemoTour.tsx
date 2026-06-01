'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Step {
  img: string;
  step: string;
  h: string;
  p: string;
}

const STEPS: Step[] = [
  {
    img: '/demo/login.jpg',
    step: 'Paso 1 · Entrar',
    h: 'Entra en segundos',
    p: 'Pones tu email y te llega un código de 6 dígitos. Sin contraseñas que recordar.',
  },
  {
    img: '/demo/dashboard.jpg',
    step: 'Paso 2 · Tu inicio',
    h: 'El podio y el menú de abajo',
    p: 'Tu pantalla principal: el podio, tu posición y, abajo, el menú para moverte entre Inicio, Partidos, Ranking y Perfil.',
  },
  {
    img: '/demo/predecir.jpg',
    step: 'Paso 3 · Predecir',
    h: 'Rellena tu quiniela',
    p: 'En cada partido toca − y + para poner tu marcador (ej. 2-1) y guarda. Aquí arriba también eliges tu campeón. Cambias todo hasta 15 min antes.',
  },
  {
    img: '/demo/ranking.jpg',
    step: 'Paso 4 · Compite',
    h: 'Sube en el ranking',
    p: '+3 puntos si aciertas el marcador exacto, +1 si aciertas el ganador. ¡Escala posiciones!',
  },
  {
    img: '/demo/perfil.jpg',
    step: 'Paso 5 · Tu progreso',
    h: 'Tus puntos y tu PDF',
    p: 'Consulta tus puntos y aciertos. Desde aquí descargas tu quiniela en PDF para compartirla por WhatsApp.',
  },
];

const DURATION = 4500;

/**
 * Tour explicativo de cómo funciona la quiniela. Botón "Ver cómo funciona"
 * que abre un modal con un teléfono que recorre las pantallas reales,
 * auto-avanzando como un video. Usado en /login y en el dashboard.
 */
export function DemoTour({ variant = 'pill' }: { variant?: 'pill' | 'card' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm text-accent border border-accent/50 rounded-full px-4 py-2 hover:bg-accent/10 transition-colors"
        >
          <PlayIcon /> Ver cómo funciona (30s)
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border border-accent/40 bg-accent/5 p-4 flex items-center gap-3 hover:bg-accent/10 transition-colors text-left"
        >
          <span className="shrink-0 w-11 h-11 rounded-full bg-accent flex items-center justify-center">
            <PlayIcon dark />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-sm">¿Primera vez? Mira cómo funciona</span>
            <span className="block text-xs text-muted mt-0.5">Tour rápido de 30 segundos</span>
          </span>
        </button>
      )}
      {open && <DemoModal onClose={() => setOpen(false)} />}
    </>
  );
}

function DemoModal({ onClose }: { onClose: () => void }) {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const go = useCallback((i: number) => {
    setCur(((i % STEPS.length) + STEPS.length) % STEPS.length);
    startRef.current = performance.now();
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const el = now - startRef.current;
      setProgress(Math.min(100, (el / DURATION) * 100));
      if (el >= DURATION) {
        setCur((c) => (c + 1) % STEPS.length);
        startRef.current = now;
        setProgress(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, cur]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const s = STEPS[cur];

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm flex flex-col items-center gap-4 py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-0 right-0 h-9 w-9 rounded-full bg-bg-elev border border-line text-muted hover:text-ink flex items-center justify-center"
        >
          ✕
        </button>

        {/* Teléfono */}
        <div className="relative w-[260px] rounded-[34px] p-2.5 bg-black border border-zinc-800 shadow-2xl">
          <div className="relative w-full rounded-[26px] overflow-hidden bg-bg" style={{ aspectRatio: '1290/2796' }}>
            {STEPS.map((st, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={st.img}
                src={st.img}
                alt={st.h}
                className={
                  'absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ' +
                  (i === cur ? 'opacity-100' : 'opacity-0')
                }
              />
            ))}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-[260px] h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>

        {/* Caption */}
        <div className="text-center min-h-[110px] px-2">
          <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-accent-fg bg-accent px-2.5 py-0.5 rounded-full">
            {s.step}
          </span>
          <h2 className="font-display text-xl mt-2.5">{s.h}</h2>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">{s.p}</p>
        </div>

        {/* Dots */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Paso ${i + 1}`}
              onClick={() => go(i)}
              className={
                'h-2 rounded-full transition-all ' +
                (i === cur ? 'w-5 bg-accent' : 'w-2 bg-zinc-700')
              }
            />
          ))}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => go(cur - 1)}
            aria-label="Anterior"
            className="h-10 w-10 rounded-full bg-bg-elev border border-line text-ink hover:border-accent hover:text-accent"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pausar' : 'Reproducir'}
            className="h-12 w-12 rounded-full bg-accent text-accent-fg text-lg flex items-center justify-center"
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            type="button"
            onClick={() => go(cur + 1)}
            aria-label="Siguiente"
            className="h-10 w-10 rounded-full bg-bg-elev border border-line text-ink hover:border-accent hover:text-accent"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ dark }: { dark?: boolean }) {
  return (
    <span
      className={
        'inline-flex w-4 h-4 rounded-full items-center justify-center ' +
        (dark ? '' : 'bg-accent')
      }
    >
      <span
        className="block"
        style={{
          borderLeft: `7px solid ${dark ? '#0A0A0A' : '#0A0A0A'}`,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          marginLeft: 2,
        }}
      />
    </span>
  );
}
