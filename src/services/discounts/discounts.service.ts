import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { CouponRule, DiscountRule } from "./rules";

const ruleInclude = {
  categories: { select: { id: true } },
  products: { select: { id: true } },
} satisfies Prisma.PromotionInclude;

export async function getActivePromotions(now = new Date()): Promise<DiscountRule[]> {
  const rows = await db.promotion.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    include: ruleInclude,
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    value: p.value,
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    minSubtotal: p.minSubtotal,
    isActive: p.isActive,
    productIds: p.products.map((x) => x.id),
    categoryIds: p.categories.map((x) => x.id),
  }));
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function getCouponRule(code: string): Promise<CouponRule | null> {
  const coupon = await db.coupon.findUnique({ where: { code: normalizeCouponCode(code) }, include: ruleInclude });
  if (!coupon) return null;
  return {
    id: coupon.id,
    code: coupon.code,
    name: `Cupón ${coupon.code}`,
    type: coupon.type,
    value: coupon.value,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    minSubtotal: coupon.minSubtotal,
    isActive: coupon.isActive,
    maxUses: coupon.maxUses,
    maxUsesPerUser: coupon.maxUsesPerUser,
    usedCount: coupon.usedCount,
    productIds: coupon.products.map((x) => x.id),
    categoryIds: coupon.categories.map((x) => x.id),
  };
}

export async function countCouponUses(couponId: string, who: { userId?: string; email?: string }): Promise<number> {
  const or: Prisma.CouponRedemptionWhereInput[] = [];
  if (who.userId) or.push({ userId: who.userId });
  if (who.email) or.push({ email: who.email });
  if (or.length === 0) return 0;
  return db.couponRedemption.count({ where: { couponId, OR: or } });
}
