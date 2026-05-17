import { prisma } from '@/lib/db';

export interface PoolInfo {
  feeAmount: number;
  feeCurrency: string;
  paidCount: number;          // socios con hasPaid=true
  totalPaidCount: number;     // todos los User registrados
  totalAmount: number;        // feeAmount * paidCount
  /** Formato listo para mostrar: "$1.500", "$10", etc. */
  totalFormatted: string;
  feeFormatted: string;
}

/** Lee Rules + cuenta usuarios pagados y devuelve la info del bote. */
export async function getPool(): Promise<PoolInfo> {
  const [rules, paidCount, totalCount] = await Promise.all([
    prisma.rules.findUnique({ where: { id: 1 } }),
    prisma.user.count({ where: { hasPaid: true } }),
    prisma.user.count(),
  ]);
  const feeAmount = rules?.feeAmount ?? 10;
  const feeCurrency = rules?.feeCurrency ?? 'USD';
  const totalAmount = feeAmount * paidCount;
  return {
    feeAmount,
    feeCurrency,
    paidCount,
    totalPaidCount: totalCount,
    totalAmount,
    totalFormatted: formatCurrency(totalAmount, feeCurrency),
    feeFormatted: formatCurrency(feeAmount, feeCurrency),
  };
}

export function formatCurrency(amount: number, currency: string): string {
  // Símbolo simple delante del número con separador de miles
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'VES' ? 'Bs. ' : '';
  const formatted = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(amount);
  return symbol ? `${symbol}${formatted}` : `${formatted} ${currency}`;
}
