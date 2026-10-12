import { describe, expect, it } from "vitest";
import { calculateCartTotals, type CartTotalsInput } from "@/services/cart/rules";
import { checkoutTotals } from "@/features/checkout/totals";
import { type CouponRule, type DiscountLine, type DiscountRule } from "@/services/discounts/rules";

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

describe("checkoutTotals", () => {
  it("muestra exactamente el total del servidor cuando el envío es gratis", () => {
    // Carrito con promo 10% + cupón fijo 100 + pago 10%; 2.150 >= umbral 2.000.
    const lines = [line("p1", 1_000, 2), line("p2", 500, 1)];
    const input: CartTotalsInput = {
      lines,
      promotions: [promo()],
      coupon: { rule: coupon({ type: "FIXED", value: 100 }), userUses: 0 },
      shipping: { price: 300, freeThreshold: 2_000 },
      paymentDiscountPercent: 10,
    };
    const server = calculateCartTotals(input);
    // El cotizador ya resuelve el envío gratis en `price` (flatQuote) → el cliente
    // recibe shippingPrice = 0.
    const client = checkoutTotals({
      subtotal: server.subtotal,
      promotionDiscount: server.promotionDiscount,
      couponDiscount: server.couponDiscount,
      shippingPrice: 0, // quote resuelto
      paymentDiscountPercent: 10,
    });
    expect(server.paymentDiscount).toBe(215);
    expect(client.paymentDiscount).toBe(server.paymentDiscount);
    expect(client.total).toBe(server.total);
    expect(client.total).toBe(1_935);
  });

  it("muestra el mismo total que el servidor cuando NO se alcanza el envío gratis", () => {
    const input: CartTotalsInput = {
      lines: [line("p1", 1_000, 1)],
      shipping: { price: 500, freeThreshold: 5_000 },
    };
    const server = calculateCartTotals(input);
    const client = checkoutTotals({
      subtotal: server.subtotal,
      promotionDiscount: 0,
      couponDiscount: 0,
      shippingPrice: server.shipping, // 500, quote no resuelto a 0
      paymentDiscountPercent: 0,
    });
    expect(server.shipping).toBe(500);
    expect(client.shipping).toBe(500);
    expect(client.total).toBe(1_500);
    expect(client.total).toBe(server.total);
  });

  it("aplica el descuento por pago sobre la base ya descontada (promo + cupón)", () => {
    const client = checkoutTotals({
      subtotal: 2_500,
      promotionDiscount: 250,
      couponDiscount: 100,
      shippingPrice: null,
      paymentDiscountPercent: 10,
    });
    expect(client.afterDiscounts).toBe(2_150);
    expect(client.paymentDiscount).toBe(215);
    expect(client.shipping).toBeNull();
    expect(client.total).toBe(1_935);
  });

  it("nunca deja el total en negativo", () => {
    const client = checkoutTotals({
      subtotal: 100,
      promotionDiscount: 0,
      couponDiscount: 100,
      shippingPrice: null,
      paymentDiscountPercent: 50,
    });
    expect(client.afterDiscounts).toBe(0);
    expect(client.paymentDiscount).toBe(0);
    expect(client.total).toBe(0);
  });

  it("equivale a calculateCartTotals en el caso con descuentos y envío pagado", () => {
    const input: CartTotalsInput = {
      lines: [line("p1", 8_000, 2), line("p2", 2_500, 1)],
      promotions: [promo({ type: "FIXED", value: 1_000 })],
      coupon: { rule: coupon({ type: "PERCENTAGE", value: 5, isActive: true }), userUses: 0 },
      shipping: { price: 700, freeThreshold: 20_000 }, // 17.650 < 20.000 → se paga
      paymentDiscountPercent: 7,
    };
    const server = calculateCartTotals(input);
    const client = checkoutTotals({
      subtotal: server.subtotal,
      promotionDiscount: server.promotionDiscount,
      couponDiscount: server.couponDiscount,
      shippingPrice: server.shipping,
      paymentDiscountPercent: 7,
    });
    expect(client.total).toBe(server.total);
    expect(client.paymentDiscount).toBe(server.paymentDiscount);
  });
});
