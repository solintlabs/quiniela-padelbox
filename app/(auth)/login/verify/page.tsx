import { Logo } from '@/components/Logo';

export const metadata = { title: 'Revisa tu email · Quiniela PADELBOX' };

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md">
        <Logo size={36} />
        <h1 className="font-display text-3xl mt-8">Revisa tu email</h1>
        <p className="text-sm text-muted mt-3">
          Te hemos enviado un enlace mágico para entrar. Ábrelo desde este mismo dispositivo. Caduca en 10 minutos.
        </p>
        <p className="text-xs text-muted mt-6">
          ¿No lo ves? Mira en spam o promociones.
        </p>
      </div>
    </main>
  );
}
