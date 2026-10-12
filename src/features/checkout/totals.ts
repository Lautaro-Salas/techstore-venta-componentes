import { applyPaymentAndShipping } from "@/services/cart/rules";

export interface CheckoutTotalsInput {
  subtotal: number;
  promotionDiscount: number;
  couponDiscount: number;
  /** Costo de envío ya resuelto por el cotizador (0 si es gratis o retiro local). */
  shippingPrice: number | null;
  paymentDiscountPercent: number;
}

/**
 * Totales visibles en el checkout. La base de descuentos (promo + cupón) la
 * resuelve el servidor (calculateCartTotals); acá se delega en la misma fuente
 * pura (applyPaymentAndShipping) para el descuento por método de pago y el
 * envío, de modo que la UI muestre exactamente lo que el backend va a cobrar.
 * El importe final siempre lo recalcula el backend al crear el pedido.
 */
export function checkoutTotals(input: CheckoutTotalsInput) {
  const afterDiscounts = input.subtotal - input.promotionDiscount - input.couponDiscount;
  const result = applyPaymentAndShipping({
    afterDiscounts,
    paymentDiscountPercent: input.paymentDiscountPercent,
    shipping:
      input.shippingPrice !== null ? { price: input.shippingPrice, freeThreshold: null } : null,
  });
  return {
    afterDiscounts,
    paymentDiscount: result.paymentDiscount,
    shipping: result.shipping,
    total: result.total,
  };
}
