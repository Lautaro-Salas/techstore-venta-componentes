import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ADMIN_PAGE_SIZE, totalPages, withSearchAnd, type Paginated } from "@/lib/admin/query";
import type { OrderStatus } from "@prisma/client";

export interface OrderRow {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  email: string;
  status: OrderStatus;
  total: number;
  couponCode: string | null;
  createdAt: Date;
  items: number;
}

const rowSelect = {
  id: true,
  number: true,
  firstName: true,
  lastName: true,
  email: true,
  status: true,
  total: true,
  couponCode: true,
  createdAt: true,
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect;

/** Pedidos del admin: búsqueda por número, email o nombre; filtro por estado. */
export async function listAdminOrders(params: {
  q: string;
  status?: OrderStatus;
  page: number;
}): Promise<Paginated<OrderRow>> {
  const and: Prisma.OrderWhereInput[] = [];
  if (params.q) {
    const number = Number.parseInt(params.q, 10);
    withSearchAnd<Prisma.OrderWhereInput>(and, params.q, [
      "email",
      "firstName",
      "lastName",
    ]);
    if (Number.isFinite(number)) {
      and.push({ number });
    }
  }
  if (params.status) and.push({ status: params.status });
  const where: Prisma.OrderWhereInput = { AND: and };
  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      select: rowSelect,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);
  const items = rows.map(({ _count, ...row }) => ({ ...row, items: _count.items }));
  return { items, total, page: params.page, totalPages: totalPages(total) };
}
