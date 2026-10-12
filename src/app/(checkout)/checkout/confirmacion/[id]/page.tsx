import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import {
  DeliveryInfo,
  OrderItemsList,
  OrderTotals,
  PaymentInstructionsCard,
} from "@/components/order/order-detail-view";
import { OrderStatusBadge } from "@/components/order/order-status";
import { ButtonLink } from "@/components/ui/button";
import { LAST_ORDER_COOKIE } from "@/features/checkout/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { formatOrderNumber } from "@/lib/format";
import { getOrderDetail } from "@/services/orders/order-queries";

export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false } };

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, user, jar] = await Promise.all([getOrderDetail(id), getCurrentUser(), cookies()]);
  const canView =
    order && ((user && order.userId === user.id) || jar.get(LAST_ORDER_COOKIE)?.value === order.id);
  if (!order || !canView) notFound();

  return (
    <PageTransition key={id}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="text-success size-14" aria-hidden />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            ¡Gracias por tu compra, {order.firstName}!
          </h1>
          <p className="text-muted">
            Tu pedido <strong className="text-foreground">{formatOrderNumber(order.number)}</strong>{" "}
            fue registrado.
          </p>
          <OrderStatusBadge status={order.status} />
          <p className="text-muted flex items-center gap-2 text-sm">
            <Mail className="size-4" aria-hidden /> Te enviamos el detalle a {order.email}
          </p>
        </div>

        <PaymentInstructionsCard order={order} />

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="card p-5">
            <h2 className="mb-2 font-semibold">Entrega</h2>
            <DeliveryInfo order={order} />
          </section>
          <section className="card p-5">
            <h2 className="mb-2 font-semibold">Pago</h2>
            <p className="text-sm font-medium">{order.paymentMethodName}</p>
            <p className="text-muted mt-1 text-sm">
              {order.payments[0]?.status === "APPROVED"
                ? "Pago acreditado"
                : "Pago pendiente de acreditación"}
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

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <ButtonLink href={`/cuenta/pedidos/${order.id}`}>Ver mi pedido</ButtonLink>
          ) : (
            <ButtonLink href="/registro">Crear cuenta para seguir tus pedidos</ButtonLink>
          )}
          <ButtonLink href="/" variant="outline">
            Seguir comprando
          </ButtonLink>
        </div>
      </div>
    </PageTransition>
  );
}
