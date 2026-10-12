import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { ADMIN_PAGE_SIZE, totalPages, withSearchAnd, type Paginated } from "@/lib/admin/query";
import { listUserOrders } from "@/services/orders/order-queries";
import { recordAudit } from "./audit.service";

export interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  ordersCount: number;
  lastOrderAt: Date | null;
}

const customerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  isActive: true,
  emailVerifiedAt: true,
  createdAt: true,
  role: { select: { name: true } },
  orders: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

/** Usuarios del admin: búsqueda por nombre/email, filtro por rol. */
export async function listAdminCustomers(params: {
  q: string;
  role?: string;
  page: number;
}): Promise<Paginated<CustomerRow>> {
  const and: Prisma.UserWhereInput[] = [];
  withSearchAnd<Prisma.UserWhereInput>(and, params.q, [
    "firstName",
    "lastName",
    "email",
  ]);
  if (params.role) and.push({ role: { name: params.role } });
  const where: Prisma.UserWhereInput = { AND: and };
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      select: customerSelect,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);
  const items: CustomerRow[] = rows.map(
    ({ role, orders, _count, emailVerifiedAt, ...user }) => ({
      ...user,
      emailVerified: emailVerifiedAt !== null,
      role: role.name,
      ordersCount: _count.orders,
      lastOrderAt: orders[0]?.createdAt ?? null,
    }),
  );
  return { items, total, page: params.page, totalPages: totalPages(total) };
}

export interface CustomerAddress {
  label: string | null;
  recipientName: string;
  phone: string;
  street: string;
  number: string;
  floor: string | null;
  apartment: string | null;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface CustomerDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  documentType: "DNI" | "CUIT" | "CUIL" | null;
  documentNumber: string | null;
  isActive: boolean;
  emailVerified: boolean;
  marketingOptIn: boolean;
  createdAt: Date;
  role: string;
  addresses: CustomerAddress[];
  orders: Awaited<ReturnType<typeof listUserOrders>>;
}

/** Detalle de cliente: perfil, direcciones y últimos pedidos. */
export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      documentType: true,
      documentNumber: true,
      isActive: true,
      emailVerifiedAt: true,
      marketingOptIn: true,
      createdAt: true,
      role: { select: { name: true } },
      addresses: {
        orderBy: { isDefault: "desc" },
        select: {
          label: true,
          recipientName: true,
          phone: true,
          street: true,
          number: true,
          floor: true,
          apartment: true,
          city: true,
          province: true,
          postalCode: true,
          isDefault: true,
        },
      },
    },
  });
  if (!user) return null;
  const orders = await listUserOrders(id, 10);
  return {
    ...user,
    emailVerified: user.emailVerifiedAt !== null,
    role: user.role.name,
    orders,
  };
}

/** Activa/desactiva una cuenta (afecta el login). Registra auditoría. */
export async function toggleUserActive(
  id: string,
  actorId: string,
): Promise<{ isActive: boolean }> {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
  });
  if (!user) throw notFound("Usuario");
  const isActive = !user.isActive;
  await db.user.update({ where: { id }, data: { isActive } });
  await recordAudit({
    action: "USER_UPDATE",
    entity: "user",
    entityId: id,
    userId: actorId,
    detail: `${user.firstName} ${user.lastName} (${user.email}): cuenta ${isActive ? "activada" : "desactivada"}`,
  });
  return { isActive };
}
