import "server-only";
import type { TransactionClient } from "@/lib/db";
import {
  commitOrderStock,
  releaseOrderStock,
  returnOrderStock,
} from "@/services/inventory/inventory.service";
import type { TransitionPlan } from "./transitions";

export interface TransitionOptions {
  trackingCode?: string;
  carrier?: string;
}

/** Aplica un plan dentro de la transacción del cambio de estado. */
export async function applyTransitionEffects(
  tx: TransactionClient,
  orderId: string,
  plan: TransitionPlan,
  options: TransitionOptions = {},
): Promise<void> {
  if (plan.stock === "commit") await commitOrderStock(tx, orderId);
  else if (plan.stock === "release") await releaseOrderStock(tx, orderId);
  else if (plan.stock === "return") await returnOrderStock(tx, orderId);

  if (plan.payment === "approve") {
    await tx.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "APPROVED" },
    });
  } else if (plan.payment === "cancel") {
    await tx.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  if (plan.shipment === "ready") {
    await tx.shipment.updateMany({ where: { orderId }, data: { status: "READY" } });
  } else if (plan.shipment === "shipped") {
    await tx.shipment.updateMany({
      where: { orderId },
      data: {
        status: "SHIPPED",
        shippedAt: new Date(),
        trackingCode: options.trackingCode || null,
        carrier: options.carrier || null,
      },
    });
  } else if (plan.shipment === "delivered") {
    await tx.shipment.updateMany({
      where: { orderId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
  }
}
