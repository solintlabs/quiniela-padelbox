'use client';

/**
 * Botón de descarga del PDF del cuadro. Descarga un PDF real (no abre el
 * diálogo de imprimir). Si se pasa userId, descarga el de ese usuario (admin).
 */
export function PdfExportButton({ userId }: { userId?: string }) {
  const href = userId ? `/api/cuadro/pdf?userId=${encodeURIComponent(userId)}` : '/api/cuadro/pdf';
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-accent-fg font-semibold text-sm hover:brightness-95"
      title="Descargar PDF"
    >
      📥 Descargar PDF
    </a>
  );
}
