import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import {
  DeliveryInfo,
  OrderItemsList,
  OrderTotals,
  PaymentInstructionsCard,
} from "@/components/order/order-detail-view";
import { OrderStatusBadge, OrderTimeline } from "@/components/order/order-status";
import { requireUserPage } from "@/lib/auth/guards";
import { formatDateTime, formatOrderNumber } from "@/lib/format";
import { getUserOrder } from "@/services/orders/order-queries";
import { ORDER_STATUS_LABEL } from "@/services/orders/status";

export const metadata: Metadata = { title: "Detalle del pedido" };

const PAYMENT_STATUS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reintegrado",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/cuenta/pedidos/${id}`);
  const order = await getUserOrder(id, user.id);
  if (!order) notFound();
  const payment = order.payments[0];

  return (
    <PageTransition key={id}>
      <div className="flex flex-col gap-5">
        <Link
          href="/cuenta/pedidos"
          className="text-muted hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden /> Mis pedidos
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pedido {formatOrderNumber(order.number)}
            </h1>
            <p className="text-muted text-sm">Realizado el {formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="card p-5">
          <OrderTimeline status={order.status} />
        </div>
        <PaymentInstructionsCard order={order} />
        <div className="grid gap-5 md:grid-cols-2">
          <section className="card p-5">
            <h2 className="mb-2 font-semibold">Entrega</h2>
            <DeliveryInfo order={order} />
          </section>
          <section className="card p-5">
            <h2 className="mb-2 font-semibold">Pago</h2>
            <p className="text-sm font-medium">{order.paymentMethodName}</p>
            {payment && (
              <p className="text-muted mt-1 text-sm">
                Estado: {PAYMENT_STATUS[payment.status] ?? payment.status}
                {payment.installments > 1 && ` · ${payment.installments} cuotas`}
              </p>
            )}
            <p className="text-muted mt-2 text-sm">
              Facturación:{" "}
              {order.invoiceType === "FACTURA_A"
                ? `Factura A · ${order.businessName ?? ""}`
                : "Consumidor final"}
            </p>
          </section>
        </div>
        <section className="card p-5">
          <h2 className="mb-2 font-semibold">Productos</h2>
          <OrderItemsList order={order} />
          <div className="border-border mt-4 border-t pt-4">
            <OrderTotals order={order} />
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Historial</h2>
          <ol className="border-border flex flex-col gap-3 border-l pl-4">
            {order.history.map((h) => (
              <li key={h.id} className="text-sm">
                <p className="font-medium">{ORDER_STATUS_LABEL[h.status]}</p>
                <p className="text-muted text-xs">
                  {formatDateTime(h.createdAt)}
                  {h.note ? ` · ${h.note}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </section>
        {order.status === "DELIVERED" && (
          <p className="text-muted text-sm">
            ¿Qué te parecieron tus productos? Dejá tu reseña desde la página de cada producto.
          </p>
        )}
        <p className="text-muted text-sm">
          ¿Necesitás ayuda con este pedido?{" "}
          <Link href="/contacto" className="text-primary font-medium hover:underline">
            Contactanos
          </Link>{" "}
          indicando el número {formatOrderNumber(order.number)}.
        </p>
      </div>
    </PageTransition>
  );
}
