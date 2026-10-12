import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import {
  PAYMENT_STATUS_LABEL,
  SHIPMENT_STATUS_LABEL,
} from "@/components/admin/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order/order-status";
import { requirePermissionPage } from "@/lib/auth/guards";
import {
  formatDate,
  formatDateTime,
  formatOrderNumber,
  formatPrice,
} from "@/lib/format";
import {
  canTransition,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
} from "@/services/orders/status";
import {
  getOrderDetail,
  readAddress,
} from "@/services/orders/order-queries";
import { OrderStatusForm } from "@/features/admin/orders/order-status-form";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("orders:read", "/admin/pedidos");
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const allowed = ORDER_STATUSES.filter((s) =>
    canTransition(order.status, s),
  ).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }));
  const address = readAddress(order.shippingAddress);

  return (
    <PageTransition>
      <PageHeader
        title={`Pedido ${formatOrderNumber(order.number)}`}
        description={`${order.firstName} ${order.lastName} · ${formatDateTime(order.createdAt)}`}
        back={{ href: "/admin/pedidos", label: "Pedidos" }}
        actions={<OrderStatusBadge status={order.status} />}
      />
      {order.status === "CANCELLED" && (
        <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          Este pedido fue cancelado.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader title="Productos" />
            <CardBody>
              <ul className="flex flex-col divide-y divide-border">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted">SKU {item.sku}</p>
                    </div>
                    <span className="shrink-0 text-sm text-muted tabular-nums">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </span>
                    <span className="w-28 shrink-0 text-right text-sm font-semibold tabular-nums">
                      {formatPrice(item.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Totales" />
            <CardBody>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Descuentos</dt>
                    <dd className="tabular-nums">
                      −{formatPrice(order.discountTotal)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Envío</dt>
                  <dd className="tabular-nums">
                    {order.shippingTotal === 0
                      ? "Gratis"
                      : formatPrice(order.shippingTotal)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatPrice(order.total)}</dd>
                </div>
              </dl>
              {order.couponCode && (
                <p className="mt-2 text-xs text-muted">
                  Cupón aplicado: {order.couponCode}
                </p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Historial" />
            <CardBody>
              <ol className="flex flex-col gap-3">
                {order.history.map((h) => (
                  <li key={h.id} className="flex flex-col gap-0.5">
                    <p className="text-sm">
                      <OrderStatusBadge status={h.status} />{" "}
                      <span className="ml-2 text-xs text-muted">
                        {formatDateTime(h.createdAt)}
                      </span>
                    </p>
                    {(h.note || h.user) && (
                      <p className="text-xs text-muted">
                        {h.user
                          ? `${h.user.firstName} ${h.user.lastName}`.trim()
                          : "Sistema"}
                        {h.note ? ` · ${h.note}` : ""}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Cliente" />
            <CardBody className="flex flex-col gap-3 text-sm">
              <p className="flex items-center gap-2">
                <User className="size-4 shrink-0 text-muted" aria-hidden />
                {order.firstName} {order.lastName}
              </p>
              <p className="flex items-center gap-2 break-all">
                <Mail className="size-4 shrink-0 text-muted" aria-hidden />
                {order.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-muted" aria-hidden />
                {order.phone}
              </p>
              <p className="text-xs text-muted">
                {order.documentType} {order.documentNumber} ·{" "}
                {order.invoiceType === "FACTURA_A" ? "Factura A" : "Consumidor final"}
                {order.businessName ? ` · ${order.businessName}` : ""}
              </p>
              {order.notes && (
                <p className="rounded-xl bg-surface-2 p-3 text-xs text-muted">
                  Nota: {order.notes}
                </p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Envío" />
            <CardBody className="flex flex-col gap-3 text-sm">
              <p>
                <span className="text-muted">Método: </span>
                {order.shippingMethodName}
              </p>
              <p>
                <span className="text-muted">Pago: </span>
                {order.paymentMethodName}
              </p>
              {address ? (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                  <span>
                    {address.recipientName} · {address.street}{" "}
                    {address.number}
                    {address.floor ? ` Piso ${address.floor}` : ""}
                    {address.apartment ? ` Dto ${address.apartment}` : ""},{" "}
                    {address.city}, {address.province} ({address.postalCode})
                    {address.notes ? ` · ${address.notes}` : ""}
                  </span>
                </p>
              ) : (
                <p className="text-muted">Retiro en local.</p>
              )}
              {order.shipment && (
                <div className="rounded-xl bg-surface-2 p-3 text-xs">
                  <p>
                    <span className="text-muted">Estado: </span>
                    <Badge tone="neutral">
                      {SHIPMENT_STATUS_LABEL[order.shipment.status]}
                    </Badge>
                  </p>
                  {order.shipment.carrier && (
                    <p className="mt-1">
                      <span className="text-muted">Transportista: </span>
                      {order.shipment.carrier}
                    </p>
                  )}
                  {order.shipment.trackingCode && (
                    <p>
                      <span className="text-muted">Seguimiento: </span>
                      {order.shipment.trackingCode}
                    </p>
                  )}
                  {order.shipment.shippedAt && (
                    <p className="mt-1 text-muted">
                      Despachado {formatDate(order.shipment.shippedAt)}
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Pagos" />
            <CardBody>
              {order.payments.length === 0 ? (
                <p className="text-sm text-muted">Sin registros de pago.</p>
              ) : (
                <ul className="flex flex-col gap-3 text-sm">
                  {order.payments.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl bg-surface-2 p-3"
                    >
                      <p className="flex justify-between">
                        <span className="font-medium">{p.provider}</span>
                        <span className="tabular-nums">{formatPrice(p.amount)}</span>
                      </p>
                      <p className="mt-1 flex items-center justify-between text-xs text-muted">
                        <span>
                          {p.installments > 1 ? `${p.installments} cuotas · ` : ""}
                          {formatDateTime(p.createdAt)}
                        </span>
                        <Badge
                          tone={
                            p.status === "APPROVED"
                              ? "success"
                              : p.status === "REJECTED" || p.status === "CANCELLED"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {PAYMENT_STATUS_LABEL[p.status]}
                        </Badge>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <OrderStatusForm
            order={{ id: order.id, number: order.number, status: order.status }}
            allowed={allowed}
            shipment={
              order.shipment
                ? {
                    carrier: order.shipment.carrier,
                    trackingCode: order.shipment.trackingCode,
                  }
                : null
            }
          />
        </div>
      </div>
    </PageTransition>
  );
}
