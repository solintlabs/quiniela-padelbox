'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DeleteAccountPage() {
  const [step, setStep] = useState<'info' | 'confirm' | 'done'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (res.status === 401) {
        // No autenticado → redirigir a login con mensaje
        router.push('/login?callbackUrl=/account/delete');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Error al eliminar la cuenta');
      }
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="text-xs text-muted hover:text-ink mb-8 inline-block">
          ← Volver al inicio
        </Link>

        {step === 'done' ? (
          <div className="rounded-xl border border-line bg-bg-elev p-8 text-center space-y-4">
            <p className="text-4xl">✓</p>
            <h1 className="font-display text-2xl">Cuenta eliminada</h1>
            <p className="text-sm text-muted">
              Tu cuenta y todos tus datos han sido eliminados permanentemente.
              Ya no puedes iniciar sesión con este email.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 text-sm text-accent underline"
            >
              Volver al inicio
            </Link>
          </div>
        ) : step === 'confirm' ? (
          <div className="rounded-xl border border-danger bg-bg-elev p-8 space-y-6">
            <h1 className="font-display text-2xl text-danger">¿Estás seguro?</h1>
            <p className="text-sm text-muted leading-relaxed">
              Esta acción es <strong className="text-ink">irreversible</strong>. Se eliminarán permanentemente:
            </p>
            <ul className="text-sm text-muted space-y-1 list-disc list-inside">
              <li>Tu perfil (nombre, email, teléfono)</li>
              <li>Todos tus pronósticos</li>
              <li>Tu sesión activa</li>
              <li>Tus dispositivos push registrados</li>
            </ul>
            {error && (
              <p className="text-sm text-danger bg-danger/10 rounded-lg px-4 py-2">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('info')}
                disabled={loading}
                className="flex-1 h-11 rounded-lg border border-line text-sm hover:border-accent hover:text-accent disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 h-11 rounded-lg bg-danger text-white text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-bg-elev p-8 space-y-6">
            <h1 className="font-display text-2xl">Eliminar mi cuenta</h1>
            <p className="text-sm text-muted leading-relaxed">
              Si eliminas tu cuenta se borrarán permanentemente todos tus datos de QuinielaBOX:
              tu perfil, tus pronósticos y tu historial.
            </p>
            <ul className="text-sm text-muted space-y-1 list-disc list-inside">
              <li>Nombre, email y teléfono</li>
              <li>Todos los pronósticos realizados</li>
              <li>Puntos y posición en el ranking</li>
              <li>Sesiones e historial de login</li>
            </ul>
            <p className="text-xs text-muted">
              Esta acción es irreversible. Para continuar debes estar identificado con tu email.
            </p>
            <button
              onClick={() => setStep('confirm')}
              className="w-full h-11 rounded-lg border border-danger text-danger text-sm font-semibold hover:bg-danger hover:text-white transition-colors"
            >
              Continuar con la eliminación
            </button>
            <p className="text-xs text-muted text-center">
              ¿Necesitas ayuda?{' '}
              <a href="mailto:info@solint.cloud" className="text-accent underline">
                info@solint.cloud
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
