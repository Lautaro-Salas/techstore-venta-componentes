import "server-only";
import { after } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { findLowStock } from "@/services/inventory/inventory.service";
import { notify } from "@/services/notifications/notification.service";
import { getStoreSettings } from "@/services/settings/settings.service";
import { recordAudit } from "@/services/admin/audit.service";
import { ORDER_STATUS_LABEL, canTransition } from "./status";
import { applyTransitionEffects } from "./transition-effects";
import { planOrderTransition } from "./transitions";

export interface StatusChange {
  orderId: string;
  status: OrderStatus;
  userId?: string;
  note?: string;
  trackingCode?: string;
  carrier?: string;
}

/** Cambia el estado de un pedido aplicando efectos de stock, pago y envío. */
export async function changeOrderStatus(change: StatusChange): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: change.orderId },
    include: { items: true },
  });
  if (!order) throw notFound("Pedido");
  if (!canTransition(order.status, change.status)) {
    throw new AppError(
      "CONFLICT",
      `No se puede pasar de "${ORDER_STATUS_LABEL[order.status]}" a "${ORDER_STATUS_LABEL[change.status]}".`,
    );
  }

  const plan = planOrderTransition(order.status, change.status);

  await db.$transaction(async (tx) => {
    await applyTransitionEffects(tx, order.id, plan, {
      trackingCode: change.trackingCode,
      carrier: change.carrier,
    });
    await tx.order.update({ where: { id: order.id }, data: { status: change.status } });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: change.status,
        note: change.note || null,
        userId: change.userId,
      },
    });
  });

  await recordAudit({
    action: "ORDER_STATUS",
    entity: "order",
    entityId: order.id,
    userId: change.userId ?? null,
    detail: `Pedido #${order.number}: ${ORDER_STATUS_LABEL[order.status]} → ${ORDER_STATUS_LABEL[change.status]}${change.note ? ` · ${change.note}` : ""}`,
  });

  // Las notificaciones corren después de responder: el webhook de Mercado Pago y
  // las acciones no esperan SMTP/WhatsApp (evita timeouts y reintentos duplicados).
  const event = plan.event;
  if (event) {
    after(() =>
      notify({
        event,
        email: order.email,
        userId: order.userId ?? undefined,
        data: {
          firstName: order.firstName,
          orderId: order.id,
          orderNumber: order.number,
          total: order.total,
          trackingCode: change.trackingCode,
        },
      }),
    );
  }
  if (plan.alertLowStock) {
    after(() =>
      alertLowStock(order.items.map((i) => i.productId).filter((id): id is string => Boolean(id))),
    );
  }
}

async function alertLowStock(productIds: string[]): Promise<void> {
  const low = await findLowStock(productIds);
  const { email } = await getStoreSettings();
  if (!email) return;
  for (const p of low) {
    await notify({
      event: "inventory.low_stock",
      email,
      data: { productName: p.name, sku: p.sku, available: p.availableStock },
    });
  }
}
