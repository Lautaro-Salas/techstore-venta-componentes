import "server-only";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { addDays, dayKeyAR, startOfDayAR, startOfMonthAR } from "@/lib/timezone";
import { ORDER_STATUSES } from "@/services/orders/status";
import { getInventorySummary, listInventory } from "./inventory.service";

/** Solo estos estados cuentan como venta concretada. */
export const SALE_STATUSES: OrderStatus[] = ["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"];
export const SALES_CHART_DAYS = 14;
const RECENT_LIMIT = 5;

export interface DashboardMetrics {
  salesToday: number;
  salesMonth: number;
  ordersMonth: number;
  averageTicket: number;
  unitsSoldMonth: number;
  customers: number;
  lowStock: number;
  outOfStock: number;
}

export async function getDashboardMetrics(now = new Date()): Promise<DashboardMetrics> {
  const sale = { status: { in: SALE_STATUSES } };
  const monthStart = startOfMonthAR(now);
  const [today, month, units, customers, stock] = await Promise.all([
    db.order.aggregate({ where: { ...sale, createdAt: { gte: startOfDayAR(now) } }, _sum: { total: true } }),
    db.order.aggregate({ where: { ...sale, createdAt: { gte: monthStart } }, _sum: { total: true }, _count: { _all: true } }),
    db.orderItem.aggregate({ where: { order: { ...sale, createdAt: { gte: monthStart } } }, _sum: { quantity: true } }),
    db.user.count({ where: { role: { name: "CUSTOMER" } } }),
    getInventorySummary(),
  ]);
  const salesMonth = month._sum.total ?? 0;
  const ordersMonth = month._count._all;
  return {
    salesToday: today._sum.total ?? 0,
    salesMonth,
    ordersMonth,
    averageTicket: ordersMonth > 0 ? Math.round(salesMonth / ordersMonth) : 0,
    unitsSoldMonth: units._sum.quantity ?? 0,
    customers,
    lowStock: stock.low,
    outOfStock: stock.out,
  };
}

/** Ventas por día (horario argentino) de los últimos N días, incluyendo hoy. */
export async function getDailySales(now = new Date(), days = SALES_CHART_DAYS): Promise<{ day: string; total: number }[]> {
  const from = addDays(startOfDayAR(now), -(days - 1));
  const orders = await db.order.findMany({
    where: { status: { in: SALE_STATUSES }, createdAt: { gte: from } },
    select: { createdAt: true, total: true },
  });
  const totals = new Map<string, number>();
  for (let i = 0; i < days; i++) totals.set(dayKeyAR(addDays(from, i)), 0);
  for (const o of orders) {
    const key = dayKeyAR(o.createdAt);
    totals.set(key, (totals.get(key) ?? 0) + o.total);
  }
  return [...totals.entries()].map(([day, total]) => ({ day, total }));
}

/** Pedidos del mes agrupados por estado (incluye estados sin pedidos). */
export async function getOrdersByStatus(now = new Date()): Promise<{ status: OrderStatus; count: number }[]> {
  const rows = await db.order.groupBy({
    by: ["status"],
    where: { createdAt: { gte: startOfMonthAR(now) } },
    _count: { _all: true },
  });
  return ORDER_STATUSES.map((status) => ({ status, count: rows.find((r) => r.status === status)?._count._all ?? 0 }));
}

export async function getRecentOrders() {
  return db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: RECENT_LIMIT,
    select: { id: true, number: true, firstName: true, lastName: true, status: true, total: true, createdAt: true },
  });
}

export async function getLowStockPreview() {
  const { items } = await listInventory({ filter: "alerta", q: "", page: 1, pageSize: RECENT_LIMIT });
  return items;
}
