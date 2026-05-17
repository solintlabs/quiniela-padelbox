'use client';

export function PdfExportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-line hover:bg-bg-elev text-sm"
      title="Imprimir / Guardar como PDF"
    >
      📄 PDF
    </button>
  );
}
