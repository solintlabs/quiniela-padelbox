import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';

export const metadata = {
  title: 'Verificar gift card · Quiniela PADELBOX',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

/**
 * Verificación pública de gift cards — el local escanea el QR de la tarjeta
 * (o teclea el código) y ve si es auténtica y si ya fue canjeada.
 * Solo lectura: el canje lo marca el admin desde /admin/giftcards.
 */
export default async function GiftVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).trim().toUpperCase();
  const card = await prisma.giftCard.findUnique({ where: { code } });

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10 bg-bg">
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg-elev p-6 space-y-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
          Quiniela PADELBOX · Verificación de gift card
        </p>
        <p className="font-mono text-lg tracking-widest text-ink">{code}</p>

        {!card ? (
          <div className="rounded-xl border-2 border-danger/60 bg-danger/10 p-5 space-y-1">
            <p className="text-3xl">❌</p>
            <p className="font-display text-xl text-danger">CÓDIGO NO VÁLIDO</p>
            <p className="text-sm text-muted">
              Este código no existe en nuestro sistema. La tarjeta podría ser falsa —
              no la aceptes.
            </p>
          </div>
        ) : card.status === 'ACTIVE' ? (
          <div className="rounded-xl border-2 border-success/60 bg-success/10 p-5 space-y-2">
            <p className="text-3xl">✅</p>
            <p className="font-display text-xl text-success">GIFT CARD VÁLIDA</p>
            <p className="font-display text-4xl text-ink tabular-nums">{card.monto}</p>
            {card.sponsorName && (
              <p className="text-sm text-muted">
                Patrocina: <span className="text-ink font-semibold">{card.sponsorName}</span>
              </p>
            )}
            {card.winnerName && (
              <p className="text-sm text-muted">
                Ganador: <span className="text-ink font-semibold">{card.winnerName}</span>
              </p>
            )}
            <p className="text-xs text-muted">Emitida el {formatDateTime(card.createdAt)}</p>
            <p className="text-xs text-warning border-t border-success/20 pt-2 mt-2">
              ⚠ Válida para UN solo canje. Tras entregar el premio, avisa al organizador
              para que la marque como canjeada.
            </p>
          </div>
        ) : card.status === 'REDEEMED' ? (
          <div className="rounded-xl border-2 border-warning/60 bg-warning/10 p-5 space-y-1">
            <p className="text-3xl">🟠</p>
            <p className="font-display text-xl text-warning">YA FUE CANJEADA</p>
            <p className="text-sm text-muted">
              Esta gift card de <span className="text-ink font-semibold">{card.monto}</span> ya
              se usó{card.redeemedAt ? ` el ${formatDateTime(card.redeemedAt)}` : ''}. No debe
              aceptarse de nuevo.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-danger/60 bg-danger/10 p-5 space-y-1">
            <p className="text-3xl">🚫</p>
            <p className="font-display text-xl text-danger">ANULADA</p>
            <p className="text-sm text-muted">
              Esta gift card fue anulada por el organizador y no es canjeable.
            </p>
          </div>
        )}

        <p className="text-[11px] text-muted">
          quinielabox.com · Quiniela PADELBOX × DELISH
        </p>
      </div>
    </main>
  );
}
