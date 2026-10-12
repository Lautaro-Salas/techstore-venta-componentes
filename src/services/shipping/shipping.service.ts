import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { SHIPPING_PROVIDERS } from "./providers";
import type { ShippingMethodConfig, ShippingQuote, ShippingQuoteContext } from "./types";

/** Memoizada: el layout la usa dos veces (métodos + umbral) por request. */
export const getActiveShippingMethods = cache(async (): Promise<ShippingMethodConfig[]> => {
  return db.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      code: true,
      name: true,
      description: true,
      type: true,
      provider: true,
      price: true,
      freeThreshold: true,
      estimatedDaysMin: true,
      estimatedDaysMax: true,
    },
  });
});

/** Cotiza todos los métodos activos cuyo proveedor está disponible. */
export async function quoteShipping(ctx: ShippingQuoteContext): Promise<ShippingQuote[]> {
  const methods = await getActiveShippingMethods();
  const quotes: ShippingQuote[] = [];
  for (const method of methods) {
    const provider = SHIPPING_PROVIDERS[method.provider];
    if (!provider?.isAvailable()) continue;
    try {
      const quote = await provider.quote(method, ctx);
      if (quote) quotes.push(quote);
    } catch (error) {
      logger.error("Error cotizando envío", error, { method: method.code });
    }
  }
  return quotes;
}

/** Umbral de envío gratis más bajo entre los métodos a domicilio (para mensajes en el carrito). */
export async function lowestFreeShippingThreshold(): Promise<number | null> {
  const methods = await getActiveShippingMethods();
  const thresholds = methods
    .filter((m) => m.type === "HOME_DELIVERY" && m.freeThreshold !== null)
    .map((m) => m.freeThreshold as number);
  return thresholds.length ? Math.min(...thresholds) : null;
}
