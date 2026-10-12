import { describe, expect, it } from "vitest";
import { chargeTotal, itemizeOrderCharge, type ChargeLine } from "@/services/payments/charge";
import { checkoutTotals } from "@/features/checkout/totals";

const product = (name: string, unitPrice: number, quantity: number): ChargeLine => ({
  name,
  unitPrice,
  quantity,
});

describe("itemizeOrderCharge", () => {
  it("sin descuentos ni envío cobra el subtotal exacto", () => {
    const lines = [product("Teclado", 1_000, 2), product("Mouse", 500, 1)];
    const items = itemizeOrderCharge({ lines, discountTotal: 0, shippingTotal: 0 });
    expect(items).toHaveLength(2);
    expect(chargeTotal(items)).toBe(2_500);
  });

  it("agrega una línea de envío y la suma es subtotal + envío", () => {
    const lines = [product("Teclado", 1_000, 2)];
    const items = itemizeOrderCharge({ lines, discountTotal: 0, shippingTotal: 700 });
    expect(items).toHaveLength(2);
    expect(items[1]).toMatchObject({ name: "Envío", quantity: 1, unitPrice: 700 });
    expect(chargeTotal(items)).toBe(2_700);
  });

  it("agrega una línea de descuento negativa y la suma es subtotal - descuento", () => {
    const lines = [product("Teclado", 1_000, 2), product("Mouse", 500, 1)];
    const items = itemizeOrderCharge({ lines, discountTotal: 565, shippingTotal: 0 });
    expect(items).toHaveLength(3);
    expect(items[2]).toMatchObject({ name: "Descuento", quantity: 1, unitPrice: -565 });
    expect(chargeTotal(items)).toBe(1_935);
  });

  it("con descuento y envío la suma es exactamente el total del pedido", () => {
    const lines = [product("A", 8_000, 2), product("B", 2_500, 1), product("C", 1_900, 3)];
    const subtotal = 8_000 * 2 + 2_500 * 1 + 1_900 * 3;
    const items = itemizeOrderCharge({ lines, discountTotal: 3_227, shippingTotal: 700 });
    expect(chargeTotal(items)).toBe(subtotal - 3_227 + 700);
  });

  it("recorta el descuento al subtotal (el total nunca es negativo)", () => {
    const lines = [product("A", 1_000, 1)];
    const items = itemizeOrderCharge({ lines, discountTotal: 9_999, shippingTotal: 0 });
    expect(chargeTotal(items)).toBe(0);
    const desc = items.find((i) => i.name === "Descuento");
    expect(desc?.unitPrice).toBe(-1_000);
  });

  it("ignora líneas con cantidad 0 y devuelve [] si no hay productos", () => {
    expect(itemizeOrderCharge({ lines: [], discountTotal: 0, shippingTotal: 0 })).toEqual([]);
    const items = itemizeOrderCharge({
      lines: [product("A", 100, 0)],
      discountTotal: 0,
      shippingTotal: 0,
    });
    expect(items).toEqual([]);
  });

  it("cobrado == mostrado: el cobro coincide con el total que muestra el checkout bajo una promo", () => {
    // Misma escena que checkoutTotals: subtotal 2.500, promo 250, cupón 100, pago 10% → 1.935.
    const shown = checkoutTotals({
      subtotal: 2_500,
      promotionDiscount: 250,
      couponDiscount: 100,
      shippingPrice: 0,
      paymentDiscountPercent: 10,
    });
    const items = itemizeOrderCharge({
      lines: [product("Teclado", 1_000, 2), product("Mouse", 500, 1)],
      discountTotal: 250 + 100 + 215, // promo + cupón + pago
      shippingTotal: 0, // envío gratis alcanzado
    });
    expect(chargeTotal(items)).toBe(shown.total);
    expect(chargeTotal(items)).toBe(1_935);
  });

  it("cobrado == mostrado con envío no gratuito", () => {
    const shown = checkoutTotals({
      subtotal: 1_000,
      promotionDiscount: 0,
      couponDiscount: 0,
      shippingPrice: 500,
      paymentDiscountPercent: 0,
    });
    const items = itemizeOrderCharge({
      lines: [product("A", 1_000, 1)],
      discountTotal: 0,
      shippingTotal: 500,
    });
    expect(chargeTotal(items)).toBe(shown.total);
    expect(chargeTotal(items)).toBe(1_500);
  });
});
