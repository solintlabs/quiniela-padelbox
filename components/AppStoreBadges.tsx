/**
 * Badges para descargar la app (iOS App Store + Google Play).
 *
 * Configurable via env (NEXT_PUBLIC_APP_STORE_URL / NEXT_PUBLIC_PLAY_STORE_URL).
 * Si las URLs NO están seteadas, los badges salen igualmente pero como
 * "Próximamente" (no clickables). Cuando publiques la app, setea las env
 * vars en Vercel y se vuelven clickables automáticamente.
 *
 * Iconos como SVG inline (no dependencia de fuente del sistema para
 * la manzana, que en Windows/Linux no se renderiza).
 */

export function AppStoreBadges({ variant = 'compact' }: { variant?: 'compact' | 'hero' }) {
  const appStore = process.env.NEXT_PUBLIC_APP_STORE_URL ?? null;
  const playStore = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? null;

  if (variant === 'hero') {
    return (
      <section className="rounded-2xl border border-accent/40 bg-accent/5 p-5 sm:p-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-accent font-bold mb-2">
          QuinielaBOX en tu móvil
        </p>
        <p className="text-sm text-muted mb-4 max-w-md mx-auto">
          {appStore || playStore
            ? 'Recibe notificaciones de tus partidos y predice más rápido. Misma cuenta, misma quiniela.'
            : 'La app móvil está en camino. Recibirás push de tus partidos y podrás predecir en segundos.'}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge href={appStore} platform="ios" />
          <Badge href={playStore} platform="android" />
        </div>
      </section>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <Badge href={appStore} platform="ios" />
      <Badge href={playStore} platform="android" />
    </div>
  );
}

function Badge({ href, platform }: { href: string | null; platform: 'ios' | 'android' }) {
  const config = platform === 'ios'
    ? { small: 'Descarga en', big: 'App Store', icon: <AppleLogo /> }
    : { small: 'Disponible en', big: 'Google Play', icon: <GooglePlayLogo /> };

  const inner = (
    <span className="inline-flex items-center gap-3">
      <span className="flex items-center justify-center w-7 h-7">{config.icon}</span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] text-zinc-300 font-medium">
          {href ? config.small : 'Próximamente'}
        </span>
        <span
          className="block text-[18px] leading-none text-white font-semibold"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        >
          {config.big}
        </span>
      </span>
    </span>
  );

  const baseClass =
    'inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-black border border-zinc-700 min-w-[170px]';

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass + ' hover:border-zinc-500 transition-colors'}
      >
        {inner}
      </a>
    );
  }

  return (
    <span className={baseClass + ' opacity-60 cursor-not-allowed'} title="Próximamente">
      {inner}
    </span>
  );
}

/** Manzana Apple (blanca, oficial shape). */
function AppleLogo() {
  return (
    <svg viewBox="0 0 384 512" width="22" height="22" fill="white" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}

/** Google Play triangle (multicolor oficial). */
function GooglePlayLogo() {
  return (
    <svg viewBox="0 0 512 512" width="22" height="22" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z"
      />
      <path
        fill="#FBBC04"
        d="M104.6 499L325.3 277.7l60.1 60.1L104.6 499z"
      />
      <path
        fill="#4285F4"
        d="M504.7 256.6c0-15.8-8.6-30.5-22.5-38.5l-77.4-44.5-69.9 69.9 69.9 69.9 77.5-44.5c13.9-7.9 22.4-22.5 22.4-38.3z"
      />
      <path
        fill="#34A853"
        d="M104.6 13l280.8 161.2-60.1 60.1L104.6 13z M104.6 499l280.8-161.2-60.1-60.1L104.6 499z M104.6 13l220.7 243.3L104.6 499V13z"
      />
    </svg>
  );
}
