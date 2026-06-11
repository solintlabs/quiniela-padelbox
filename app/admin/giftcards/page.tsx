import { prisma } from '@/lib/db';
import { GiftCardStudio } from '@/components/GiftCardStudio';

export const metadata = { title: 'Gift cards · Admin' };
export const dynamic = 'force-dynamic';

/**
 * Generador de imágenes de gift card para premios semanales.
 * El admin elige sponsor (logo), monto y ganador → descarga un PNG listo
 * para mandar por WhatsApp. Todo client-side (canvas), no se guarda nada.
 */
export default async function GiftCardsAdmin() {
  const sponsors = await prisma.sponsor.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, logoUrl: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Gift cards</h1>
        <p className="text-sm text-muted mt-1">
          Genera la imagen del premio semanal con el logo del patrocinador y el monto.
          Se descarga como PNG — lista para el grupo de WhatsApp.
        </p>
      </header>

      <GiftCardStudio sponsors={sponsors} />
    </div>
  );
}
