/**
 * Badges para descargar la app (iOS App Store + Google Play).
 *
 * URLs configurables via env (NEXT_PUBLIC_APP_STORE_URL / NEXT_PUBLIC_PLAY_STORE_URL).
 * Si NINGUNA está seteada, no se renderiza nada (oculto hasta publicar).
 * Si solo una está seteada, se muestra solo esa.
 */
export function AppStoreBadges({ variant = 'compact' }: { variant?: 'compact' | 'hero' }) {
  const appStore = process.env.NEXT_PUBLIC_APP_STORE_URL;
  const playStore = process.env.NEXT_PUBLIC_PLAY_STORE_URL;

  if (!appStore && !playStore) return null;

  if (variant === 'hero') {
    return (
      <section className="rounded-2xl border border-accent/40 bg-accent/5 p-5 sm:p-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-accent font-bold mb-2">
          QuinielaBOX en tu móvil
        </p>
        <p className="text-sm text-muted mb-4 max-w-md mx-auto">
          Recibe notificaciones de tus partidos y predice más rápido. Misma cuenta, misma quiniela.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {appStore && <Badge href={appStore} platform="ios" />}
          {playStore && <Badge href={playStore} platform="android" />}
        </div>
      </section>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {appStore && <Badge href={appStore} platform="ios" />}
      {playStore && <Badge href={playStore} platform="android" />}
    </div>
  );
}

function Badge({ href, platform }: { href: string; platform: 'ios' | 'android' }) {
  const config = platform === 'ios'
    ? { icon: '', small: 'Descarga en', big: 'App Store' }
    : { icon: '▶', small: 'Disponible en', big: 'Google Play' };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-700 hover:bg-zinc-900 transition-colors"
    >
      <span className="text-2xl">{config.icon}</span>
      <div className="text-left leading-tight">
        <p className="text-[10px] text-zinc-400">{config.small}</p>
        <p className="text-sm font-display text-white">{config.big}</p>
      </div>
    </a>
  );
}
