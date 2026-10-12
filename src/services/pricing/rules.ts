/** Reglas de precios. Montos en pesos enteros. */

export const PERCENT_BASE = 100;
export const BASIS_POINTS_BASE = 10_000;
/** IVA general incluido en los precios al consumidor final. */
export const DEFAULT_VAT_RATE = 0.21;

export function discountPercent(price: number, compareAtPrice?: number | null): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * PERCENT_BASE);
}

/** Precio sin impuestos nacionales (Ley 27.743 de transparencia fiscal). */
export function priceWithoutNationalTaxes(price: number, vatRate = DEFAULT_VAT_RATE): number {
  return Math.round(price / (1 + vatRate));
}

export function applyPercent(amount: number, percent: number): number {
  return Math.round((amount * percent) / PERCENT_BASE);
}

export interface InstallmentPlanInput {
  installments: number;
  interestRateBps: number;
}

export interface InstallmentQuote {
  installments: number;
  amount: number;
  total: number;
  interestFree: boolean;
}

export function quoteInstallments(total: number, plan: InstallmentPlanInput): InstallmentQuote {
  const financed = Math.round(total * (1 + plan.interestRateBps / BASIS_POINTS_BASE));
  return {
    installments: plan.installments,
    amount: Math.ceil(financed / plan.installments),
    total: financed,
    interestFree: plan.interestRateBps === 0,
  };
}

/** Mejor plan sin interés (mayor cantidad de cuotas) o null si no hay. */
export function bestInterestFreePlan(
  total: number,
  plans: InstallmentPlanInput[],
): InstallmentQuote | null {
  const best = plans
    .filter((p) => p.interestRateBps === 0 && p.installments > 1)
    .sort((a, b) => b.installments - a.installments)[0];
  return best ? quoteInstallments(total, best) : null;
}
