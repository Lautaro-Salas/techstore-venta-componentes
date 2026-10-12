import { describe, expect, it } from "vitest";
import {
  MAX_QUANTITY_PER_ITEM,
  calculateCartTotals,
  clampQuantity,
  type CartTotalsInput,
} from "@/services/cart/rules";
import {
  bestPromotion,
  evaluateCoupon,
  evaluateDiscount,
  type CouponRule,
  type DiscountLine,
  type DiscountRule,
} from "@/services/discounts/rules";
import {
  applyPercent,
  bestInterestFreePlan,
  discountPercent,
  priceWithoutNationalTaxes,
  quoteInstallments,
} from "@/services/pricing/rules";

const line = (
  productId: string,
  unitPrice: number,
  quantity: number,
  categoryId = "cat-1",
): DiscountLine => ({
  productId,
  categoryId,
  unitPrice,
  quantity,
});

const promo = (over: Partial<DiscountRule> = {}): DiscountRule => ({
  id: "promo-1",
  name: "Promo",
  type: "PERCENTAGE",
  value: 10,
  isActive: true,
  productIds: [],
  categoryIds: [],
  ...over,
});

const coupon = (over: Partial<CouponRule> = {}): CouponRule => ({
  ...promo({ id: "cup-1" }),
  code: "AHORRO10",
  usedCount: 0,
  ...over,
});

describe("clampQuantity", () => {
  it("respeta el máximo global y el stock disponible", () => {
    expect(clampQuantity(15, 100)).toBe(MAX_QUANTITY_PER_ITEM);
    expect(clampQuantity(15, 5)).toBe(5);
    expect(clampQuantity(3, 0)).toBe(0);
  });

  it("sube al mínimo y trunca fracciones", () => {
    expect(clampQuantity(0, 50)).toBe(1);
    expect(clampQuantity(-3, 50)).toBe(1);
    expect(clampQuantity(2.7, 50)).toBe(2);
  });
});

describe("calculateCartTotals", () => {
  const lines = [line("p1", 1_000, 2), line("p2", 500, 1)]; // subtotal 2.500

  it("suma subtotal y cantidad de ítems", () => {
    const totals = calculateCartTotals({ lines });
    expect(totals.subtotal).toBe(2_500);
    expect(totals.itemCount).toBe(3);
    expect(totals.discountTotal).toBe(0);
    expect(totals.total).toBe(2_500);
    expect(totals.shipping).toBeNull();
  });

  it("aplica el orden promoción → cupón → medio de pago → envío", () => {
    const input: CartTotalsInput = {
      lines,
      promotions: [promo()], // 10% sobre 2.500 = 250
      coupon: { rule: coupon({ type: "FIXED", value: 100 }), userUses: 0 }, // 100
      shipping: { price: 300, freeThreshold: 2_000 },
      paymentDiscountPercent: 10,
    };
    const t = calculateCartTotals(input);
    expect(t.promotionDiscount).toBe(250);
    expect(t.couponDiscount).toBe(100);
    // 10% sobre (2500 − 250 − 100) = 215
    expect(t.paymentDiscount).toBe(215);
    expect(t.discountTotal).toBe(565);
    // 2.150 supera el umbral de 2.000 → envío gratis.
    expect(t.freeShipping).toBe(true);
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(1_935);
    expect(t.benefits).toEqual([]);
  });

  it("informa el faltante para el envío gratis cuando no se alcanza", () => {
    const t = calculateCartTotals({
      lines: [line("p1", 1_000, 1)],
      shipping: { price: 500, freeThreshold: 5_000 },
    });
    expect(t.shipping).toBe(500);
    expect(t.freeShipping).toBe(false);
    expect(t.total).toBe(1_500);
    expect(t.benefits).toContainEqual({ label: "envío gratis", missingAmount: 4_000 });
  });

  it("un cupón inválido no descuenta y expone el motivo", () => {
    const t = calculateCartTotals({
      lines,
      coupon: { rule: coupon({ isActive: false }), userUses: 0 },
    });
    expect(t.couponDiscount).toBe(0);
    expect(t.couponError).toBe("El cupón no es válido.");
    expect(t.total).toBe(2_500);
  });

  it("el cupón nunca puede dejar el total en negativo", () => {
    const t = calculateCartTotals({
      lines: [line("p1", 100, 1)],
      coupon: { rule: coupon({ type: "FIXED", value: 999 }), userUses: 0 },
      shipping: { price: 0 },
    });
    expect(t.couponDiscount).toBe(100);
    expect(t.total).toBe(0);
  });

  it("promoción sólo del carrito cuando no cubre productos específicos", () => {
    const t = calculateCartTotals({
      lines: [line("p1", 1_000, 1), line("p2", 1_000, 1)],
      promotions: [promo({ type: "PERCENTAGE", value: 50, productIds: ["p1"] })],
    });
    expect(t.promotionDiscount).toBe(500); // 50% sólo de la línea elegible
    expect(t.total).toBe(1_500);
  });
});

