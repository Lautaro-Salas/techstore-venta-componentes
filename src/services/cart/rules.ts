import {
  bestPromotion,
  evaluateCoupon,
  linesSubtotal,
  type CouponRule,
  type DiscountLine,
  type DiscountRule,
} from "@/services/discounts/rules";
import { applyPercent } from "@/services/pricing/rules";

export const MAX_QUANTITY_PER_ITEM = 10;
export const MIN_QUANTITY_PER_ITEM = 1;

export interface ShippingQuoteInput {
  price: number;
  freeThreshold?: number | null;
}

export interface CartTotalsInput {
  lines: DiscountLine[];
  promotions?: DiscountRule[];
  coupon?: { rule: CouponRule; userUses: number } | null;
  shipping?: ShippingQuoteInput | null;
  /** Descuento por medio de pago (ej. transferencia). */
  paymentDiscountPercent?: number;
  /** Umbral de envío gratis para mostrar progreso aunque no haya método elegido. */
  freeShippingThreshold?: number | null;
  now?: Date;
}

export interface Benefit {
  label: string;
  missingAmount: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  promotionDiscount: number;
  promotionName: string | null;
  couponDiscount: number;
  couponError: string | null;
  paymentDiscount: number;
  discountTotal: number;
  shipping: number | null;
  freeShipping: boolean;
  total: number;
  benefits: Benefit[];
}

export function clampQuantity(quantity: number, available: number): number {
  const max = Math.min(MAX_QUANTITY_PER_ITEM, Math.max(available, 0));
  return Math.max(Math.min(Math.trunc(quantity), max), Math.min(MIN_QUANTITY_PER_ITEM, max));
}

function resolveShipping(
  shipping: ShippingQuoteInput | null | undefined,
  amountAfterDiscounts: number,
): { cost: number | null; free: boolean } {
  if (!shipping) return { cost: null, free: false };
  const free = Boolean(shipping.freeThreshold && amountAfterDiscounts >= shipping.freeThreshold);
  return { cost: free ? 0 : shipping.price, free };
}

function collectBenefits(
  input: CartTotalsInput,
  afterDiscounts: number,
  subtotal: number,
): Benefit[] {
  const benefits: Benefit[] = [];
  const threshold = input.shipping?.freeThreshold ?? input.freeShippingThreshold;
  if (threshold && afterDiscounts < threshold) {
    benefits.push({ label: "envío gratis", missingAmount: threshold - afterDiscounts });
  }
  for (const promo of input.promotions ?? []) {
    if (promo.isActive && promo.minSubtotal && subtotal < promo.minSubtotal) {
      benefits.push({ label: promo.name, missingAmount: promo.minSubtotal - subtotal });
    }
  }
  return benefits.sort((a, b) => a.missingAmount - b.missingAmount);
}

export interface PaymentAndShippingInput {
  /** Subtotal ya descontado por promoción y cupón (nunca negativo). */
  afterDiscounts: number;
  /** Descuento por medio de pago en puntos porcentuales (10 = 10%). */
  paymentDiscountPercent?: number;
  shipping?: ShippingQuoteInput | null;
}

export interface PaymentAndShippingResult {
  paymentDiscount: number;
  /** Costo de envío resuelto (0 si alcanza el umbral de envío gratis). */
  shipping: number | null;
  freeShipping: boolean;
  total: number;
}

/**
 * Fuente única del paso final de totales: descuento por medio de pago y envío
 * sobre el monto ya descontado. Lo usan el carrito (server) y el checkout (UI)
 * para que la pantalla siempre muestre el mismo total que se va a cobrar.
 */
export function applyPaymentAndShipping(input: PaymentAndShippingInput): PaymentAndShippingResult {
  const afterDiscounts = Math.max(input.afterDiscounts, 0);
  const paymentDiscount = input.paymentDiscountPercent
    ? applyPercent(afterDiscounts, input.paymentDiscountPercent)
    : 0;
  const shipping = resolveShipping(input.shipping, afterDiscounts);
  const total = Math.max(afterDiscounts - paymentDiscount + (shipping.cost ?? 0), 0);
  return { paymentDiscount, shipping: shipping.cost, freeShipping: shipping.free, total };
}

/**
 * Calcula los totales del carrito.
 * Orden: promoción automática → cupón → descuento por medio de pago → envío.
 */
export function calculateCartTotals(input: CartTotalsInput): CartTotals {
  const now = input.now ?? new Date();
  const subtotal = linesSubtotal(input.lines);
  const itemCount = input.lines.reduce((sum, l) => sum + l.quantity, 0);

  const promo = bestPromotion(input.promotions ?? [], input.lines, now);
  const promotionDiscount = promo?.amount ?? 0;

  let couponDiscount = 0;
  let couponError: string | null = null;
  if (input.coupon) {
    const result = evaluateCoupon(
      input.coupon.rule,
      input.lines,
      { userUses: input.coupon.userUses },
      now,
    );
    if (result.ok) couponDiscount = Math.min(result.amount, subtotal - promotionDiscount);
    else couponError = result.reason;
  }

  const afterDiscounts = subtotal - promotionDiscount - couponDiscount;
  const paymentAndShipping = applyPaymentAndShipping({
    afterDiscounts,
    paymentDiscountPercent: input.paymentDiscountPercent,
    shipping: input.shipping,
  });
  const discountTotal = promotionDiscount + couponDiscount + paymentAndShipping.paymentDiscount;

  return {
    itemCount,
    subtotal,
    promotionDiscount,
    promotionName: promo?.rule.name ?? null,
    couponDiscount,
    couponError,
    paymentDiscount: paymentAndShipping.paymentDiscount,
    discountTotal,
    shipping: paymentAndShipping.shipping,
    freeShipping: paymentAndShipping.freeShipping,
    total: paymentAndShipping.total,
    benefits: collectBenefits(input, afterDiscounts, subtotal),
  };
}
