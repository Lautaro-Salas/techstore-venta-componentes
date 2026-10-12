import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { ADMIN_PAGE_SIZE, totalPages, withSearchAnd, type Paginated } from "@/lib/admin/query";
import { formatPrice } from "@/lib/format";
import { endOfDayKeyAR, parseDayKeyAR } from "@/lib/timezone";
import { normalizeCouponCode } from "@/services/discounts/discounts.service";
import type { CouponInput, PromotionInput } from "@/schemas/admin";
import { recordAudit } from "./audit.service";

const DISCOUNT_VALUE = (type: "PERCENTAGE" | "FIXED", value: number) =>
  type === "PERCENTAGE" ? `${value}%` : formatPrice(value);

function discountDates(input: {
  startsAt: string;
  endsAt: string;
}): { startsAt: Date | null; endsAt: Date | null } {
  return {
    startsAt: input.startsAt ? parseDayKeyAR(input.startsAt) : null,
    endsAt: input.endsAt ? endOfDayKeyAR(input.endsAt) : null,
  };
}

/* ------------------------------------------------------------------ */
/*  Cupones                                                            */
/* ------------------------------------------------------------------ */

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  startsAt: Date | null;
  endsAt: Date | null;
  minSubtotal: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  categoriesCount: number;
  productsCount: number;
}

