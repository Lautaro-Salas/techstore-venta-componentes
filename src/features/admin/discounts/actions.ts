"use server";

import { parseOrThrow, runAction } from "@/lib/actions";
import { requirePermission } from "@/lib/auth/guards";
import { idSchema } from "@/schemas/common";
import {
  couponSchema,
  promotionSchema,
  type CouponFormValues,
  type PromotionFormValues,
} from "@/schemas/admin";
import * as discounts from "@/services/admin/discounts.service";
import { db } from "@/lib/db";
import { revalidateDiscounts } from "@/lib/cache/revalidate";
import type { DiscountFormValues } from "./discount-form-values";
import type { ActionResult } from "@/types/actions";

export async function saveCouponAction(
  values: DiscountFormValues,
  couponId?: string,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requirePermission("discounts:write");
    const input = parseOrThrow(couponSchema, values as unknown as CouponFormValues);
    let id: string;
    if (couponId) {
      id = parseOrThrow(idSchema, couponId);
      await discounts.updateCoupon(id, input, user.id);
    } else {
      id = await discounts.createCoupon(input, user.id);
    }
    revalidateDiscounts();
    return { id };
  });
}

export async function deleteCouponAction(
  couponId: string,
): Promise<ActionResult<{ archived: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("discounts:write");
    const result = await discounts.deleteCoupon(parseOrThrow(idSchema, couponId), user.id);
    revalidateDiscounts();
    return result;
  });
}

export async function toggleCouponAction(
  couponId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("discounts:write");
    const isActive = await discounts.toggleCoupon(parseOrThrow(idSchema, couponId), user.id);
    revalidateDiscounts();
    return { isActive };
  });
}

export async function savePromotionAction(
  values: DiscountFormValues,
  promotionId?: string,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requirePermission("discounts:write");
    const input = parseOrThrow(promotionSchema, values as unknown as PromotionFormValues);
    let id: string;
    if (promotionId) {
      id = parseOrThrow(idSchema, promotionId);
      await discounts.updatePromotion(id, input, user.id);
    } else {
      id = await discounts.createPromotion(input, user.id);
    }
    revalidateDiscounts();
    return { id };
  });
}

export async function deletePromotionAction(
  promotionId: string,
): Promise<ActionResult<{ archived: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("discounts:write");
    await discounts.deletePromotion(parseOrThrow(idSchema, promotionId), user.id);
    revalidateDiscounts();
    return { archived: false };
  });
}

export async function togglePromotionAction(
  promotionId: string,
): Promise<ActionResult<{ isActive: boolean }>> {
  return runAction(async () => {
    const user = await requirePermission("discounts:write");
    const isActive = await discounts.togglePromotion(parseOrThrow(idSchema, promotionId), user.id);
    revalidateDiscounts();
    return { isActive };
  });
}

export interface DiscountProductOption {
  id: string;
  name: string;
  sku: string;
  price: number;
}

/** Busca productos para incluir en un cupón o promoción. */
export async function searchDiscountProducts(
  q: string,
): Promise<ActionResult<DiscountProductOption[]>> {
  return runAction(async () => {
    await requirePermission("discounts:write");
    const query = q.trim().slice(0, 60);
    if (query.length < 2) return [];
    return db.product.findMany({
      where: { OR: [{ name: { contains: query } }, { sku: { contains: query } }] },
      select: { id: true, name: true, sku: true, price: true },
      orderBy: { name: "asc" },
      take: 20,
    });
  });
}
