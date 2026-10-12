import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth/session";
import { productCardInclude, toProductCard } from "@/services/catalog/mappers";
import { countCouponUses, getActivePromotions, getCouponRule, normalizeCouponCode } from "@/services/discounts/discounts.service";
import { evaluateCoupon } from "@/services/discounts/rules";
import { lowestFreeShippingThreshold } from "@/services/shipping/shipping.service";
import { EMPTY_CART, type CartLineView, type CartView } from "@/types/cart";
import { MAX_QUANTITY_PER_ITEM, calculateCartTotals, type CartTotalsInput } from "./rules";

export const CART_COOKIE = "ts_cart";
const CART_COOKIE_DAYS = 60;
const DAY_SECONDS = 86_400;

async function setCartCookie(cartId: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_DAYS * DAY_SECONDS,
  });
}

/** Carrito de la request: del usuario logueado o el de invitado por cookie. */
async function findCurrentCartId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) {
    const cart = await db.cart.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (cart) return cart.id;
  }
  const cookieId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cookieId) return null;
  const guest = await db.cart.findFirst({ where: { id: cookieId, userId: null }, select: { id: true } });
  return guest?.id ?? null;
}

/** Solo en server actions (escribe cookies). */
async function getOrCreateCartId(): Promise<string> {
  const existing = await findCurrentCartId();
  if (existing) return existing;
  const user = await getCurrentUser();
  const cart = await db.cart.create({ data: { userId: user?.id } });
  if (!user) await setCartCookie(cart.id);
  return cart.id;
}

export interface CartContext {
  paymentDiscountPercent?: number;
  shipping?: CartTotalsInput["shipping"];
  email?: string;
}

export async function loadCart(cartId: string | null, ctx: CartContext = {}): Promise<CartView & { totals: ReturnType<typeof calculateCartTotals> }> {
  const empty = { ...EMPTY_CART, totals: calculateCartTotals({ lines: [] }) };
  if (!cartId) return empty;
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { items: { orderBy: { createdAt: "asc" }, include: { product: { include: productCardInclude } } } },
  });
  if (!cart) return empty;

  const lines: CartLineView[] = cart.items.map((item) => {
    const product = toProductCard(item.product);
    let issue: string | null = null;
    if (item.product.status !== "ACTIVE") issue = "Este producto ya no está disponible.";
    else if (product.available === 0) issue = "Sin stock en este momento.";
    else if (item.quantity > product.available) issue = `Solo quedan ${product.available} unidades.`;
    return { productId: item.productId, quantity: item.quantity, product, lineTotal: product.price * item.quantity, issue };
  });

  const validLines = lines.filter((l) => !l.issue);
  const discountLines = validLines.map((l) => ({
    productId: l.productId,
    categoryId: l.product.category.id,
    unitPrice: l.product.price,
    quantity: l.quantity,
  }));

  const user = await getCurrentUser();
  const couponRule = cart.couponCode ? await getCouponRule(cart.couponCode) : null;
  const [promotions, freeShippingThreshold, userUses] = await Promise.all([
    getActivePromotions(),
    lowestFreeShippingThreshold(),
    couponRule ? countCouponUses(couponRule.id, { userId: user?.id, email: ctx.email ?? user?.email }) : Promise.resolve(0),
  ]);

  const totals = calculateCartTotals({
    lines: discountLines,
    promotions,
    coupon: couponRule ? { rule: couponRule, userUses } : null,
    shipping: ctx.shipping,
    paymentDiscountPercent: ctx.paymentDiscountPercent,
    freeShippingThreshold,
  });

  return {
    id: cart.id,
    lines,
    itemCount: totals.itemCount,
    subtotal: totals.subtotal,
    promotionName: totals.promotionName,
    promotionDiscount: totals.promotionDiscount,
    couponCode: cart.couponCode,
    couponDiscount: totals.couponDiscount,
    couponError: cart.couponCode && !couponRule ? "El cupón no existe." : totals.couponError,
    discountTotal: totals.discountTotal,
    total: totals.total,
    benefits: totals.benefits,
    freeShippingThreshold,
    hasIssues: lines.some((l) => l.issue),
    totals,
  };
}

