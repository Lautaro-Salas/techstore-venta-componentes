import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AtSign, CalendarDays, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { ROLE_LABEL } from "@/components/admin/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AdminTable } from "@/components/admin/admin-table";
import { OrderStatusBadge } from "@/components/order/order-status";
import { requirePermissionPage } from "@/lib/auth/guards";
import { formatDate, formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import { getCustomerDetail } from "@/services/admin/customers.service";

export const metadata: Metadata = { title: "Detalle del cliente" };

const ORDER_HEAD = [
  { label: "Pedido" },
  { label: "Fecha" },
  { label: "Items", className: "text-right" },
  { label: "Total", className: "text-right" },
  { label: "Estado" },
];

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("customers:read", "/admin/clientes");
  const { id } = await params;
  const customer = await getCustomerDetail(id);
  if (!customer) notFound();

  const name = `${customer.firstName} ${customer.lastName}`.trim();

  return (
    <PageTransition>
      <PageHeader
        title={name}
        description={`Registrado el ${formatDateTime(customer.createdAt)}`}
        back={{ href: "/admin/clientes", label: "Clientes" }}
        actions={
          <Badge tone={customer.isActive ? "success" : "danger"}>
            {customer.isActive ? "Cuenta activa" : "Cuenta inactiva"}
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Perfil" />
            <CardBody className="flex flex-col gap-3 text-sm">
              <p className="flex items-center gap-2">
                <User className="size-4 shrink-0 text-muted" aria-hidden />
                {name}
              </p>
              <p className="flex items-center gap-2 break-all">
                <Mail className="size-4 shrink-0 text-muted" aria-hidden />
                {customer.email}
              </p>
              {customer.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-muted" aria-hidden />
                  {customer.phone}
                </p>
              )}
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0 text-muted" aria-hidden />
                <span>
                  Rol: <Badge tone={customer.role === "CUSTOMER" ? "neutral" : "primary"}>{ROLE_LABEL[customer.role] ?? customer.role}</Badge>
                </span>
              </p>
              <p className="flex items-center gap-2 text-xs text-muted">
                <AtSign className="size-4 shrink-0" aria-hidden />
                Email {customer.emailVerified ? "verificado" : "sin verificar"}
                {customer.marketingOptIn ? " · Suscrito a novedades" : ""}
              </p>
              {customer.documentType && (
                <p className="text-xs text-muted">
                  {customer.documentType} {customer.documentNumber}
                </p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Direcciones" />
            <CardBody>
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-muted">Sin direcciones guardadas.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {customer.addresses.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-xl bg-surface-2 p-3 text-sm"
                    >
                      <p className="font-medium">
                        {a.label || "Dirección"}
                        {a.isDefault && (
                          <span className="ml-2 text-xs text-muted">predeterminada</span>
                        )}
                      </p>
                      <p className="mt-1 text-muted">
                        {a.recipientName} · {a.street} {a.number}
                        {a.floor ? ` Piso ${a.floor}` : ""}
                        {a.apartment ? ` Dto ${a.apartment}` : ""}, {a.city},{" "}
                        {a.province} ({a.postalCode})
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                        <Phone className="size-3" aria-hidden /> {a.phone}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
        <Card className="xl:col-span-2">
          <CardHeader
            title="Últimos pedidos"
            description={`${customer.orders.length} mostrados`}
          />
          <CardBody>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-muted">
                Todavía no hizo compras.
              </p>
            ) : (
              <AdminTable caption="Últimos pedidos del cliente" head={ORDER_HEAD} minWidth="min-w-[560px]">
                <tbody>
                  {customer.orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {formatOrderNumber(o.number)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        <CalendarDays className="mr-1 inline size-3.5" aria-hidden />
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="text-right tabular-nums">{o._count.items}</td>
                      <td className="text-right font-medium tabular-nums">
                        {formatPrice(o.total)}
                      </td>
                      <td>
                        <OrderStatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            )}
          </CardBody>
        </Card>
      </div>
    </PageTransition>
  );
}
