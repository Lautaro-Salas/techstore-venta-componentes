import { dayKeyAR } from "@/lib/timezone";
import type {
  CouponForEdit,
  PromotionForEdit,
} from "@/services/admin/discounts.service";

/** Valores del formulario unificado de cupones y promociones. */
export interface DiscountFormValues {
  code: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  startsAt: string;
  endsAt: string;
  minSubtotal: string;
  maxUses: string;
  maxUsesPerUser: string;
  categoryIds: string[];
  productIds: string[];
  isActive: boolean;
}

export interface SelectedProduct {
  id: string;
  name: string;
}

export function emptyDiscountValues(): DiscountFormValues {
  return {
    code: "",
    name: "",
    description: "",
    type: "PERCENTAGE",
    value: "",
    startsAt: "",
    endsAt: "",
    minSubtotal: "",
    maxUses: "",
    maxUsesPerUser: "",
    categoryIds: [],
    productIds: [],
    isActive: true,
  };
}

const num = (value: number | null): string =>
  value === null ? "" : String(value);

const dates = (startsAt: Date | null, endsAt: Date | null) => ({
  startsAt: startsAt ? dayKeyAR(startsAt) : "",
  endsAt: endsAt ? dayKeyAR(endsAt) : "",
});

export function couponToFormValues(
  coupon: CouponForEdit,
): DiscountFormValues {
  return {
    code: coupon.code,
    name: "",
    description: coupon.description ?? "",
    type: coupon.type,
    value: String(coupon.value),
    ...dates(coupon.startsAt, coupon.endsAt),
    minSubtotal: num(coupon.minSubtotal),
    maxUses: num(coupon.maxUses),
    maxUsesPerUser: num(coupon.maxUsesPerUser),
    categoryIds: coupon.categories.map((c) => c.id),
    productIds: coupon.products.map((p) => p.id),
    isActive: coupon.isActive,
  };
}

export function promotionToFormValues(
  promotion: PromotionForEdit,
): DiscountFormValues {
  return {
    code: "",
    name: promotion.name,
    description: promotion.description ?? "",
    type: promotion.type,
    value: String(promotion.value),
    ...dates(promotion.startsAt, promotion.endsAt),
    minSubtotal: num(promotion.minSubtotal),
    maxUses: "",
    maxUsesPerUser: "",
    categoryIds: promotion.categories.map((c) => c.id),
    productIds: promotion.products.map((p) => p.id),
    isActive: promotion.isActive,
  };
}
