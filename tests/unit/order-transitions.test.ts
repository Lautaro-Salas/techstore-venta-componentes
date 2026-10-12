import { describe, expect, it } from "vitest";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUSES } from "@/services/orders/status";
import { planOrderTransition } from "@/services/orders/transitions";

const NONE = {
  stock: "none",
  payment: "none",
  shipment: "none",
  event: null,
  alertLowStock: false,
} as const;

describe("planOrderTransition", () => {
  it("confirmar convierte la reserva en venta y acredita el pago", () => {
    expect(planOrderTransition("PENDING", "CONFIRMED")).toEqual({
      stock: "commit",
      payment: "approve",
      shipment: "none",
      event: "payment.approved",
      alertLowStock: true,
    });
  });

  it("preparar, enviar y entregar sólo mueven el envío", () => {
    expect(planOrderTransition("CONFIRMED", "PREPARING")).toEqual({
      ...NONE,
      shipment: "ready",
      event: "order.preparing",
    });
    expect(planOrderTransition("PREPARING", "SHIPPED")).toEqual({
      ...NONE,
      shipment: "shipped",
      event: "order.shipped",
    });
    expect(planOrderTransition("SHIPPED", "DELIVERED")).toEqual({
      ...NONE,
      shipment: "delivered",
      event: "order.delivered",
    });
  });

  it("cancelar libera la reserva o devuelve lo vendido según el estado previo", () => {
    expect(planOrderTransition("PENDING", "CANCELLED")).toEqual({
      ...NONE,
      stock: "release",
      payment: "cancel",
    });
    expect(planOrderTransition("CONFIRMED", "CANCELLED")).toEqual({
      ...NONE,
      stock: "return",
      payment: "cancel",
    });
    expect(planOrderTransition("PREPARING", "CANCELLED")).toEqual({
      ...NONE,
      stock: "return",
      payment: "cancel",
    });
  });

  it("un estado sin efectos reales (PENDING) no dispara nada", () => {
    expect(planOrderTransition("PENDING", "PENDING")).toEqual(NONE);
  });

  it("cada destino devuelve un plan completo y total", () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        const plan = planOrderTransition(from as OrderStatus, to as OrderStatus);
        expect(plan.stock).toBeTruthy();
        expect(plan.payment).toBeTruthy();
        expect(plan.shipment).toBeTruthy();
        expect(typeof plan.alertLowStock).toBe("boolean");
      }
    }
  });
});
