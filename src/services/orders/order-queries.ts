import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { PaymentInstructions } from "@/services/payments/types";

export const orderDetailInclude = {
  items: { include: { product: { select: { slug: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } } } } } },
  payments: { orderBy: { createdAt: "desc" } },
  shipment: true,
  history: { orderBy: { createdAt: "asc" }, include: { user: { select: { firstName: true, lastName: true } } } },
} satisfies Prisma.OrderInclude;

export type OrderDetail = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

export interface ShippingAddressSnapshot {
  recipientName: string;
  phone: string;
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

export function readAddress(value: Prisma.JsonValue | null): ShippingAddressSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as unknown as ShippingAddressSnapshot;
}

export function readInstructions(metadata: Prisma.JsonValue | null): PaymentInstructions | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const instructions = (metadata as Record<string, unknown>).instructions;
  return instructions ? (instructions as PaymentInstructions) : null;
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  return db.order.findUnique({ where: { id: orderId }, include: orderDetailInclude });
}

export async function getUserOrder(orderId: string, userId: string): Promise<OrderDetail | null> {
  return db.order.findFirst({ where: { id: orderId, userId }, include: orderDetailInclude });
}

export async function listUserOrders(userId: string, take?: number) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, number: true, status: true, total: true, createdAt: true, _count: { select: { items: true } } },
  });
}

/** ¿El usuario compró (y no canceló) este producto? Requisito para dejar reseña. */
export async function findPurchaseOrderId(userId: string, productId: string): Promise<string | null> {
  const item = await db.orderItem.findFirst({
    where: { productId, order: { userId, status: { in: ["CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"] } } },
    select: { orderId: true },
    orderBy: { order: { createdAt: "desc" } },
  });
  return item?.orderId ?? null;
}
