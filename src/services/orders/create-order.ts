import "server-only";
import { after } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { SessionUser } from "@/types/auth";
import type { CheckoutInput } from "@/schemas/checkout";
import { getCart } from "@/services/cart/cart.service";
import { getCouponRule } from "@/services/discounts/discounts.service";
import { reserveStock } from "@/services/inventory/inventory.service";
import { notify } from "@/services/notifications/notification.service";
import { getAvailablePaymentMethods, getPaymentProvider } from "@/services/payments/registry";
import type { PaymentInstructions } from "@/services/payments/types";
import { quoteShipping } from "@/services/shipping/shipping.service";

export interface CreatedOrder {
  orderId: string;
  orderNumber: number;
  redirectUrl?: string;
  instructions?: PaymentInstructions;
  /**
   * El pedido se creó pero no se pudo iniciar el pago con el proveedor.
   * El pedido queda PENDING y el pago REJECTED, para que el admin pueda
   * resolverlo; la UI debe avisarle al cliente en lugar de mostrar un éxito.
   */
  paymentFailed?: boolean;
}

const GRAMS_FALLBACK = 1000;

/** Peso del carrito: usa el peso real del producto cuando está cargado (card), si no el fallback. */
function cartWeightGrams(cart: {
  lines: { product: { weightGrams: number | null }; quantity: number }[];
}) {
  return cart.lines.reduce(
    (sum, l) => sum + (l.product.weightGrams ?? GRAMS_FALLBACK) * l.quantity,
    0,
  );
}

async function resolveMethods(input: CheckoutInput, amount: number, weightGrams: number) {
  const quotes = await quoteShipping({
    amount,
    weightGrams,
    postalCode: input.address?.postalCode,
  });
  const shipping = quotes.find((q) => q.code === input.shippingMethodCode);
  if (!shipping) throw new AppError("VALIDATION", "El método de envío elegido no está disponible.");
  if (shipping.type === "HOME_DELIVERY" && !input.address) {
    throw new AppError("VALIDATION", "Ingresá la dirección de entrega.");
  }
  const payment = (await getAvailablePaymentMethods()).find(
    (m) => m.code === input.paymentMethodCode,
  );
  if (!payment) throw new AppError("VALIDATION", "El medio de pago elegido no está disponible.");
  if (payment.requiresPickup && shipping.type !== "PICKUP") {
    throw new AppError(
      "VALIDATION",
      "El pago en efectivo solo está disponible con retiro en local.",
    );
  }
  return { shipping, payment };
}

