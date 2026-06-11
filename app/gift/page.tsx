import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Verificar gift card · Quiniela PADELBOX',
  robots: { index: false, follow: false },
};

async function goToCode(formData: FormData) {
  'use server';
  const code = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!code) return;
  redirect(`/gift/${encodeURIComponent(code)}`);
}

/**
 * Índice público de verificación: el local que no escanea el QR puede
 * teclear aquí el código impreso en la tarjeta.
 */
export default function GiftIndexPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10 bg-bg">
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg-elev p-6 space-y-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
          Quiniela PADELBOX · Verificación de gift card
        </p>
        <p className="text-3xl">🎁</p>
        <h1 className="font-display text-2xl">Verificar una gift card</h1>
        <p className="text-sm text-muted">
          Escribe el código impreso en la tarjeta (o escanea su QR) para comprobar que es
          auténtica y que no ha sido canjeada.
        </p>
        <form action={goToCode} className="space-y-3">
          <input
            type="text"
            name="code"
            required
            maxLength={20}
            placeholder="QB-XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            className="w-full h-12 rounded-lg border border-line bg-bg px-4 text-center font-mono text-lg tracking-widest uppercase"
          />
          <button
            type="submit"
            className="w-full h-12 rounded-lg bg-accent text-accent-fg font-display text-sm hover:brightness-95"
          >
            Verificar →
          </button>
        </form>
        <p className="text-[11px] text-muted">quinielabox.com · Quiniela PADELBOX × DELISH</p>
      </div>
    </main>
  );
}
