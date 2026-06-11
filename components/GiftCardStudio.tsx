'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [exportError, setExportError] = useState<string | null>(null);

  const sponsor = sponsors.find((s) => s.id === sponsorId) ?? null;

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    await document.fonts.ready;
    const display = probeFont('font-display', 'Archivo Black, sans-serif');
    const body = probeFont('font-sans', 'Inter, sans-serif');

    const [logoImg, brandImg] = await Promise.all([
      sponsor?.logoUrl ? loadImage(sponsor.logoUrl) : Promise.resolve(null),
      loadImage('/logos/completo-blanco.png'),
    ]);

    ctx.save();
    ctx.scale(SCALE, SCALE);

    // Fondo
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, W, H);

    // Glow decorativo de acento (dos radiales suaves)
    const glow1 = ctx.createRadialGradient(W - 120, 80, 0, W - 120, 80, 420);
    glow1.addColorStop(0, 'rgba(182,255,60,0.16)');
    glow1.addColorStop(1, 'rgba(182,255,60,0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);
    const glow2 = ctx.createRadialGradient(80, H - 60, 0, 80, H - 60, 380);
    glow2.addColorStop(0, 'rgba(182,255,60,0.08)');
    glow2.addColorStop(1, 'rgba(182,255,60,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // Marco redondeado tipo ticket
    const m = 28;
    ctx.strokeStyle = 'rgba(182,255,60,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(m, m, W - m * 2, H - m * 2, 28);
    ctx.stroke();
    // Línea punteada interior
    ctx.strokeStyle = 'rgba(250,250,250,0.18)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.roundRect(m + 14, m + 14, W - (m + 14) * 2, H - (m + 14) * 2, 18);
    ctx.stroke();
    ctx.setLineDash([]);

    // Eyebrow
    ctx.fillStyle = '#B6FF3C';
    ctx.font = `28px ${display}`;
    ctx.textBaseline = 'top';
    ctx.fillText('🎁 GIFT CARD', 80, 78);

    // Título (PREMIO SEMANAL)
    ctx.fillStyle = '#FAFAFA';
    ctx.font = `600 22px ${body}`;
    ctx.fillText(titulo.toUpperCase(), 82, 124);

    // Logo del sponsor arriba a la derecha (max 88 de alto, 280 de ancho)
    if (logoImg) {
      const maxH = 88;
      const maxW = 280;
      const r = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      const lw = logoImg.width * r;
      const lh = logoImg.height * r;
      ctx.drawImage(logoImg, W - 80 - lw, 72, lw, lh);
    } else if (sponsor) {
      ctx.fillStyle = '#FAFAFA';
      ctx.font = `34px ${display}`;
      ctx.textAlign = 'right';
      ctx.fillText(sponsor.name.toUpperCase(), W - 80, 84);
      ctx.textAlign = 'left';
    }

    // Monto gigante centrado (se encoge si es texto largo)
    ctx.fillStyle = '#B6FF3C';
    ctx.textAlign = 'center';
    let fontSize = 190;
    do {
      ctx.font = `${fontSize}px ${display}`;
      if (ctx.measureText(monto).width <= W - 200) break;
      fontSize -= 10;
    } while (fontSize > 40);
    ctx.fillText(monto, W / 2, H / 2 - fontSize / 2 - 16);

    // Detalle bajo el monto
    ctx.fillStyle = 'rgba(250,250,250,0.85)';
    ctx.font = `600 26px ${body}`;
    ctx.fillText(detalle, W / 2, H / 2 + 96);

    // Ganador
    if (ganador.trim()) {
      ctx.fillStyle = '#FAFAFA';
      ctx.font = `42px ${display}`;
      ctx.fillText(`🏆 ${ganador.trim()}`, W / 2, H / 2 + 142);
    }
    ctx.textAlign = 'left';

    // Footer: marca + dominio
    if (brandImg) {
      const bh = 34;
      const bw = (brandImg.width / brandImg.height) * bh;
      ctx.drawImage(brandImg, 80, H - 78 - bh / 2, bw, bh);
    }
    ctx.fillStyle = 'rgba(250,250,250,0.6)';
    ctx.font = `20px ${body}`;
    ctx.textAlign = 'right';
    ctx.fillText('quinielabox.com', W - 80, H - 84);
    ctx.textAlign = 'left';

    ctx.restore();
  }, [sponsor, monto, titulo, detalle, ganador]);

  useEffect(() => {
    setExportError(null);
    draw();
  }, [draw]);

  function download() {
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
        a.download = `giftcard-${safe(sponsor?.name ?? 'padelbox')}-${safe(monto) || 'premio'}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    } catch {
      setExportError(
        'El logo del sponsor está alojado en otro dominio sin CORS y el navegador bloquea la descarga. Sube el logo a /public o usa la opción sin logo.',
      );
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
            onChange={(e) => setSponsorId(e.target.value)}
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
          <label className="text-[10px] uppercase tracking-wider text-muted">Monto / premio</label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {MONTO_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMonto(p)}
                className={
                  'px-2.5 py-1 rounded-md border text-xs tabular-nums ' +
                  (monto === p
                    ? 'border-accent bg-accent/15 text-accent font-semibold'
                    : 'border-line text-muted hover:text-ink')
                }
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            maxLength={28}
            placeholder="$25 · o texto: COMBO DELISH"
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

        <button
          type="button"
          onClick={download}
          className="w-full h-11 rounded-lg bg-accent text-accent-fg font-display text-sm hover:brightness-95"
        >
          ⬇ Descargar PNG
        </button>
        {exportError && <p className="text-xs text-danger">{exportError}</p>}
        <p className="text-[11px] text-muted">
          Se exporta a {W * SCALE}×{H * SCALE}px — nítida para WhatsApp e Instagram.
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