export async function createOrder(
  input: CheckoutInput,
  user: SessionUser | null,
): Promise<CreatedOrder> {
  const preview = await getCart({ email: input.contact.email });
  if (!preview.id || preview.lines.length === 0)
    throw new AppError("VALIDATION", "Tu carrito está vacío.");
  if (preview.hasIssues)
    throw new AppError(
      "OUT_OF_STOCK",
      "Hay productos sin stock suficiente en tu carrito. Revisalo antes de continuar.",
    );

  const weightGrams = cartWeightGrams(preview);
  const { shipping, payment } = await resolveMethods(
    input,
    preview.subtotal - preview.discountTotal,
    weightGrams,
  );
  const cart = await getCart({
    email: input.contact.email,
    shipping: { price: shipping.originalPrice, freeThreshold: shipping.freeThreshold },
    paymentDiscountPercent: payment.discountPercent,
  });
  const installments = payment.supportsInstallments ? input.installments : 1;
  const cartId = cart.id as string;
  const coupon =
    cart.couponCode && cart.couponDiscount > 0 ? await getCouponRule(cart.couponCode) : null;

  /** P2002: violación de índice único. */
  function isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }

  /** Intentos ante colisión del correlativo (ver createOrderInTx). */
  const ORDER_NUMBER_ATTEMPTS = 3;

  const createOrderInTx = () =>
    db.$transaction(async (tx) => {
      // SQLite no admite autoincrement fuera de la PK: el correlativo se calcula en código.
      // Dos compras simultáneas pueden leer el mismo último número y chocar contra el
      // índice único de Order.number; por eso el llamador reintenta la transacción
      // completa (el rollback revierte stock, cupón y carrito antes del reintento).
      const last = await tx.order.findFirst({
        orderBy: { number: "desc" },
        select: { number: true },
      });
      const created = await tx.order.create({
        data: {
          number: (last?.number ?? 0) + 1,
          userId: user?.id,
          email: input.contact.email,
          firstName: input.contact.firstName,
          lastName: input.contact.lastName,
          phone: input.contact.phone,
          documentType: input.contact.documentType,
          documentNumber: input.contact.documentNumber,
          invoiceType: input.contact.invoiceType,
          businessName: input.contact.businessName || null,
          shippingAddress:
            shipping.type === "HOME_DELIVERY"
              ? (input.address as Prisma.InputJsonValue)
              : undefined,
          shippingMethodCode: shipping.code,
          shippingMethodName: shipping.name,
          paymentMethodCode: payment.code,
          paymentMethodName: payment.name,
          subtotal: cart.subtotal,
          discountTotal: cart.discountTotal,
          shippingTotal: cart.totals.shipping ?? 0,
          total: cart.total,
          couponCode: coupon?.code,
          notes: input.notes || null,
          items: {
            create: cart.lines.map((l) => ({
              productId: l.productId,
              productName: l.product.name,
              sku: l.product.sku,
              unitPrice: l.product.price,
              quantity: l.quantity,
              total: l.lineTotal,
            })),
          },
          history: { create: { status: "PENDING", note: "Pedido creado", userId: user?.id } },
          shipment: { create: { methodCode: shipping.code, cost: cart.totals.shipping ?? 0 } },
          payments: { create: { provider: payment.code, amount: cart.total, installments } },
        },
      });

      await reserveStock(
        tx,
        cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        created.id,
      );

      if (coupon) {
        const claimed = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            ...(coupon.maxUses ? { usedCount: { lt: coupon.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0)
          throw new AppError("CONFLICT", "El cupón alcanzó su límite de usos.");
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            orderId: created.id,
            userId: user?.id,
            email: input.contact.email,
          },
        });
      }

      if (user && input.saveAddress && input.address && shipping.type === "HOME_DELIVERY") {
        const hasAddresses = (await tx.address.count({ where: { userId: user.id } })) > 0;
        await tx.address.create({
          data: { ...input.address, userId: user.id, isDefault: !hasAddresses },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId } });
      await tx.cart.update({ where: { id: cartId }, data: { couponCode: null } });
      return created;
    });

  let order: Awaited<ReturnType<typeof createOrderInTx>>;
  for (let attempt = 1; ; attempt += 1) {
    try {
      order = await createOrderInTx();
      break;
    } catch (error) {
      if (attempt >= ORDER_NUMBER_ATTEMPTS || !isUniqueViolation(error)) throw error;
      logger.warn("Correlativo de pedido ocupado, reintentando la transacción", {
        attempt,
      });
    }
  }

  const result: CreatedOrder = { orderId: order.id, orderNumber: order.number };
  try {
    const provider = getPaymentProvider(payment.code);
    const init = await provider!.initiate(
      {
        id: order.id,
        number: order.number,
        total: order.total,
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        shippingTotal: order.shippingTotal,
        email: order.email,
        items: cart.lines.map((l) => ({
          name: l.product.name,
          quantity: l.quantity,
          unitPrice: l.product.price,
        })),
      },
      installments,
    );
    result.redirectUrl = init.redirectUrl;
    result.instructions = init.instructions;
    await db.payment.updateMany({
      where: { orderId: order.id },
      data: {
        externalId: init.externalId,
        metadata: init.instructions
          ? ({ instructions: init.instructions } as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    logger.error("No se pudo iniciar el pago", error, { orderId: order.id });
    // El pedido ya está creado y con stock reservado: no se lo destruye, pero
    // tampoco se lo debe reportar como exitoso. Se marca el pago como rechazado
    // para que quede visible en el admin y se avisa al cliente.
    result.paymentFailed = true;
    await db.payment.updateMany({
      where: { orderId: order.id, status: "PENDING" },
      data: { status: "REJECTED" },
    });
  }

  after(() =>
    notify({
      event: "order.created",
      email: order.email,
      userId: user?.id,
      data: {
        firstName: order.firstName,
        orderId: order.id,
        orderNumber: order.number,
        total: order.total,
      },
    }),
  );
  return result;
}
