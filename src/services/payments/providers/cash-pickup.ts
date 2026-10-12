import "server-only";
import { formatPrice } from "@/lib/format";
import { getStoreSettings } from "@/services/settings/settings.service";
import type { PaymentProvider } from "../types";

/** Pago en efectivo al retirar en el local. */
export const cashPickupProvider: PaymentProvider = {
  code: "cash_pickup",
  supportsInstallments: false,
  isAvailable: () => true,
  async initiate(order) {
    const settings = await getStoreSettings();
    return {
      status: "PENDING",
      instructions: {
        title: "Pagás al retirar",
        lines: [
          { label: "Importe", value: formatPrice(order.total) },
          ...(settings.address ? [{ label: "Dirección", value: settings.address }] : []),
          ...(settings.businessHours ? [{ label: "Horario", value: settings.businessHours }] : []),
        ],
        note: "Te avisamos por email cuando tu pedido esté listo para retirar.",
      },
    };
  },
};
