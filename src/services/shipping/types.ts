export interface ShippingMethodConfig {
  code: string;
  name: string;
  description: string | null;
  type: "HOME_DELIVERY" | "PICKUP";
  provider: string;
  price: number;
  freeThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface ShippingQuoteContext {
  /** Subtotal luego de descuentos (para envío gratis). */
  amount: number;
  weightGrams: number;
  postalCode?: string;
}

export interface ShippingQuote {
  code: string;
  name: string;
  description: string | null;
  type: "HOME_DELIVERY" | "PICKUP";
  price: number;
  originalPrice: number;
  freeThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

/**
 * Contrato para cotizadores de envío. Los transportistas (Andreani, OCA, Correo Argentino,
 * Mercado Envíos) se integran implementando esta interfaz y registrándose en registry.ts.
 */
export interface ShippingProvider {
  code: string;
  isAvailable(): boolean;
  quote(method: ShippingMethodConfig, ctx: ShippingQuoteContext): Promise<ShippingQuote | null>;
}
