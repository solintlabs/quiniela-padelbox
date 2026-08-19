/**
 * "Reglas e inscripción" que ve el jugador. El resumen de puntos se genera solo
 * a partir de la configuración de la competición (describeRules); el organizador
 * añade encima la cuota, cómo pagar y sus reglas propias. Así siempre hay unas
 * reglas por defecto que se acomodan a como configuró la quiniela.
 */
export function TenantRules({
  pointsSummary,
  championBonus,
  entryFee,
  paymentInfo,
  rulesText,
}: {
  pointsSummary: string[];
  championBonus: number;
  entryFee: string | null;
  paymentInfo: string | null;
  rulesText: string | null;
}) {
  return (
    <section className="rounded-xl border border-line bg-bg-elev p-5 space-y-4">
      <h2 className="font-display text-xl">Reglas e inscripción</h2>

      {entryFee && (
        <p className="text-sm">
          <span className="text-muted">Cuota:</span> <strong>{entryFee}</strong>
        </p>
      )}

      {paymentInfo && (
        <div className="text-sm">
          <p className="text-muted mb-1">Cómo pagar el bote:</p>
          <p className="whitespace-pre-line leading-relaxed rounded-lg bg-bg border border-line px-3 py-2">
            {paymentInfo}
          </p>
        </div>
      )}

      <div className="text-sm">
        <p className="text-muted mb-1.5">Puntos:</p>
        <ul className="flex flex-wrap gap-1.5">
          {pointsSummary.map((line) => (
            <li key={line} className="text-xs rounded-full border border-line px-2.5 py-1 text-muted">
              {line}
            </li>
          ))}
          {championBonus > 0 && (
            <li className="text-xs rounded-full border border-accent/40 bg-accent/5 px-2.5 py-1">
              Acertar el campeón: +{championBonus}
            </li>
          )}
        </ul>
      </div>

      {rulesText && (
        <div className="text-sm">
          <p className="text-muted mb-1">Reglas del organizador:</p>
          <p className="whitespace-pre-line leading-relaxed">{rulesText}</p>
        </div>
      )}
    </section>
  );
}
