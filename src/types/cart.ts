import type { Benefit } from "@/services/cart/rules";
import type { ProductCardData } from "./catalog";

export interface CartLineView {
  productId: string;
  quantity: number;
  product: ProductCardData;
  lineTotal: number;
  /** Mensaje si la cantidad pedida supera el stock o el producto no está disponible. */
  issue: string | null;
}

export interface CartView {
  id: string | null;
  lines: CartLineView[];
  itemCount: number;
  subtotal: number;
  promotionName: string | null;
  promotionDiscount: number;
  couponCode: string | null;
  couponDiscount: number;
  couponError: string | null;
  discountTotal: number;
  total: number;
  benefits: Benefit[];
  freeShippingThreshold: number | null;
  hasIssues: boolean;
}

export const EMPTY_CART: CartView = {
  id: null,
  lines: [],
  itemCount: 0,
  subtotal: 0,
  promotionName: null,
  promotionDiscount: 0,
  couponCode: null,
  couponDiscount: 0,
  couponError: null,
  discountTotal: 0,
  total: 0,
  benefits: [],
  freeShippingThreshold: null,
  hasIssues: false,
};