describe("evaluateDiscount / evaluateCoupon / bestPromotion", () => {
  const lines = [line("p1", 2_500, 1)];
  const now = new Date("2026-06-15T12:00:00Z");

  it("bloquea promociones inactivas", () => {
    const r = evaluateDiscount(promo({ isActive: false }), lines, now);
    expect(r).toEqual({ ok: false, reason: "La promoción no está activa." });
  });

  it("reporta el faltante para el monto mínimo", () => {
    const r = evaluateDiscount(promo({ minSubtotal: 5_000 }), lines, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missingAmount).toBe(2_500);
  });

  it("respeta la ventana de vigencia", () => {
    const future = evaluateDiscount(
      promo({ startsAt: new Date("2026-07-01T00:00:00Z") }),
      lines,
      now,
    );
    expect(future.ok).toBe(false);
    const past = evaluateDiscount(promo({ endsAt: new Date("2026-06-01T00:00:00Z") }), lines, now);
    expect(past.ok).toBe(false);
  });

  it("descuenta sólo los productos elegibles", () => {
    const r = evaluateDiscount(promo({ productIds: ["otro"] }), lines, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Ningún producto del carrito participa de esta promoción.");
  });

  it("limita el descuento al subtotal elegible", () => {
    const r = evaluateDiscount(promo({ type: "FIXED", value: 99_999 }), lines, now);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.amount).toBe(2_500);
  });

  it("los cupones validan límite de usos globales y por usuario", () => {
    const global = evaluateCoupon(
      coupon({ maxUses: 5, usedCount: 5 }),
      lines,
      { userUses: 0 },
      now,
    );
    expect(global.ok).toBe(false);
    if (!global.ok) expect(global.reason).toBe("El cupón alcanzó su límite de usos.");

    const perUser = evaluateCoupon(
      coupon({ maxUsesPerUser: 1, usedCount: 0 }),
      lines,
      { userUses: 1 },
      now,
    );
    expect(perUser.ok).toBe(false);
    if (!perUser.ok)
      expect(perUser.reason).toBe("Ya utilizaste este cupón el máximo de veces permitido.");
  });

  it("mejor promoción: elige la que más descuenta (no se acumulan)", () => {
    const best = bestPromotion(
      [promo({ id: "a", value: 10 }), promo({ id: "b", type: "FIXED", value: 200 })],
      lines,
      now,
    );
    expect(best?.rule.id).toBe("a");
    expect(best?.amount).toBe(250);
  });
});

describe("reglas de precio", () => {
  it("discountPercent sólo descuenta si bajó el precio", () => {
    expect(discountPercent(800, 1_000)).toBe(20);
    expect(discountPercent(1_000, 1_000)).toBe(0);
    expect(discountPercent(1_100, 1_000)).toBe(0);
    expect(discountPercent(800, null)).toBe(0);
  });

  it("priceWithoutNationalTaxes revierte el 21% incluido", () => {
    expect(priceWithoutNationalTaxes(1_210)).toBe(1_000);
    expect(priceWithoutNationalTaxes(1_000, 0)).toBe(1_000);
  });

  it("applyPercent redondea al entero", () => {
    expect(applyPercent(2_150, 10)).toBe(215);
    expect(applyPercent(1, 50)).toBe(1); // 0.5 → 1
  });

  it("quoteInstallments calcula cuota y total", () => {
    const free = quoteInstallments(10_000, { installments: 3, interestRateBps: 0 });
    expect(free).toEqual({ installments: 3, amount: 3_334, total: 10_000, interestFree: true });

    const withInterest = quoteInstallments(10_000, { installments: 6, interestRateBps: 1_000 });
    expect(withInterest.total).toBe(11_000);
    expect(withInterest.amount).toBe(1_834);
    expect(withInterest.interestFree).toBe(false);
  });

  it("bestInterestFreePlan elige el plan sin interés de más cuotas", () => {
    const best = bestInterestFreePlan(10_000, [
      { installments: 3, interestRateBps: 0 },
      { installments: 6, interestRateBps: 0 },
      { installments: 12, interestRateBps: 500 },
    ]);
    expect(best?.installments).toBe(6);
    expect(bestInterestFreePlan(10_000, [{ installments: 12, interestRateBps: 500 }])).toBeNull();
  });
});
