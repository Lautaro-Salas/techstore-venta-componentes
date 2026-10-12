"use server";

import { parseOrThrow, runAction } from "@/lib/actions";
import { requirePermission } from "@/lib/auth/guards";
import { orderStatusChangeSchema, type OrderStatusChangeValues } from "@/schemas/admin";
import { changeOrderStatus } from "@/services/orders/order-status.service";
import { revalidateOrders } from "@/lib/cache/revalidate";
import type { ActionResult } from "@/types/actions";

/** Cambia el estado de un pedido (valida transiciones, stock, pagos y envío). */
export async function changeOrderStatusAction(
  values: OrderStatusChangeValues,
): Promise<ActionResult<{ status: string }>> {
  return runAction(async () => {
    const user = await requirePermission("orders:write");
    const input = parseOrThrow(orderStatusChangeSchema, values);
    await changeOrderStatus({
      orderId: input.orderId,
      status: input.status,
      userId: user.id,
      note: input.note || undefined,
      trackingCode: input.trackingCode || undefined,
      carrier: input.carrier || undefined,
    });
    revalidateOrders(input.orderId);
    return { status: input.status };
  });
}
