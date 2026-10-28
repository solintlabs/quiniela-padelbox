import type { CSSProperties } from 'react';

/**
 * Convierte el accentColor del tenant (#RRGGBB) a las variables que usan los
 * tokens de Tailwind (`hsl(var(--accent))`), para que TODO el UT del tenant —
 * botones, resaltados— tome su color, no el lima global. Elige además un color
 * de texto legible sobre ese acento según su luminancia.
 *
 * Se aplica como `style` en la raíz de la vista del tenant; al redefinir
 * `--accent` en ese subárbol, todo `bg-accent`/`text-accent` hereda el color.
 */
export function tenantThemeVars(hex: string | null | undefined): CSSProperties {
  const m = /^#?([0-9a-fA-F]{6})$/.exec((hex ?? '').trim());
  if (!m) return {};
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf:
        h = (gf - bf) / d + (gf < bf ? 6 : 0);
        break;
      case gf:
        h = (bf - rf) / d + 2;
        break;
      default:
        h = (rf - gf) / d + 4;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const fg = lum > 0.6 ? '0 0% 8%' : '0 0% 100%';
  return { ['--accent']: `${H} ${S}% ${L}%`, ['--accent-fg']: fg } as CSSProperties;
}
