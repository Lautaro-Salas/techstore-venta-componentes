import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { changeOrderStatus } from "@/services/orders/order-status.service";
import {
  fetchMercadoPagoPayment,
  verifyMercadoPagoSignature,
  type MercadoPagoPayment,
} from "@/services/payments/providers/mercadopago";
import { revalidateOrders } from "@/lib/cache/revalidate";

const STATUS_MAP: Partial<
  Record<MercadoPagoPayment["status"], "APPROVED" | "REJECTED" | "CANCELLED" | "REFUNDED">
> = {
  approved: "APPROVED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

/**
 * Notificaciones de pago de Mercado Pago. Se ignora si no hay credenciales o la firma es inválida.
 * El estado real se consulta siempre a la API (nunca se confía en el body).
 */
export async function POST(request: NextRequest) {
  if (!getEnv().MP_ACCESS_TOKEN)
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 404 });

  const dataId = request.nextUrl.searchParams.get("data.id") ?? "";
  const valid = verifyMercadoPagoSignature({
    signatureHeader: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!dataId || !valid) return NextResponse.json({ error: "Firma inválida" }, { status: 401 });

  try {
    const mp = await fetchMercadoPagoPayment(dataId);
    const status = STATUS_MAP[mp.status];
    if (!mp.external_reference || !status) return NextResponse.json({ received: true });

    const order = await db.order.findUnique({
      where: { id: mp.external_reference },
      select: { id: true, status: true, total: true },
    });
    if (!order) return NextResponse.json({ received: true });

    // El importe cobrado debe coincidir con el total que el checkout mostró y que
    // quedó persistido en el pedido: la preferencia (cobro itemizado) suma
    // productos + envío - descuentos = order.total (ver charge.ts). Si algún día
    // difiere, no se confirma el pedido y queda visible en el admin.
    if (status === "APPROVED") {
      const expectedCents = Math.round(order.total * 100);
      const paidCents = Math.round(mp.transaction_amount * 100);
      if (paidCents !== expectedCents) {
        logger.warn(
          "Pago de Mercado Pago con importe distinto al esperado: no se confirma el pedido",
          {
            orderId: order.id,
            dataId,
            expectedCents,
            paidCents,
            orderStatus: order.status,
          },
        );
        return NextResponse.json({ received: true });
      }
    }

    await db.payment.updateMany({
      where: { orderId: order.id, provider: "mercadopago" },
      data: { status, externalId: String(mp.id), installments: mp.installments },
    });
    if (status === "APPROVED" && order.status === "PENDING") {
      await changeOrderStatus({
        orderId: order.id,
        status: "CONFIRMED",
        note: "Pago aprobado por Mercado Pago",
      });
      revalidateOrders(order.id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Error procesando webhook de Mercado Pago", error, { dataId });
    return NextResponse.json({ error: "Error procesando la notificación" }, { status: 500 });
  }
}
