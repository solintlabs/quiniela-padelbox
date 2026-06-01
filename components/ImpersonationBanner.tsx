import { getImpersonationState, stopImpersonation } from '@/lib/impersonation';

/**
 * Banner fijo arriba cuando el admin está impersonando a un usuario.
 * Server component: lee el estado de impersonación de las cookies.
 */
export async function ImpersonationBanner() {
  const state = await getImpersonationState();
  if (!state?.active) return null;

  const label = state.targetName ?? state.targetEmail ?? 'usuario';

  return (
    <div className="sticky top-0 z-50 bg-warning text-ink">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">
          👁️ Estás viendo como <strong>{label}</strong> (modo admin)
        </span>
        <form action={stopImpersonation}>
          <button
            type="submit"
            className="shrink-0 px-3 h-8 rounded-md bg-ink text-bg text-xs font-semibold hover:opacity-90"
          >
            Volver a admin →
          </button>
        </form>
      </div>
    </div>
  );
}
