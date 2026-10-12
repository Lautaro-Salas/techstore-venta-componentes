"use server";

import { z } from "zod";
import { parseOrThrow, runAction } from "@/lib/actions";
import { idSchema } from "@/schemas/common";
import { MAX_QUANTITY_PER_ITEM } from "@/services/cart/rules";
import * as cart from "@/services/cart/cart.service";
import { refreshCart } from "@/lib/cache/revalidate";
import type { ActionResult } from "@/types/actions";

const lineSchema = z.object({
  productId: idSchema,
  quantity: z.coerce.number().int().min(0).max(MAX_QUANTITY_PER_ITEM),
});

const refresh = refreshCart;

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<ActionResult<{ count: number }>> {
  return runAction(async () => {
    const input = parseOrThrow(lineSchema, { productId, quantity: Math.max(quantity, 1) });
    await cart.addToCart(input.productId, input.quantity);
    refresh();
    return { count: await cart.getCartCount() };
  });
}

export async function updateCartItemAction(
  productId: string,
  quantity: number,
): Promise<ActionResult> {
  return runAction(async () => {
    const input = parseOrThrow(lineSchema, { productId, quantity });
    await cart.updateCartQuantity(input.productId, input.quantity);
    refresh();
    return undefined;
  });
}

export async function removeCartItemAction(productId: string): Promise<ActionResult> {
  return runAction(async () => {
    await cart.removeFromCart(parseOrThrow(idSchema, productId));
    refresh();
    return undefined;
  });
}

export async function applyCouponAction(code: string): Promise<ActionResult> {
  return runAction(async () => {
    await cart.applyCoupon(
      parseOrThrow(z.string().trim().min(1, "Ingresá un código").max(40), code),
    );
    refresh();
    return undefined;
  });
}

export async function removeCouponAction(): Promise<ActionResult> {
  return runAction(async () => {
    await cart.removeCoupon();
    refresh();
    return undefined;
  });
}