export async function getCart(ctx?: CartContext) {
  return loadCart(await findCurrentCartId(), ctx);
}

export async function getCartCount(): Promise<number> {
  const cartId = await findCurrentCartId();
  if (!cartId) return 0;
  const agg = await db.cartItem.aggregate({ where: { cartId }, _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}

async function assertPurchasable(productId: string, quantity: number): Promise<void> {
  const product = await db.product.findUnique({ where: { id: productId }, select: { status: true, availableStock: true } });
  if (!product || product.status !== "ACTIVE") throw new AppError("NOT_FOUND", "El producto no está disponible.");
  if (product.availableStock < quantity) {
    throw new AppError(
      "OUT_OF_STOCK",
      product.availableStock === 0 ? "Este producto no tiene stock." : `Solo hay ${product.availableStock} unidades disponibles.`,
    );
  }
}

export async function addToCart(productId: string, quantity: number): Promise<void> {
  const cartId = await getOrCreateCartId();
  const current = await db.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } });
  const next = Math.min((current?.quantity ?? 0) + quantity, MAX_QUANTITY_PER_ITEM);
  await assertPurchasable(productId, next);
  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity: next },
    update: { quantity: next },
  });
}

export async function updateCartQuantity(productId: string, quantity: number): Promise<void> {
  const cartId = await findCurrentCartId();
  if (!cartId) return;
  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { cartId, productId } });
    return;
  }
  const next = Math.min(quantity, MAX_QUANTITY_PER_ITEM);
  await assertPurchasable(productId, next);
  await db.cartItem.update({ where: { cartId_productId: { cartId, productId } }, data: { quantity: next } });
}

export async function removeFromCart(productId: string): Promise<void> {
  const cartId = await findCurrentCartId();
  if (cartId) await db.cartItem.deleteMany({ where: { cartId, productId } });
}

export async function applyCoupon(code: string): Promise<void> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) throw new AppError("VALIDATION", "Ingresá un código de cupón.");
  const rule = await getCouponRule(normalized);
  if (!rule) throw new AppError("VALIDATION", "El cupón no existe.");
  const cartId = await getOrCreateCartId();
  const cart = await loadCart(cartId);
  const user = await getCurrentUser();
  const result = evaluateCoupon(
    rule,
    cart.lines.filter((l) => !l.issue).map((l) => ({ productId: l.productId, categoryId: l.product.category.id, unitPrice: l.product.price, quantity: l.quantity })),
    { userUses: user ? await countCouponUses(rule.id, { userId: user.id, email: user.email }) : 0 },
  );
  if (!result.ok) throw new AppError("VALIDATION", result.reason);
  await db.cart.update({ where: { id: cartId }, data: { couponCode: normalized } });
}

export async function removeCoupon(): Promise<void> {
  const cartId = await findCurrentCartId();
  if (cartId) await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
}

/** Al iniciar sesión, fusiona el carrito de invitado con el del usuario. */
export async function mergeGuestCart(userId: string): Promise<void> {
  const jar = await cookies();
  const guestId = jar.get(CART_COOKIE)?.value;
  if (!guestId) return;
  const guest = await db.cart.findFirst({ where: { id: guestId, userId: null }, include: { items: true } });
  jar.delete(CART_COOKIE);
  if (!guest) return;

  const userCart = await db.cart.findUnique({ where: { userId } });
  if (!userCart) {
    await db.cart.update({ where: { id: guest.id }, data: { userId } });
    return;
  }
  await db.$transaction(async (tx) => {
    for (const item of guest.items) {
      const existing = await tx.cartItem.findUnique({ where: { cartId_productId: { cartId: userCart.id, productId: item.productId } } });
      const quantity = Math.min((existing?.quantity ?? 0) + item.quantity, MAX_QUANTITY_PER_ITEM);
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
        create: { cartId: userCart.id, productId: item.productId, quantity },
        update: { quantity },
      });
    }
    if (guest.couponCode && !userCart.couponCode) {
      await tx.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
    }
    await tx.cart.delete({ where: { id: guest.id } });
  });
}

export async function clearCart(cartId: string): Promise<void> {
  await db.cartItem.deleteMany({ where: { cartId } });
  await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
}

export { findCurrentCartId };
