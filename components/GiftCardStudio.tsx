'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface SponsorOpt {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Props {
  sponsors: SponsorOpt[];
}

// Tamaño lógico de la tarjeta (ratio tarjeta de crédito) — se exporta a 2x.
const W = 1080;
const H = 640;
const SCALE = 2;

const MONTO_PRESETS = ['$5', '$10', '$15', '$20', '$25', '$50'];

/** Presets de premios en producto, según la marca elegida. */
function productPresets(name?: string): string[] {
  const n = (name ?? '').toLowerCase();
  if (n.includes('delish')) return ['1 COMBO DELISH', '1 HAMBURGUESA', '2 COMBOS DELISH'];
  if (n.includes('padel') || n.includes('solint') || !name)
    return ['1 TURNO DE PÁDEL', '1 HORA DE CANCHA', '1 CLASE DE PÁDEL'];
  return ['1 PRODUCTO', '1 COMBO', '2X1'];
}

interface Theme {
  bg: string;
  accent: string;
  ink: string;
}

/** Paleta de cada marca. Si no está mapeada, tema PADELBOX (dark + lima). */
function brandTheme(name?: string): Theme {
  const n = (name ?? '').toLowerCase();
  if (n.includes('delish')) return { bg: '#FFFFFF', accent: '#F14826', ink: '#171717' };
  return { bg: '#0A0A0A', accent: '#B6FF3C', ink: '#FAFAFA' };
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  const n = Number.parseInt(v.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Luminancia 0..1 — para decidir logo blanco/negro según el fondo. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  const n = Number.parseInt(v.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Lee la font-family real de las clases de Tailwind (next/font genera nombres internos). */
function probeFont(className: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const probe = document.createElement('span');
  probe.className = className;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || fallback;
  probe.remove();
  return family;
}

export function GiftCardStudio({ sponsors }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sponsorId, setSponsorId] = useState<string>(sponsors[0]?.id ?? '');
  const [monto, setMonto] = useState('$25');
  const [titulo, setTitulo] = useState('PREMIO SEMANAL');
  const [detalle, setDetalle] = useState('Semana 1 · Mundial 2026');
  const [ganador, setGanador] = useState('');
  const [emailLocal, setEmailLocal] = useState('');
  const [theme, setTheme] = useState<Theme>(() => brandTheme(sponsors[0]?.name));
  const [codigo, setCodigo] = useState<string | null>(null);
  const [emailedTo, setEmailedTo] = useState<string | null>(null);
  const [emitting, setEmitting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const sponsor = sponsors.find((s) => s.id === sponsorId) ?? null;

  // Al cambiar de sponsor, aplica los colores de su marca.
  function selectSponsor(id: string) {
    setSponsorId(id);
    const s = sponsors.find((x) => x.id === id) ?? null;
    setTheme(brandTheme(s?.name));
  }

  // Si cambia cualquier dato, el código emitido deja de corresponder a la
  // tarjeta visible — se invalida para forzar una nueva emisión.
  useEffect(() => {
    setCodigo(null);
    setEmailedTo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monto, titulo, detalle, ganador, sponsorId]);

  const draw = useCallback(
    async (codeOverride?: string | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const code = codeOverride !== undefined ? codeOverride : codigo;

      await document.fonts.ready;
      const display = probeFont('font-display', 'Archivo Black, sans-serif');
      const body = probeFont('font-sans', 'Inter, sans-serif');

      const lightBg = luminance(theme.bg) > 0.55;
      const brandSrc = lightBg ? '/logos/completo-negro.png' : '/logos/completo-blanco.png';

      let qrImg: HTMLImageElement | null = null;
      if (code) {
        try {
          const qrUrl = await QRCode.toDataURL(`https://quinielabox.com/gift/${code}`, {
            margin: 0,
            width: 256,
            color: { dark: '#0A0A0A', light: '#FFFFFF' },
          });
          qrImg = await loadImage(qrUrl);
        } catch {
          // sin QR — el código impreso sigue sirviendo
        }
      }

      const [logoImg, brandImg] = await Promise.all([
        sponsor?.logoUrl ? loadImage(sponsor.logoUrl) : Promise.resolve(null),
        loadImage(brandSrc),
      ]);

      ctx.save();
      ctx.scale(SCALE, SCALE);

      // Fondo
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, W, H);

      // Glow decorativo con el acento de la marca
      const glow1 = ctx.createRadialGradient(W - 120, 80, 0, W - 120, 80, 420);
      glow1.addColorStop(0, hexToRgba(theme.accent, lightBg ? 0.12 : 0.16));
      glow1.addColorStop(1, hexToRgba(theme.accent, 0));
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, W, H);
      const glow2 = ctx.createRadialGradient(80, H - 60, 0, 80, H - 60, 380);
      glow2.addColorStop(0, hexToRgba(theme.accent, lightBg ? 0.07 : 0.08));
      glow2.addColorStop(1, hexToRgba(theme.accent, 0));
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, W, H);

      // Marco redondeado tipo ticket
      const m = 28;
      ctx.strokeStyle = hexToRgba(theme.accent, 0.6);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(m, m, W - m * 2, H - m * 2, 28);
      ctx.stroke();
      ctx.strokeStyle = hexToRgba(theme.ink, 0.18);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.roundRect(m + 14, m + 14, W - (m + 14) * 2, H - (m + 14) * 2, 18);
      ctx.stroke();
      ctx.setLineDash([]);

      // Eyebrow + título
      ctx.fillStyle = theme.accent;
      ctx.font = `28px ${display}`;
      ctx.textBaseline = 'top';
      ctx.fillText('🎁 GIFT CARD', 80, 78);
      ctx.fillStyle = theme.ink;
      ctx.font = `600 22px ${body}`;
      ctx.fillText(titulo.toUpperCase(), 82, 124);

      // Logo arriba a la derecha: sponsor si hay; si no, PADELBOX.
      const topLogo = logoImg ?? brandImg;
      if (topLogo) {
        const maxH = 88;
        const maxW = 280;
        const r = Math.min(maxW / topLogo.width, maxH / topLogo.height);
        const lw = topLogo.width * r;
        const lh = topLogo.height * r;
        ctx.drawImage(topLogo, W - 80 - lw, 72, lw, lh);
      } else if (sponsor) {
        ctx.fillStyle = theme.ink;
        ctx.font = `34px ${display}`;
        ctx.textAlign = 'right';
        ctx.fillText(sponsor.name.toUpperCase(), W - 80, 84);
        ctx.textAlign = 'left';
      }

      // Premio centrado: monto ($25) o producto ("1 COMBO DELISH").
      // Si el texto es largo se parte en dos líneas balanceadas.
      ctx.fillStyle = theme.accent;
      ctx.textAlign = 'center';
      const premio = monto.trim() || '—';
      const maxTextW = W - 220;
      const fit = (t: string, start: number): number => {
        let fs = start;
        for (; fs > 30; fs -= 6) {
          ctx.font = `${fs}px ${display}`;
          if (ctx.measureText(t).width <= maxTextW) break;
        }
        return fs;
      };
      const singleFs = fit(premio, 180);
      if (singleFs >= 80 || !premio.includes(' ')) {
        ctx.font = `${singleFs}px ${display}`;
        ctx.fillText(premio, W / 2, H / 2 - singleFs / 2 - 36);
      } else {
        const words = premio.split(/\s+/);
        let best: [string, string] = [words[0], words.slice(1).join(' ')];
        let bestDiff = Infinity;
        for (let i = 1; i < words.length; i++) {
          const a = words.slice(0, i).join(' ');
          const b = words.slice(i).join(' ');
          const d = Math.abs(a.length - b.length);
          if (d < bestDiff) {
            bestDiff = d;
            best = [a, b];
          }
        }
        const fs = Math.min(fit(best[0], 96), fit(best[1], 96), 88);
        ctx.font = `${fs}px ${display}`;
        ctx.fillText(best[0], W / 2, H / 2 - fs - 44);
        ctx.fillText(best[1], W / 2, H / 2 - 36);
      }

      // Detalle bajo el premio
      ctx.fillStyle = hexToRgba(theme.ink, 0.85);
      ctx.font = `600 26px ${body}`;
      ctx.fillText(detalle, W / 2, H / 2 + 70);

      // Ganador
      if (ganador.trim()) {
        ctx.fillStyle = theme.ink;
        ctx.font = `40px ${display}`;
        ctx.fillText(`🏆 ${ganador.trim()}`, W / 2, H / 2 + 112);
      }
      ctx.textAlign = 'left';

      // ---- Zona inferior: marca, código de canje y QR ----

      // Marca abajo a la izquierda (si el sponsor ocupa arriba a la derecha)
      if (logoImg && brandImg) {
        const bh = 32;
        const bw = (brandImg.width / brandImg.height) * bh;
        ctx.drawImage(brandImg, 80, H - 96, bw, bh);
      } else {
        ctx.fillStyle = hexToRgba(theme.ink, 0.7);
        ctx.font = `18px ${display}`;
        ctx.fillText('QUINIELA PADELBOX', 80, H - 88);
      }

      // Código de canje centrado
      ctx.textAlign = 'center';
      ctx.fillStyle = hexToRgba(theme.ink, 0.55);
      ctx.font = `600 14px ${body}`;
      ctx.fillText('CÓDIGO DE CANJE', W / 2, H - 132);
      ctx.fillStyle = theme.ink;
      ctx.font = `30px ${display}`;
      ctx.fillText(code ?? 'QB-····-····', W / 2, H - 112);
      ctx.fillStyle = hexToRgba(theme.ink, 0.55);
      ctx.font = `16px ${body}`;
      ctx.fillText('Verifícala en quinielabox.com/gift', W / 2, H - 72);
      ctx.textAlign = 'left';

      // QR abajo a la derecha (caja blanca para que escanee en cualquier fondo)
      if (qrImg) {
        const box = 120;
        const pad = 9;
        const qx = W - 72 - box;
        const qy = H - 64 - box;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qx, qy, box, box, 10);
        ctx.fill();
        ctx.drawImage(qrImg, qx + pad, qy + pad, box - pad * 2, box - pad * 2);
      }

      ctx.restore();
    },
    [sponsor, monto, titulo, detalle, ganador, theme, codigo],
  );

  useEffect(() => {
    setExportError(null);
    draw();
  }, [draw]);

  function downloadPng(code?: string | null) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          setExportError('No se pudo generar la imagen.');
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
        a.download = `giftcard-${code ? safe(code) : safe(sponsor?.name ?? 'padelbox')}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    } catch {
      setExportError(
        'El logo del sponsor está alojado en otro dominio sin CORS y el navegador bloquea la descarga. Sube el logo a /public.',
      );
    }
  }

  /** Emite (registra en DB, obtiene código único) y descarga el PNG final. */
  async function emitAndDownload() {
    setExportError(null);
    setEmitting(true);
    try {
      const res = await fetch('/api/admin/giftcards', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          monto,
          titulo,
          detalle,
          sponsorName: sponsor?.name ?? 'PADELBOX',
          winnerName: ganador.trim() || undefined,
          sendTo: emailLocal.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error ?? 'No se pudo emitir la gift card');
      }
      const data = (await res.json()) as { code: string; emailed?: boolean; emailError?: string | null };
      setCodigo(data.code);
      setEmailedTo(data.emailed ? emailLocal.trim() : null);
      if (data.emailError) setExportError(`Emitida, pero el email falló: ${data.emailError}`);
      await draw(data.code);
      downloadPng(data.code);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Error al emitir');
    } finally {
      setEmitting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
      {/* Controles */}
      <div className="rounded-xl border border-line bg-bg-elev p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Patrocinador</label>
          <select
            value={sponsorId}
            onChange={(e) => selectSponsor(e.target.value)}
            className="w-full h-10 rounded-md border border-line bg-bg px-2 text-sm"
          >
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {!s.logoUrl && ' (sin logo)'}
              </option>
            ))}
            <option value="">— Sin patrocinador (solo PADELBOX) —</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Colores de la marca</label>
          <div className="flex items-center gap-3 flex-wrap">
            <ColorInput label="Fondo" value={theme.bg} onChange={(v) => setTheme((t) => ({ ...t, bg: v }))} />
            <ColorInput label="Acento" value={theme.accent} onChange={(v) => setTheme((t) => ({ ...t, accent: v }))} />
            <ColorInput label="Texto" value={theme.ink} onChange={(v) => setTheme((t) => ({ ...t, ink: v }))} />
            <button
              type="button"
              onClick={() => setTheme(brandTheme(sponsor?.name))}
              className="text-[11px] text-muted hover:text-ink underline"
            >
              Restaurar
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Monto o producto</label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {MONTO_PRESETS.map((p) => (
              <PresetChip key={p} label={p} active={monto === p} onPick={() => setMonto(p)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {productPresets(sponsor?.name).map((p) => (
              <PresetChip key={p} label={p} active={monto === p} onPick={() => setMonto(p)} />
            ))}
          </div>
          <input
            type="text"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            maxLength={40}
            placeholder="$25 · o producto: 1 COMBO DELISH, 1 TURNO DE PÁDEL…"
            className="w-full h-10 rounded-md border border-line bg-bg px-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={36}
            className="w-full h-10 rounded-md border border-line bg-bg px-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Detalle</label>
          <input
            type="text"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            maxLength={48}
            placeholder="Semana 1 · Mundial 2026"
            className="w-full h-10 rounded-md border border-line bg-bg px-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Ganador (opcional)</label>
          <input
            type="text"
            value={ganador}
            onChange={(e) => setGanador(e.target.value)}
            maxLength={32}
            placeholder="Nombre del ganador"
            className="w-full h-10 rounded-md border border-line bg-bg px-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted">Email del local (opcional)</label>
          <input
            type="email"
            value={emailLocal}
            onChange={(e) => setEmailLocal(e.target.value)}
            maxLength={120}
            placeholder="local@ejemplo.com — recibe datos + código"
            className="w-full h-10 rounded-md border border-line bg-bg px-3 text-sm"
          />
          <p className="text-[11px] text-muted">
            Al emitir, el local recibe un correo con el premio, el código y el enlace de
            verificación — así sabe qué canjear sin depender de la imagen.
          </p>
        </div>

        <button
          type="button"
          onClick={emitAndDownload}
          disabled={emitting}
          className="w-full h-11 rounded-lg bg-accent text-accent-fg font-display text-sm hover:brightness-95 disabled:opacity-60"
        >
          {emitting ? 'Emitiendo…' : '🎟 Emitir y descargar PNG'}
        </button>
        {codigo && (
          <p className="text-xs text-success">
            ✓ Emitida con código <span className="font-mono">{codigo}</span> — registrada abajo.
            {emailedTo && <> · 📧 Enviada a {emailedTo}</>}
          </p>
        )}
        {exportError && <p className="text-xs text-danger">{exportError}</p>}
        <p className="text-[11px] text-muted">
          Al emitir, la tarjeta queda registrada con un código único y un QR que apunta a{' '}
          <span className="text-ink">quinielabox.com/gift/CÓDIGO</span> — el local lo escanea y
          ve si es válida o ya fue canjeada. Exporta a {W * SCALE}×{H * SCALE}px.
        </p>
      </div>

      {/* Vista previa */}
      <div className="rounded-xl border border-line bg-bg-elev p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted mb-3">Vista previa</p>
        <canvas
          ref={canvasRef}
          width={W * SCALE}
          height={H * SCALE}
          className="w-full h-auto rounded-lg border border-line"
        />
      </div>
    </div>
  );
}

function PresetChip({ label, active, onPick }: { label: string; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={
        'px-2.5 py-1 rounded-md border text-xs tabular-nums ' +
        (active
          ? 'border-accent bg-accent/15 text-accent font-semibold'
          : 'border-line text-muted hover:text-ink')
      }
    >
      {label}
    </button>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-9 rounded border border-line bg-bg cursor-pointer"
      />
      <span className="text-[11px] text-muted">{label}</span>
    </label>
  );
}
