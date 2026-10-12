"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { parseOrThrow, runAction } from "@/lib/actions";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, getCurrentUser } from "@/lib/auth/session";
import { checkoutSchema } from "@/schemas/checkout";
import { createOrder, type CreatedOrder } from "@/services/orders/create-order";
import type { ActionResult } from "@/types/actions";
import { LAST_ORDER_COOKIE, LAST_ORDER_MAX_AGE_S } from "./constants";

export async function placeOrderAction(payload: unknown): Promise<ActionResult<CreatedOrder>> {
  return runAction(async () => {
    if (!checkRateLimit("checkout", await getClientIp())) {
      throw new AppError("RATE_LIMITED", "Demasiados intentos de compra. Esperá unos minutos.");
    }
    const input = parseOrThrow(checkoutSchema, payload);
    const user = await getCurrentUser();
    const order = await createOrder(input, user);
    // Permite a compradores invitados ver su confirmación sin exponer pedidos ajenos.
    (await cookies()).set(LAST_ORDER_COOKIE, order.orderId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: LAST_ORDER_MAX_AGE_S,
    });
    revalidatePath("/", "layout");
    return order;
  });
}
