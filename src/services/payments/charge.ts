/**
 * Cobro itemizado para proveedores de pago.
 *
 * Módulo profundo y puro: dado un pedido (líneas a precio de lista, descuentos y
 * envío ya resueltos por `calculateCartTotals`), produce los ítems de cobro cuya
 * suma es EXACTAMENTE el total que el checkout mostró y que quedó persistido en
 * el pedido (`subtotal - descuentos + envío`).
 *
 * El proveedor debe cobrar lo prometido: la preferencia itemiza productos al
 * precio de lista, agrega una línea de envío y una línea de descuento; el webhook
 * valida después que el importe efectivamente cobrado coincide con `order.total`.
 * Si el proveedor rechazara esta itemización, `initiate` falla de forma audible
 * (pedido PENDING + pago REJECTED en el admin), nunca cobrando de más callado.
 */

export interface ChargeLine {
  name: string;
  /** Precio unitario en pesos enteros (ARS no maneja centavos en la app). */
  unitPrice: number;
  quantity: number;
}

export interface ItemizeChargeInput {
  /** Líneas de producto a precio de lista (sin descuentos aplicados). */
  lines: ChargeLine[];
  /** Descuento total en pesos (promo + cupón + medio de pago). Se recorta a [0, subtotal]. */
  discountTotal: number;
  /** Costo de envío ya resuelto (0 si hay envío gratis o retiro en local). */
  shippingTotal: number;
}

/**
 * Itemiza el cobro de un pedido. Invariante: `sum(items)` es siempre
 * `subtotal - discountTotal + shippingTotal`.
 */
export function itemizeOrderCharge(input: ItemizeChargeInput): ChargeLine[] {
  const lines = input.lines.filter((l) => l.quantity > 0);
  if (lines.length === 0) return [];

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const discountTotal = Math.min(Math.max(input.discountTotal, 0), subtotal);
  const shippingTotal = Math.max(Math.round(input.shippingTotal), 0);

  const items: ChargeLine[] = lines.map((l) => ({ ...l }));
  if (shippingTotal > 0) items.push({ name: "Envío", quantity: 1, unitPrice: shippingTotal });
  if (discountTotal > 0) items.push({ name: "Descuento", quantity: 1, unitPrice: -discountTotal });
  return items;
}

/** Total que sumarán las líneas (debe ser igual al total del pedido). */
export function chargeTotal(items: ChargeLine[]): number {
  return items.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}
