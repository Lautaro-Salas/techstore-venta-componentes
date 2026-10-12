import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/auth/session";
import { ADMIN_PAGE_SIZE, totalPages, withSearchAnd, type Paginated } from "@/lib/admin/query";

/** Acciones que quedan registradas en el log unificado del panel. */
export const AUDIT_ACTIONS = [
  "PRODUCT_CREATE",
  "PRODUCT_UPDATE",
  "PRODUCT_PRICE_CHANGE",
  "PRODUCT_DELETE",
  "PRODUCT_DUPLICATE",
  "STOCK_ADJUST",
  "ORDER_STATUS",
  "COUPON_CREATE",
  "COUPON_UPDATE",
  "COUPON_DELETE",
  "PROMOTION_CREATE",
  "PROMOTION_UPDATE",
  "PROMOTION_DELETE",
  "CATEGORY_CREATE",
  "CATEGORY_UPDATE",
  "CATEGORY_DELETE",
  "BRAND_CREATE",
  "BRAND_UPDATE",
  "BRAND_DELETE",
  "SETTINGS_UPDATE",
  "MESSAGE_STATUS",
  "USER_UPDATE",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITIES = [
  "product",
  "order",
  "inventory",
  "coupon",
  "promotion",
  "category",
  "brand",
  "settings",
  "message",
  "user",
] as const;

export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

const DETAIL_LIMIT = 500;

async function clientIp(): Promise<string | null> {
  try {
    return await getClientIp();
  } catch {
    return null;
  }
}

export interface AuditInput {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  userId?: string | null;
  detail?: string | null;
}

/**
 * Registro de auditoría unificado. Nunca lanza: un fallo del log no puede
 * romper la operación del administrador.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        userId: input.userId ?? null,
        detail: input.detail ? input.detail.slice(0, DETAIL_LIMIT) : null,
        ip: await clientIp(),
      },
    });
  } catch (error) {
    logger.error("No se pudo registrar la acción en la auditoría", error);
  }
}

export interface AuditLogRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  ip: string | null;
  createdAt: Date;
  user: { firstName: string; lastName: string; email: string } | null;
}

const auditSelect = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  detail: true,
  ip: true,
  createdAt: true,
  user: { select: { firstName: true, lastName: true, email: true } },
} satisfies Prisma.AuditLogSelect;

/** Log de acciones administrativas, más recientes primero. */
export async function listAuditLogs(params: {
  q: string;
  action?: string;
  entity?: string;
  page: number;
}): Promise<Paginated<AuditLogRow>> {
  const and: Prisma.AuditLogWhereInput[] = [];
  if (params.q) {
    withSearchAnd<Prisma.AuditLogWhereInput>(and, params.q, [
      "detail",
      "entityId",
    ]);
    const term = params.q.trim();
    if (term) {
      and.push({
        user: {
          OR: [
            { firstName: { contains: term } },
            { lastName: { contains: term } },
            { email: { contains: term } },
          ],
        },
      });
    }
  }
  if (params.action) and.push({ action: params.action });
  if (params.entity) and.push({ entity: params.entity });
  const where: Prisma.AuditLogWhereInput = { AND: and };
  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      select: auditSelect,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
  ]);
  return { items, total, page: params.page, totalPages: totalPages(total) };
}
