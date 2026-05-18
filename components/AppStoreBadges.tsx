/**
 * Badges para descargar la app (iOS App Store + Google Play).
 *
 * Configurable via env (NEXT_PUBLIC_APP_STORE_URL / NEXT_PUBLIC_PLAY_STORE_URL).
 * Si las URLs NO están seteadas, los badges salen igualmente pero como
 * "Próximamente" (no clickables). Cuando publiques la app, setea las env
 * vars en Vercel y se vuelven clickables automáticamente.
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
    ? { icon: '', small: 'Descarga en', big: 'App Store' }
    : { icon: '▶', small: 'Disponible en', big: 'Google Play' };

  const inner = (
    <span className="inline-flex items-center gap-3">
      <span className="text-2xl">{config.icon}</span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] text-zinc-400">
          {href ? config.small : 'Próximamente'}
        </span>
        <span className="block text-sm font-display text-white">{config.big}</span>
      </span>
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-700 hover:bg-zinc-900 transition-colors"
      >
        {inner}
      </a>
    );
  }

  // Coming soon — no clickable, opacidad reducida
  return (
    <span
      className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 opacity-60 cursor-not-allowed"
      title="Próximamente"
    >
      {inner}
    </span>
  );
}
