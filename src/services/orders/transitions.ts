import type { OrderStatus } from "@prisma/client";
import type { NotificationEvent } from "@/services/notifications/templates";

/**
 * Efectos que dispara un cambio de estado de pedido. La decisión vive en una
 * función pura (`planOrderTransition`) para poder testearla sin base de datos;
 * `src/services/orders/transition-effects.ts` es el único lugar que sabe cómo
 * aplicar esos efectos sobre stock, pago y envío.
 */
export type StockEffect = "none" | "commit" | "release" | "return";
export type PaymentEffect = "none" | "approve" | "cancel";
export type ShipmentEffect = "none" | "ready" | "shipped" | "delivered";

export interface TransitionPlan {
  stock: StockEffect;
  payment: PaymentEffect;
  shipment: ShipmentEffect;
  /** Notificación al cliente que dispara esta transición (se envía en `after`). */
  event: NotificationEvent | null;
  /** ¿Hay que avisar al admin si algún producto quedó en stock mínimo? */
  alertLowStock: boolean;
}

const NO_EFFECTS: TransitionPlan = {
  stock: "none",
  payment: "none",
  shipment: "none",
  event: null,
  alertLowStock: false,
};

/**
 * Traduce "de dónde a dónde" en los efectos concretos sobre stock, pago y envío.
 * Es pura y total: no toca Prisma ni lanza, así el corazón del pedido deja de
 * estar escondido dentro de una transacción.
 */
export function planOrderTransition(from: OrderStatus, to: OrderStatus): TransitionPlan {
  switch (to) {
    // El pago se acredita y la reserva se convierte en venta definitiva.
    case "CONFIRMED":
      return { stock: "commit", payment: "approve", shipment: "none", event: "payment.approved", alertLowStock: true };
    case "PREPARING":
      return { ...NO_EFFECTS, shipment: "ready", event: "order.preparing" };
    case "SHIPPED":
      return { ...NO_EFFECTS, shipment: "shipped", event: "order.shipped" };
    case "DELIVERED":
      return { ...NO_EFFECTS, shipment: "delivered", event: "order.delivered" };
    // Antes de confirmar sólo hay reserva; después de confirmar hay que devolver lo vendido.
    case "CANCELLED":
      return { ...NO_EFFECTS, stock: from === "PENDING" ? "release" : "return", payment: "cancel" };
    default:
      return NO_EFFECTS;
  }
}