export async function listCoupons(params: {
  q: string;
  page: number;
}): Promise<Paginated<CouponRow>> {
  const and: Prisma.CouponWhereInput[] = [];
  withSearchAnd<Prisma.CouponWhereInput>(and, params.q, [
    "code",
    "description",
  ]);
  const where: Prisma.CouponWhereInput = { AND: and };
  const [rows, total] = await Promise.all([
    db.coupon.findMany({
      where,
      select: {
        id: true,
        code: true,
        description: true,
        type: true,
        value: true,
        startsAt: true,
        endsAt: true,
        minSubtotal: true,
        maxUses: true,
        usedCount: true,
        isActive: true,
        createdAt: true,
        _count: { select: { categories: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.coupon.count({ where }),
  ]);
  const items: CouponRow[] = rows.map(({ _count, ...row }) => ({
    ...row,
    categoriesCount: _count.categories,
    productsCount: _count.products,
  }));
  return { items, total, page: params.page, totalPages: totalPages(total) };
}

export interface CouponForEdit {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  startsAt: Date | null;
  endsAt: Date | null;
  minSubtotal: number | null;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  isActive: boolean;
  categories: { id: string }[];
  products: { id: string }[];
}

export async function getCouponForEdit(id: string): Promise<CouponForEdit | null> {
  return db.coupon.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      description: true,
      type: true,
      value: true,
      startsAt: true,
      endsAt: true,
      minSubtotal: true,
      maxUses: true,
      maxUsesPerUser: true,
      isActive: true,
      categories: { select: { id: true } },
      products: { select: { id: true } },
    },
  });
}

async function assertUniqueCoupon(code: string, excludeId?: string): Promise<void> {
  const existing = await db.coupon.findFirst({
    where: { code: normalizeCouponCode(code), ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("CONFLICT", "Ya existe un cupón con ese código.", {
      code: "El código ya está en uso",
    });
  }
}

export async function createCoupon(input: CouponInput, userId: string): Promise<string> {
  await assertUniqueCoupon(input.code);
  const coupon = await db.coupon.create({
    data: {
      code: normalizeCouponCode(input.code),
      description: input.description || null,
      type: input.type,
      value: input.value,
      ...discountDates(input),
      minSubtotal: input.minSubtotal,
      maxUses: input.maxUses,
      maxUsesPerUser: input.maxUsesPerUser,
      isActive: input.isActive,
      categories: { connect: input.categoryIds.map((id) => ({ id })) },
      products: { connect: input.productIds.map((id) => ({ id })) },
    },
    select: { id: true, code: true },
  });
  await recordAudit({
    action: "COUPON_CREATE",
    entity: "coupon",
    entityId: coupon.id,
    userId,
    detail: `${coupon.code}: ${DISCOUNT_VALUE(input.type, input.value)} off`,
  });
  return coupon.id;
}

export async function updateCoupon(id: string, input: CouponInput, userId: string): Promise<void> {
  const current = await db.coupon.findUnique({ where: { id }, select: { id: true } });
  if (!current) throw notFound("Cupón");
  await assertUniqueCoupon(input.code, id);
  await db.coupon.update({
    where: { id },
    data: {
      code: normalizeCouponCode(input.code),
      description: input.description || null,
      type: input.type,
      value: input.value,
      ...discountDates(input),
      minSubtotal: input.minSubtotal,
      maxUses: input.maxUses,
      maxUsesPerUser: input.maxUsesPerUser,
      isActive: input.isActive,
      categories: { set: input.categoryIds.map((cid) => ({ id: cid })) },
      products: { set: input.productIds.map((pid) => ({ id: pid })) },
    },
  });
  await recordAudit({
    action: "COUPON_UPDATE",
    entity: "coupon",
    entityId: id,
    userId,
    detail: `${normalizeCouponCode(input.code)}: ${DISCOUNT_VALUE(input.type, input.value)} off`,
  });
}

/** Borra el cupón; si ya se usó, lo desactiva para conservar el historial. */
export async function deleteCoupon(id: string, userId: string): Promise<{ archived: boolean }> {
  const coupon = await db.coupon.findUnique({
    where: { id },
    select: { id: true, code: true, _count: { select: { redemptions: true } } },
  });
  if (!coupon) throw notFound("Cupón");
  if (coupon._count.redemptions > 0) {
    await db.coupon.update({ where: { id }, data: { isActive: false } });
    await recordAudit({
      action: "COUPON_DELETE",
      entity: "coupon",
      entityId: id,
      userId,
      detail: `${coupon.code} (desactivado: ya se usó)`,
    });
    return { archived: true };
  }
  await db.coupon.delete({ where: { id } });
  await recordAudit({
    action: "COUPON_DELETE",
    entity: "coupon",
    entityId: id,
    userId,
    detail: `${coupon.code} (eliminado)`,
  });
  return { archived: false };
}

export async function toggleCoupon(id: string, userId: string): Promise<boolean> {
  const coupon = await db.coupon.findUnique({
    where: { id },
    select: { id: true, code: true, isActive: true },
  });
  if (!coupon) throw notFound("Cupón");
  const isActive = !coupon.isActive;
  await db.coupon.update({ where: { id }, data: { isActive } });
  await recordAudit({
    action: "COUPON_UPDATE",
    entity: "coupon",
    entityId: id,
    userId,
    detail: `${coupon.code}: ${isActive ? "activado" : "desactivado"}`,
  });
  return isActive;
}

/* ------------------------------------------------------------------ */
/*  Promociones automáticas                                            */
/* ------------------------------------------------------------------ */

export interface PromotionRow {
  id: string;
  name: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  startsAt: Date | null;
  endsAt: Date | null;
  minSubtotal: number | null;
  isActive: boolean;
  createdAt: Date;
  categoriesCount: number;
  productsCount: number;
}

export async function listPromotions(params: {
  q: string;
  page: number;
}): Promise<Paginated<PromotionRow>> {
  const and: Prisma.PromotionWhereInput[] = [];
  withSearchAnd<Prisma.PromotionWhereInput>(and, params.q, [
    "name",
    "description",
  ]);
  const where: Prisma.PromotionWhereInput = { AND: and };
  const [rows, total] = await Promise.all([
    db.promotion.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        value: true,
        startsAt: true,
        endsAt: true,
        minSubtotal: true,
        isActive: true,
        createdAt: true,
        _count: { select: { categories: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.promotion.count({ where }),
  ]);
  const items: PromotionRow[] = rows.map(({ _count, ...row }) => ({
    ...row,
    categoriesCount: _count.categories,
    productsCount: _count.products,
  }));
  return { items, total, page: params.page, totalPages: totalPages(total) };
}

export interface PromotionForEdit {
  id: string;
  name: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  startsAt: Date | null;
  endsAt: Date | null;
  minSubtotal: number | null;
  isActive: boolean;
  categories: { id: string }[];
  products: { id: string }[];
}

export async function getPromotionForEdit(id: string): Promise<PromotionForEdit | null> {
  return db.promotion.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      value: true,
      startsAt: true,
      endsAt: true,
      minSubtotal: true,
      isActive: true,
      categories: { select: { id: true } },
      products: { select: { id: true } },
    },
  });
}

/** Productos seleccionados de un cupón/promoción (para edición). */
export async function getDiscountProducts(
  ids: string[],
): Promise<{ id: string; name: string }[]> {
  if (ids.length === 0) return [];
  return db.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
    take: 100,
  });
}

export async function createPromotion(input: PromotionInput, userId: string): Promise<string> {
  const promotion = await db.promotion.create({
    data: {
      name: input.name,
      description: input.description || null,
      type: input.type,
      value: input.value,
      ...discountDates(input),
      minSubtotal: input.minSubtotal,
      isActive: input.isActive,
      categories: { connect: input.categoryIds.map((id) => ({ id })) },
      products: { connect: input.productIds.map((id) => ({ id })) },
    },
    select: { id: true },
  });
  await recordAudit({
    action: "PROMOTION_CREATE",
    entity: "promotion",
    entityId: promotion.id,
    userId,
    detail: `${input.name}: ${DISCOUNT_VALUE(input.type, input.value)} off`,
  });
  return promotion.id;
}

export async function updatePromotion(id: string, input: PromotionInput, userId: string): Promise<void> {
  const current = await db.promotion.findUnique({ where: { id }, select: { id: true } });
  if (!current) throw notFound("Promoción");
  await db.promotion.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description || null,
      type: input.type,
      value: input.value,
      ...discountDates(input),
      minSubtotal: input.minSubtotal,
      isActive: input.isActive,
      categories: { set: input.categoryIds.map((cid) => ({ id: cid })) },
      products: { set: input.productIds.map((pid) => ({ id: pid })) },
    },
  });
  await recordAudit({
    action: "PROMOTION_UPDATE",
    entity: "promotion",
    entityId: id,
    userId,
    detail: `${input.name}: ${DISCOUNT_VALUE(input.type, input.value)} off`,
  });
}

export async function deletePromotion(id: string, userId: string): Promise<void> {
  const promotion = await db.promotion.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!promotion) throw notFound("Promoción");
  await db.promotion.delete({ where: { id } });
  await recordAudit({
    action: "PROMOTION_DELETE",
    entity: "promotion",
    entityId: id,
    userId,
    detail: promotion.name,
  });
}

export async function togglePromotion(id: string, userId: string): Promise<boolean> {
  const promotion = await db.promotion.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true },
  });
  if (!promotion) throw notFound("Promoción");
  const isActive = !promotion.isActive;
  await db.promotion.update({ where: { id }, data: { isActive } });
  await recordAudit({
    action: "PROMOTION_UPDATE",
    entity: "promotion",
    entityId: id,
    userId,
    detail: `${promotion.name}: ${isActive ? "activada" : "desactivada"}`,
  });
  return isActive;
}
