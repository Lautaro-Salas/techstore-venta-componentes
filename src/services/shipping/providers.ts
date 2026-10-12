import type { ShippingMethodConfig, ShippingProvider, ShippingQuote, ShippingQuoteContext } from "./types";

/** Calcula el costo final aplicando el umbral de envío gratis. */
export function flatQuote(method: ShippingMethodConfig, ctx: ShippingQuoteContext): ShippingQuote {
  const free = method.freeThreshold !== null && ctx.amount >= method.freeThreshold;
  return {
    code: method.code,
    name: method.name,
    description: method.description,
    type: method.type,
    price: free ? 0 : method.price,
    originalPrice: method.price,
    freeThreshold: method.freeThreshold,
    estimatedDaysMin: method.estimatedDaysMin,
    estimatedDaysMax: method.estimatedDaysMax,
  };
}

/** Tarifa fija configurable desde el admin (estándar / express). */
export const flatRateProvider: ShippingProvider = {
  code: "flat",
  isAvailable: () => true,
  quote: async (method, ctx) => flatQuote(method, ctx),
};

/** Retiro en local: sin costo salvo que el admin configure uno. */
export const pickupProvider: ShippingProvider = {
  code: "pickup",
  isAvailable: () => true,
  quote: async (method, ctx) => flatQuote(method, ctx),
};

/**
 * Transportistas externos: quedan registrados pero deshabilitados hasta que existan
 * credenciales y una implementación real de cotización. No se inventan tarifas.
 */
function carrierPlaceholder(code: string, envKey: string): ShippingProvider {
  return {
    code,
    isAvailable: () => false,
    quote: async () => {
      throw new Error(`Integración ${code} pendiente: configurar ${envKey} e implementar la cotización.`);
    },
  };
}

export const SHIPPING_PROVIDERS: Record<string, ShippingProvider> = {
  flat: flatRateProvider,
  pickup: pickupProvider,
  andreani: carrierPlaceholder("andreani", "ANDREANI_API_KEY"),
  oca: carrierPlaceholder("oca", "OCA_API_KEY"),
  correo_argentino: carrierPlaceholder("correo_argentino", "CORREO_ARGENTINO_API_KEY"),
  mercado_envios: carrierPlaceholder("mercado_envios", "MP_ACCESS_TOKEN"),
};
