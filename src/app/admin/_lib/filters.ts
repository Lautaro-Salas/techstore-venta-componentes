import type { OrderStatus, ProductStatus } from "@prisma/client";

import { ORDER_STATUSES } from "@/services/orders/status";
import { CONTACT_STATUSES } from "@/schemas/admin";
import { PRODUCT_STATUSES } from "@/schemas/admin";
import {
  PRODUCT_SORTS,
  type ProductSort,
} from "@/services/admin/products.service";

export function statusFromParam(
  value: string | undefined,
  statuses: readonly string[],
): string | undefined {
  if (!value) return undefined;
  return statuses.includes(value) ? value : undefined;
}

export function readOrderStatus(
  value: string | undefined,
): OrderStatus | undefined {
  if (!value) return undefined;
  return (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : undefined;
}

export function readProductStatus(
  value: string | undefined,
): ProductStatus | undefined {
  if (!value) return undefined;
  return (PRODUCT_STATUSES as readonly string[]).includes(value)
    ? (value as ProductStatus)
    : undefined;
}

export function readContactStatus(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  return (CONTACT_STATUSES as readonly string[]).includes(value)
    ? value
    : undefined;
}

export function readSort<T extends readonly string[]>(
  value: string | undefined,
  sorts: T,
): T[number] | undefined {
  if (!value) return undefined;
  return sorts.includes(value) ? (value as T[number]) : undefined;
}

export function readProductSort(value: string | undefined): ProductSort | undefined {
  if (!value) return undefined;
  return (PRODUCT_SORTS as readonly string[]).includes(value)
    ? (value as ProductSort)
    : undefined;
}
