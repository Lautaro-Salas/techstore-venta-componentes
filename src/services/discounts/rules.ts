import { applyPercent } from "@/services/pricing/rules";

export type DiscountKind = "PERCENTAGE" | "FIXED";

export interface DiscountRule {
  id: string;
  name: string;
  type: DiscountKind;
  value: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  minSubtotal?: number | null;
  isActive: boolean;
  /** Si ambas listas están vacías, aplica a todo el carrito. */
  productIds: string[];
  categoryIds: string[];
}

export interface CouponRule extends DiscountRule {
  code: string;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  usedCount: number;
}

export interface DiscountLine {
  productId: string;
  categoryId: string;
  unitPrice: number;
  quantity: number;
}

export type DiscountEvaluation =
  | { ok: true; amount: number; eligibleSubtotal: number }
  | { ok: false; reason: string; missingAmount?: number };

export function linesSubtotal(lines: DiscountLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

function isLineEligible(rule: DiscountRule, line: DiscountLine): boolean {
  const unrestricted = rule.productIds.length === 0 && rule.categoryIds.length === 0;
  return (
    unrestricted ||
    rule.productIds.includes(line.productId) ||
    rule.categoryIds.includes(line.categoryId)
  );
}

function isWithinDates(rule: DiscountRule, now: Date): boolean {
  if (rule.startsAt && now < rule.startsAt) return false;
  if (rule.endsAt && now > rule.endsAt) return false;
  return true;
}

/** Evalúa una regla de descuento (promoción o cupón) contra las líneas del carrito. */
export function evaluateDiscount(
  rule: DiscountRule,
  lines: DiscountLine[],
  now: Date = new Date(),
): DiscountEvaluation {
  if (!rule.isActive) return { ok: false, reason: "La promoción no está activa." };
  if (!isWithinDates(rule, now)) return { ok: false, reason: "La promoción no está vigente." };

  const subtotal = linesSubtotal(lines);
  if (rule.minSubtotal && subtotal < rule.minSubtotal) {
    return {
      ok: false,
      reason: "No alcanzás el monto mínimo de compra.",
      missingAmount: rule.minSubtotal - subtotal,
    };
  }

  const eligibleSubtotal = linesSubtotal(lines.filter((l) => isLineEligible(rule, l)));
  if (eligibleSubtotal === 0) {
    return { ok: false, reason: "Ningún producto del carrito participa de esta promoción." };
  }

  const raw = rule.type === "PERCENTAGE" ? applyPercent(eligibleSubtotal, rule.value) : rule.value;
  return { ok: true, amount: Math.min(raw, eligibleSubtotal), eligibleSubtotal };
}

export interface CouponUsage {
  userUses: number;
}

/** Valida límites de uso de un cupón y luego evalúa el descuento. */
export function evaluateCoupon(
  coupon: CouponRule,
  lines: DiscountLine[],
  usage: CouponUsage,
  now: Date = new Date(),
): DiscountEvaluation {
  if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: "El cupón alcanzó su límite de usos." };
  }
  if (
    coupon.maxUsesPerUser !== null &&
    coupon.maxUsesPerUser !== undefined &&
    usage.userUses >= coupon.maxUsesPerUser
  ) {
    return { ok: false, reason: "Ya utilizaste este cupón el máximo de veces permitido." };
  }
  const result = evaluateDiscount(coupon, lines, now);
  if (!result.ok && result.reason === "La promoción no está vigente.") {
    return { ok: false, reason: "El cupón está vencido o todavía no está vigente." };
  }
  if (!result.ok && result.reason === "La promoción no está activa.") {
    return { ok: false, reason: "El cupón no es válido." };
  }
  return result;
}

/** Elige la promoción automática que más descuento otorga (no se acumulan entre sí). */
export function bestPromotion(
  promotions: DiscountRule[],
  lines: DiscountLine[],
  now: Date = new Date(),
): { rule: DiscountRule; amount: number } | null {
  let best: { rule: DiscountRule; amount: number } | null = null;
  for (const rule of promotions) {
    const result = evaluateDiscount(rule, lines, now);
    if (result.ok && (!best || result.amount > best.amount)) best = { rule, amount: result.amount };
  }
  return best;
}
