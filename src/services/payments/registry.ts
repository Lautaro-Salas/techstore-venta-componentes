import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { bankTransferProvider } from "./providers/bank-transfer";
import { cashPickupProvider } from "./providers/cash-pickup";
import { mercadoPagoProvider } from "./providers/mercadopago";
import type { PaymentProvider } from "./types";

const PROVIDERS: Record<string, PaymentProvider> = {
  [bankTransferProvider.code]: bankTransferProvider,
  [cashPickupProvider.code]: cashPickupProvider,
  [mercadoPagoProvider.code]: mercadoPagoProvider,
};

export function getPaymentProvider(code: string): PaymentProvider | undefined {
  return PROVIDERS[code];
}

/** Códigos de proveedores registrados (para crear medios de pago en el admin). */
export function getPaymentProviderCodes(): string[] {
  return Object.keys(PROVIDERS);
}

export interface AvailablePaymentMethod {
  code: string;
  name: string;
  description: string | null;
  discountPercent: number;
  supportsInstallments: boolean;
  /** Solo disponible con retiro en local. */
  requiresPickup: boolean;
}

/** Medios activos en el admin y cuyo proveedor tiene la configuración necesaria. Memoizada por request. */
export const getAvailablePaymentMethods = cache(async (): Promise<AvailablePaymentMethod[]> => {
  const methods = await db.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return methods
    .filter((m) => getPaymentProvider(m.code)?.isAvailable())
    .map((m) => ({
      code: m.code,
      name: m.name,
      description: m.description,
      discountPercent: m.discountPercent,
      supportsInstallments: getPaymentProvider(m.code)?.supportsInstallments ?? false,
      requiresPickup: m.code === cashPickupProvider.code,
    }));
});
