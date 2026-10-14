/**
 * Marca QuinielaBOX: una "Q" (anillo + cola) con un balón de fútbol dentro.
 *
 * FUENTE ÚNICA del logo. Antes cada sitio dibujaba el suyo (la landing usaba
 * una pala de pádel que a tamaño pequeño parecía un asterisco), así que el
 * logo cambiaba de una pestaña a otra. Debe coincidir con `app/icon.svg` y con
 * el icono de la app móvil (`scripts/gen-icons.mjs`).
 *
 * El anillo y la cola usan `currentColor`; el balón es blanco con costuras del
 * color de fondo, para que se lea también en pequeño.
 */
export function BrandMark({
  className,
  ball = '#FAFAFA',
  seam = '#0A0A0A',
}: {
  className?: string;
  /** Color del balón. */
  ball?: string;
  /** Color de las costuras (debe contrastar con el balón). */
  seam?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="49" r="27" stroke="currentColor" strokeWidth="10" />
      <line
        x1="62"
        y1="61"
        x2="78"
        y2="77"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="50" cy="49" r="16" fill={ball} />
      <polygon points="50,41.2 57.41,46.58 54.58,55.3 45.42,55.3 42.59,46.58" fill={seam} />
      <g stroke={seam} strokeWidth="2" strokeLinecap="round">
        <line x1="50" y1="41.2" x2="50" y2="37.4" />
        <line x1="57.41" y1="46.58" x2="61.02" y2="45.41" />
        <line x1="54.58" y1="55.3" x2="56.81" y2="58.37" />
        <line x1="45.42" y1="55.3" x2="43.19" y2="58.37" />
        <line x1="42.59" y1="46.58" x2="38.98" y2="45.41" />
      </g>
    </svg>
  );
}
